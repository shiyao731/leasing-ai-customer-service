import { NextRequest } from "next/server";
import { prisma, openai, aiModel, searchFaq, buildSystemPrompt, sendNotification } from "@leasing/core";

export const runtime = "nodejs";
export const maxDuration = 60;

function parseAction(content: string): {
  cleanContent: string;
  action: { type: string; params: Record<string, string> } | null;
} {
  const actionRegex = /\[ACTION:(\w+)(\|[^\]]+)?\]/;
  const match = content.match(actionRegex);

  if (!match) {
    return { cleanContent: content, action: null };
  }

  const type = match[1];
  const paramsStr = match[2] || "";
  const params: Record<string, string> = {};

  if (paramsStr) {
    paramsStr
      .slice(1) // remove leading |
      .split("|")
      .forEach((pair) => {
        const [key, ...vals] = pair.split(":");
        params[key] = vals.join(":");
      });
  }

  const cleanContent = content.replace(actionRegex, "").trim();
  return { cleanContent, action: { type, params } };
}

export async function POST(req: NextRequest) {
  try {
    const { message, tenantId, sessionId, images } = await req.json();

    if (!message?.trim() && (!images || images.length === 0)) {
      return Response.json({ error: "消息不能为空" }, { status: 400 });
    }

    // When only images uploaded without text, provide context for AI
    const effectiveMessage = message?.trim() || "[上传了现场照片]";

    // Load tenant context first
    let tenant = null;
    if (tenantId) {
      tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: {
          id: true, name: true, roomNo: true, phone: true,
          leaseStart: true, leaseEnd: true, monthlyRent: true,
          billStatus: true, overdueDays: true, totalDue: true,
          activated: true,
        },
      });
    }

    // === Keyword-based intent pre-check ===
    const msgLower = effectiveMessage.toLowerCase();
    const repairKeywords = ["空调", "马桶", "冰箱", "洗衣机", "热水器", "门锁", "窗户", "水管", "漏水", "堵", "坏了", "不制冷", "不制热", "打不开", "关不上", "修", "报修", "故障", "跳闸", "断电", "没电"];
    const handoffKeywords = ["转人工", "转接", "找管家", "联系管家", "人工客服", "人工服务", "不要ai", "不要机器人", "投诉", "太吵", "噪音", "人工", "管家服务", "客服"];
    const closeKeywords = ["结束人工", "不需要了", "关闭对话", "不用管家"];
    const isRepair = repairKeywords.some(k => msgLower.includes(k));
    const isHandoff = handoffKeywords.some(k => msgLower.includes(k));
    const isClose = closeKeywords.some(k => msgLower.includes(k));

    // === Bridge check: if claimed handoff exists, route to manager (AI stays silent) ===
    let activeHandoff: any = null;
    if (tenant) {
      activeHandoff = await prisma.handoffRequest.findFirst({
        where: { status: "claimed", tenantName: tenant.name },
        orderBy: { createdAt: "desc" },
      });

      if (activeHandoff) {
        // Only "goodbye" is handled specially — everything else goes to manager
        if (isClose) {
          await prisma.handoffRequest.update({
            where: { id: activeHandoff.id },
            data: { status: "closed" },
          });
          return Response.json({
            reply: "已结束人工对话～还有什么可以帮您的吗？😊",
            action: null, // No action → AI resumes
            sessionId, tenant,
          });
        }

        // Pure forwarding: all messages go to manager, no AI interference
        const existing = activeHandoff.messages ? JSON.parse(activeHandoff.messages) : [];
        existing.push({ role: "user", content: effectiveMessage, sender: tenant.name, time: new Date().toISOString() });
        await prisma.handoffRequest.update({ where: { id: activeHandoff.id }, data: { messages: JSON.stringify(existing) } });

        // Silent: no system message, just keep the handoff ID for polling
        return Response.json({
          reply: "",
          action: { type: "MANAGER_CHAT", params: { handoffId: activeHandoff.id } },
          sessionId, tenant,
        });
      }
    }

    // === AI mode (no active claimed handoff) ===
    // RAG search — always run for business intent detection
    const faqResults = await searchFaq(effectiveMessage);

    // Load settings
    const settings = await prisma.settings.findUnique({
      where: { id: "singleton" },
    });
    const isNightMode = settings?.nightMode ?? false;

    // Load recent history
    let history: { role: string; content: string; time: string }[] = [];
    if (sessionId) {
      const conv = await prisma.conversation.findUnique({
        where: { id: sessionId },
      });
      if (conv?.messages) {
        history = JSON.parse(conv.messages);
      }
    }

    // Build system prompt
    const systemPrompt = buildSystemPrompt({
      faqResults,
      tenant: tenant as any,
      isNightMode,
      history: history as any,
    });

    // Call LLM
    const messages: any[] = [
      { role: "system", content: systemPrompt },
      ...(history.length > 0
        ? history
            .slice(-10)
            .map((m) => ({ role: m.role, content: m.content }))
        : []),
      { role: "user", content: effectiveMessage },
    ];

    const response = await openai.chat.completions.create({
      model: aiModel,
      messages,
      temperature: 0.7,
      max_tokens: 1000,
    });

    const content = response.choices[0]?.message?.content || "抱歉，我暂时无法回复。";

    // Parse action from response
    let { cleanContent, action } = parseAction(content);

    // Keyword fallback: only for handoff — repair orders are AI-driven multi-turn
    if (!action && isHandoff) {
      action = { type: "HANDOFF", params: { summary: effectiveMessage } };
    }

    // Simplify reply for HANDOFF (no verbose AI)
    if (action?.type === "HANDOFF") {
      cleanContent = "好的，已收到您的请求，正在为您转接管家，请稍候～ 😊";
    }

    // Execute action

    // === Accumulate pending images from recent conversation ===
    let allImages = "[]";
    {
      let pending: string[] = [];
      for (const m of history) {
        if (m.role === "system" && m.content.startsWith("[PENDING_IMAGES:")) {
          try {
            const paths = JSON.parse(m.content.slice("[PENDING_IMAGES:".length, -1));
            pending.push(...paths);
          } catch {}
        }
      }
      if (images?.length) pending.push(...images);
      allImages = pending.length > 0 ? JSON.stringify(pending) : "[]";
    }

    if (action) {
      switch (action.type) {
        case "CREATE_ORDER": {
          const orderCount = await prisma.workOrder.count();
          const now = new Date();
          const dateStr = `${String(now.getFullYear()).slice(2)}${String(now.getMonth()+1).padStart(2,"0")}${String(now.getDate()).padStart(2,"0")}`;
          const orderNo = `AP001${dateStr}${String(orderCount + 1).padStart(3, "0")}`;
          await prisma.workOrder.create({
            data: {
              orderNo,
              tenantName: tenant?.name || "未知",
              roomNo: tenant?.roomNo || "未知",
              phone: tenant?.phone || "未知",
              category: action.params.category || "other",
              description: action.params.description || effectiveMessage,
              aiSummary: action.params.summary || effectiveMessage,
              contactPhone: action.params.contactPhone || tenant?.phone || "未知",
              visitTime: action.params.visitTime || "",
              images: allImages,
              status: "pending",
            },
          });

          if (isNightMode) {
            await sendNotification({
              type: "night_urgent",
              tenantName: tenant?.name || "未知",
              roomNo: tenant?.roomNo || "未知",
              summary: action.params.summary || effectiveMessage,
            });
          } else {
            await sendNotification({
              type: "work_order",
              tenantName: tenant?.name || "未知",
              roomNo: tenant?.roomNo || "未知",
              summary: action.params.summary || effectiveMessage,
            });
          }
          break;
        }
        case "HANDOFF": {
          // Find tenant's assigned manager
          let managerName: string | null = null;
          let assignStatus = "pending";

          if (tenant?.id) {
            const tenantRecord = await prisma.tenant.findUnique({
              where: { id: tenant.id },
              select: { managerId: true },
            });
            if (tenantRecord?.managerId) {
              const mgr = await prisma.manager.findUnique({
                where: { id: tenantRecord.managerId },
              });
              if (mgr?.isOnDuty) {
                managerName = mgr.name;
                assignStatus = "assigned";
              }
            }
          }

          // Create handoff request
          const newHandoff = await prisma.handoffRequest.create({
            data: {
              tenantName: tenant?.name || "访客",
              roomNo: tenant?.roomNo || "未知",
              phone: tenant?.phone || "未知",
              summary: action.params.summary || "转人工请求",
              status: assignStatus,
              assignee: managerName,
            },
          });

          // Attach handoff ID to action params so frontend can poll
          action.params.handoffId = newHandoff.id;

          // Notify (mock → console / real WeCom webhook)
          await sendNotification({
            type: "handoff",
            tenantName: tenant?.name || "未知",
            roomNo: tenant?.roomNo || "未知",
            summary: action.params.summary || "转人工请求",
            phone: tenant?.phone,
          });
          break;
        }
        case "NIGHT_URGENT": {
          await sendNotification({
            type: "night_urgent",
            tenantName: tenant?.name || "未知",
            roomNo: tenant?.roomNo || "未知",
            summary: action.params.summary || effectiveMessage,
          });
          break;
        }
      }
    }

    // Save or update conversation
    // Embed pending images as system message if no CREATE_ORDER this turn
    const hasCreateOrder = action?.type === "CREATE_ORDER";
    const newMessages = [
      ...history,
      { role: "user", content: effectiveMessage, time: new Date().toISOString() },
      { role: "assistant", content: cleanContent, time: new Date().toISOString() },
    ];
    if (images?.length && !hasCreateOrder) {
      newMessages.push({
        role: "system",
        content: `[PENDING_IMAGES:${JSON.stringify(images)}]`,
        time: new Date().toISOString(),
      });
    }
    const newRound = newMessages;

    if (sessionId) {
      await prisma.conversation.update({
        where: { id: sessionId },
        data: {
          messages: JSON.stringify(newRound),
          resolved: !action || action.type !== "HANDOFF",
          handoffAt: action?.type === "HANDOFF" ? new Date() : undefined,
        },
      });
    } else {
      const newConv = await prisma.conversation.create({
        data: {
          tenantId: tenant?.id || "guest",
          tenantName: tenant?.name || "访客",
          messages: JSON.stringify(newRound),
          resolved: !action || action.type !== "HANDOFF",
          handoffAt: action?.type === "HANDOFF" ? new Date() : null,
        },
      });
      // Return sessionId for subsequent requests
      return Response.json({
        reply: cleanContent,
        action,
        sessionId: newConv.id,
        tenant,
      });
    }

    return Response.json({
      reply: cleanContent,
      action,
      sessionId,
      tenant,
    });
  } catch (error: any) {
    console.error("Chat API error:", error);
    return Response.json(
      { error: "AI服务暂时不可用", detail: error.message },
      { status: 500 }
    );
  }
}
