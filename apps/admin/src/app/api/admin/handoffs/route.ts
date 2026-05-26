import { prisma } from "@leasing/core";

export async function GET() {
  const handoffs = await prisma.handoffRequest.findMany({
    where: { status: { in: ["pending", "assigned"] } },
    orderBy: { createdAt: "desc" },
  });

  const managers = await prisma.manager.findMany();

  return Response.json({ handoffs, managers });
}
