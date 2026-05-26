import { prisma } from "@leasing/core";
import { NextRequest } from "next/server";

export async function GET() {
  const faqs = await prisma.faqEntry.findMany({ orderBy: { category: "asc" } });
  return Response.json(faqs);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const faq = await prisma.faqEntry.create({
    data: {
      category: body.category,
      question: body.question,
      answer: body.answer,
      keywords: body.keywords || "",
    },
  });
  return Response.json(faq);
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const faq = await prisma.faqEntry.update({
    where: { id: body.id },
    data: {
      category: body.category,
      question: body.question,
      answer: body.answer,
      keywords: body.keywords || "",
    },
  });
  return Response.json(faq);
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return Response.json({ error: "Missing id" }, { status: 400 });
  await prisma.faqEntry.delete({ where: { id } });
  return Response.json({ success: true });
}
