import { NextRequest } from "next/server";
import { verifyTenant } from "@leasing/core";

export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json();

    if (!phone) {
      return Response.json({ error: "请输入手机号" }, { status: 400 });
    }

    const tenant = await verifyTenant(phone);

    if (!tenant) {
      return Response.json(
        { verified: false, message: "未找到您的信息，请联系管家登记哦～" },
        { status: 200 }
      );
    }

    return Response.json({
      verified: true,
      tenant,
      message: `已确认～${tenant.name}您好，欢迎回来！有什么可以帮您的？😊`,
    });
  } catch (error: any) {
    console.error("Verify API error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
