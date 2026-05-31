import { prisma } from "@leasing/core";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const category = searchParams.get("category");

  const where: any = {};
  if (status && status !== "all") where.status = status;
  if (category && category !== "all") where.category = category;

  const orders = await prisma.workOrder.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return Response.json(orders);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const orderCount = await prisma.workOrder.count();
  const now = new Date();
  const dateStr = `${String(now.getFullYear()).slice(2)}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const orderNo = `AP001${dateStr}${String(orderCount + 1).padStart(3, "0")}`;

  const order = await prisma.workOrder.create({
    data: {
      orderNo,
      tenantName: body.tenantName || "",
      roomNo: body.roomNo || "",
      phone: body.phone || "",
      category: body.category || "other",
      description: body.description || "",
      aiSummary: body.aiSummary || "",
      contactPhone: body.contactPhone || body.phone || "",
      visitTime: body.visitTime || "",
      images: body.images || "[]",
      status: "pending",
      assignee: body.assignee || null,
    },
  });

  return Response.json(order);
}
