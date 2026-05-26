import { prisma } from "@leasing/core";
import { NextRequest } from "next/server";

// Get messages for a handoff
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

// Manager sends a message to the tenant
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json();

  const handoff = await prisma.handoffRequest.findUnique({
    where: { id: params.id },
  });
  if (!handoff) return Response.json({ error: "Not found" }, { status: 404 });

  const existing = handoff.messages ? JSON.parse(handoff.messages) : [];
  existing.push({
    role: body.role || "manager",
    content: body.content,
    sender: body.sender,
    time: new Date().toISOString(),
  });

  await prisma.handoffRequest.update({
    where: { id: params.id },
    data: { messages: JSON.stringify(existing) },
  });

  return Response.json({ success: true, messages: existing });
}
