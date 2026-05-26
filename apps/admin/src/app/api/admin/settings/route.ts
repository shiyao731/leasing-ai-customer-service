import { prisma } from "@leasing/core";
import { NextRequest } from "next/server";

export async function GET() {
  let settings = await prisma.settings.findUnique({
    where: { id: "singleton" },
  });
  if (!settings) {
    settings = await prisma.settings.create({
      data: { id: "singleton", nightMode: false },
    });
  }
  return Response.json(settings);
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const settings = await prisma.settings.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", nightMode: body.nightMode ?? false },
    update: { nightMode: body.nightMode ?? false },
  });
  return Response.json(settings);
}
