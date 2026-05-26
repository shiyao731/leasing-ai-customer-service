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
