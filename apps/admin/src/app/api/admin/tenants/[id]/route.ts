import { prisma } from "@leasing/core";
import { NextRequest } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const tenant = await prisma.tenant.findUnique({ where: { id: params.id } });
  if (!tenant) return Response.json({ error: "Not found" }, { status: 404 });

  const conversations = await prisma.conversation.findMany({
    where: { tenantId: tenant.name },
    orderBy: { createdAt: "desc" },
  });

  const orders = await prisma.workOrder.findMany({
    where: { tenantName: tenant.name },
    orderBy: { createdAt: "desc" },
  });

  return Response.json({ tenant, conversations, orders });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json();
  const data: any = {};

  if (body.name !== undefined) data.name = body.name;
  if (body.roomNo !== undefined) data.roomNo = body.roomNo;
  if (body.phone !== undefined) data.phone = body.phone;
  if (body.managerId !== undefined) data.managerId = body.managerId || null;
  if (body.leaseStart) data.leaseStart = new Date(body.leaseStart);
  if (body.leaseEnd) data.leaseEnd = new Date(body.leaseEnd);
  if (body.monthlyRent !== undefined) data.monthlyRent = body.monthlyRent;
  if (body.billStatus !== undefined) data.billStatus = body.billStatus;
  if (body.overdueDays !== undefined) data.overdueDays = body.overdueDays;
  if (body.totalDue !== undefined) data.totalDue = body.totalDue;

  const tenant = await prisma.tenant.update({
    where: { id: params.id },
    data,
  });

  return Response.json(tenant);
}
