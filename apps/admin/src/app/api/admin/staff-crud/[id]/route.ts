import { prisma } from "@leasing/core";
import { NextRequest } from "next/server";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json();
  const data: any = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.specialty !== undefined) data.specialty = body.specialty;
  if (body.phone !== undefined) data.phone = body.phone;

  const staff = await prisma.maintenanceStaff.update({
    where: { id: params.id },
    data,
  });
  return Response.json(staff);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  await prisma.maintenanceStaff.delete({ where: { id: params.id } });
  return Response.json({ success: true });
}
