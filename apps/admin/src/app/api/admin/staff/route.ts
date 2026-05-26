import { prisma } from "@leasing/core";
import { NextRequest } from "next/server";

export async function GET() {
  const staff = await prisma.maintenanceStaff.findMany();
  return Response.json(staff);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const staff = await prisma.maintenanceStaff.create({
    data: {
      name: body.name,
      specialty: body.specialty,
      phone: body.phone,
    },
  });
  return Response.json(staff);
}
