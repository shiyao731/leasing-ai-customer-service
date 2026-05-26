import { prisma } from "../db";
import { embed, cosineSimilarity } from "./embedding";

interface FaqResult {
  question: string;
  answer: string;
  similarity: number;
}

export async function searchFaq(query: string, topK = 3): Promise<FaqResult[]> {
  const faqs = await prisma.faqEntry.findMany();
  if (faqs.length === 0) return [];

  const queryVec = await embed(query);

  const scored = faqs
    .map((faq) => {
      if (!faq.embedding) return null;
      const vec = JSON.parse(faq.embedding) as number[];
      return {
        question: faq.question,
        answer: faq.answer,
        similarity: cosineSimilarity(queryVec, vec),
      };
    })
    .filter((f): f is FaqResult => f !== null && f.similarity > 0.5)
    .sort((a, b) => b.similarity - a.similarity);

  return scored.slice(0, topK);
}
