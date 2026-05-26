export async function sendNotification(params: {
  type: "work_order" | "handoff" | "night_urgent";
  tenantName: string;
  roomNo: string;
  summary: string;
  phone?: string;
}): Promise<void> {
  // Demo: 仅 console.log，后续可对接企微/短信 API
  console.log(`\n=== 通知管家 ===`);
  console.log(`类型: ${params.type}`);
  console.log(`租客: ${params.tenantName} | ${params.roomNo}`);
  console.log(`摘要: ${params.summary}`);
  console.log(`================\n`);
}
