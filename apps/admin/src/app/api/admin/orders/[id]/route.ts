import { prisma } from "@leasing/core";
import { NextRequest } from "next/server";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json();
  const order = await prisma.workOrder.update({
    where: { id: params.id },
    data: {
      ...(body.status && { status: body.status }),
      ...(body.assignee && { assignee: body.assignee }),
      ...(body.status === "completed" && { completedAt: new Date() }),
    },
  });
  return Response.json(order);
}
