import { prisma } from "@leasing/core";
import { NextRequest } from "next/server";

export async function GET() {
  const managers = await prisma.manager.findMany({ orderBy: { createdAt: "desc" } });
  return Response.json(managers);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const manager = await prisma.manager.create({
    data: {
      name: body.name,
      phone: body.phone,
      isOnDuty: body.isOnDuty ?? true,
    },
  });
  return Response.json(manager);
}
