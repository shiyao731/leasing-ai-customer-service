import { prisma } from "@leasing/core";
import { NextRequest } from "next/server";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json();

  const data: any = {};
  if (body.status) data.status = body.status;
  if (body.claimedBy) {
    data.claimedBy = body.claimedBy;
    data.claimedAt = new Date();
  }

  const handoff = await prisma.handoffRequest.update({
    where: { id: params.id },
    data,
  });

  return Response.json(handoff);
}
