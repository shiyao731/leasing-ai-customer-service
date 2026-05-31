import { prisma } from "@leasing/core";
import { NextRequest } from "next/server";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json();
  const data: any = {};

  // Editable string fields
  const fields = [
    "tenantName", "roomNo", "phone", "category",
    "description", "aiSummary", "contactPhone", "visitTime",
    "status", "assignee", "images",
  ];
  for (const f of fields) {
    if (body[f] !== undefined) data[f] = body[f];
  }

  if (body.status === "completed" && body.completedAt === undefined) {
    data.completedAt = new Date();
  }
  if (body.completedAt !== undefined) {
    data.completedAt = body.completedAt ? new Date(body.completedAt) : null;
  }

  const order = await prisma.workOrder.update({
    where: { id: params.id },
    data,
  });
  return Response.json(order);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  await prisma.workOrder.delete({ where: { id: params.id } });
  return Response.json({ success: true });
}
