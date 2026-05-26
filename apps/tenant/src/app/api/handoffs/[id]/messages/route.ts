import { prisma } from "@leasing/core";
import { NextRequest } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const handoff = await prisma.handoffRequest.findUnique({
    where: { id: params.id },
  });
  if (!handoff) return Response.json({ messages: [] }, { status: 404 });
  const messages = handoff.messages ? JSON.parse(handoff.messages) : [];
  return Response.json({ messages });
}
