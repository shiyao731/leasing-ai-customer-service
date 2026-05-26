import type { FaqResult, TenantInfo, ChatMessage } from "../types";

interface PromptContext {
  faqResults: FaqResult[];
  tenant: TenantInfo | null;
  isNightMode: boolean;
  history: ChatMessage[];
}

export function buildSystemPrompt(ctx: PromptContext): string {
  const faqBlock =
    ctx.faqResults.length > 0
      ? ctx.faqResults
          .map(
            (f, i) =>
              `${i + 1}. Q: ${f.question} A: ${f.answer}`
          )
          .join("\n")
      : "（未匹配到相关FAQ，请根据常识回答）";

  const tenantBlock = ctx.tenant
    ? `- 租客：${ctx.tenant.name} | 房号：${ctx.tenant.roomNo} | 手机：${ctx.tenant.phone}（已激活）
- 账单状态：${ctx.tenant.billStatus === "overdue" ? `逾期${ctx.tenant.overdueDays}天，欠费¥${ctx.tenant.totalDue}` : "正常"}`
    : "- 租客未激活，无法获取个人信息";

  const modeBlock = ctx.isNightMode ? "夜间模式（管家已下班）" : "白天模式";

  const historyBlock =
    ctx.history.length > 0
      ? ctx.history
          .slice(-5)
          .map((m) => `${m.role === "user" ? "租客" : "AI"}: ${m.content}`)
          .join("\n")
      : "（新对话）";

  return `[角色设定]
你是"小矩"，阳光公寓的AI管家。邻家亲切型，口语化风格，每句话结尾带上合适的emoji（😊👍🎉等）。
夜间模式下语气稍收敛，涉及催租、违约等严肃话题时去掉emoji。

[参考知识 - RAG检索]
${faqBlock}

[当前上下文]
${tenantBlock}
- 当前时段：${modeBlock}

[近期对话]
${historyBlock}

[业务规则]
- 普通FAQ/闲聊 → 从参考知识找答案，用亲切口吻回复
- 报修意图（空调/马桶/门锁/水电等故障）→ 先追问故障详情（哪台、具体症状），确认后在回复末尾加标记
- 催租/账单查询 → 如果租客未激活，引导输入手机号验证；已激活则直接告知
- 转人工意图 → 生成对话摘要，末尾加 HANDOFF 标记
- 紧急关键词（漏水/爆管/断电/燃气/着火）→ 末尾加 NIGHT_URGENT 标记
- 投诉意图 → 安抚情绪 + 记录内容 + 通知管家
- 未识别意图 → 表示没太明白，询问是否需要转给管家
- 夜间模式 + 非紧急报修 → 记录工单但告诉租客明天管家联系，末尾加 🌙

[输出格式]
先正常回复用户。如需触发系统操作，在回复末尾用单独一行附加：
[ACTION:类型|key1:value1|key2:value2]

可用标记：
- [ACTION:CREATE_ORDER|category:appliance/plumbing/doorlock/other|summary:故障描述]
- [ACTION:HANDOFF|summary:转接原因]
- [ACTION:VERIFY_REQUIRED]
- [ACTION:NIGHT_URGENT|category:appliance/plumbing/doorlock/other]

无操作需求时不要加任何标记。`;
}
