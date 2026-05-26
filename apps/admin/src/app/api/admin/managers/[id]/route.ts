import { prisma } from "@leasing/core";
import { NextRequest } from "next/server";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json();
  const data: any = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.phone !== undefined) data.phone = body.phone;
  if (body.isOnDuty !== undefined) data.isOnDuty = body.isOnDuty;

  const manager = await prisma.manager.update({
    where: { id: params.id },
    data,
  });
  return Response.json(manager);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  await prisma.manager.delete({ where: { id: params.id } });
  return Response.json({ success: true });
}
