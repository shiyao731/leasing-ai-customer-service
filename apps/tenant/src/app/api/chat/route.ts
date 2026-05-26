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
    const { message, tenantId, sessionId } = await req.json();

    if (!message?.trim()) {
      return Response.json({ error: "消息不能为空" }, { status: 400 });
    }

    // Load tenant context
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

    // RAG search
    const faqResults = await searchFaq(message);

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
      { role: "user", content: message },
    ];

    const response = await openai.chat.completions.create({
      model: aiModel,
      messages,
      temperature: 0.7,
      max_tokens: 1000,
    });

    const content = response.choices[0]?.message?.content || "抱歉，我暂时无法回复。";

    // Parse action from response
    const { cleanContent, action } = parseAction(content);

    // Execute action
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
              description: message,
              aiSummary: action.params.summary || message,
              status: isNightMode ? "pending" : "pending",
            },
          });

          if (isNightMode) {
            await sendNotification({
              type: "night_urgent",
              tenantName: tenant?.name || "未知",
              roomNo: tenant?.roomNo || "未知",
              summary: action.params.summary || message,
            });
          } else {
            await sendNotification({
              type: "work_order",
              tenantName: tenant?.name || "未知",
              roomNo: tenant?.roomNo || "未知",
              summary: action.params.summary || message,
            });
          }
          break;
        }
        case "HANDOFF": {
          await sendNotification({
            type: "handoff",
            tenantName: tenant?.name || "未知",
            roomNo: tenant?.roomNo || "未知",
            summary: action.params.summary || "转人工请求",
          });
          break;
        }
        case "NIGHT_URGENT": {
          await sendNotification({
            type: "night_urgent",
            tenantName: tenant?.name || "未知",
            roomNo: tenant?.roomNo || "未知",
            summary: action.params.summary || message,
          });
          break;
        }
      }
    }

    // Save or update conversation
    const newRound = [
      ...history,
      { role: "user", content: message, time: new Date().toISOString() },
      { role: "assistant", content: cleanContent, time: new Date().toISOString() },
    ];

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
