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
