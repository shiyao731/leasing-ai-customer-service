import { prisma } from "../db";

interface FaqResult {
  question: string;
  answer: string;
  similarity: number;
}

export async function searchFaq(query: string, topK = 3): Promise<FaqResult[]> {
  const faqs = await prisma.faqEntry.findMany();
  if (faqs.length === 0) return [];

  const queryLower = query.toLowerCase();

  // Keyword matching
  const scored = faqs.map((faq) => {
    const keywords = faq.keywords.toLowerCase().split(/[,，]/);
    let score = 0;

    // Check question overlap
    if (queryLower.includes(faq.question.slice(0, 3)) || faq.question.includes(queryLower.slice(0, 3))) {
      score += 0.3;
    }

    // Keyword matching
    for (const kw of keywords) {
      const trimmed = kw.trim();
      if (trimmed && queryLower.includes(trimmed)) {
        score += 0.15;
      }
    }

    // Full text overlap
    const queryChars = new Set(queryLower);
    const faqChars = new Set(faq.question.toLowerCase());
    let overlap = 0;
    for (const c of queryChars) {
      if (faqChars.has(c)) overlap++;
    }
    score += (overlap / Math.max(queryChars.size, 1)) * 0.1;

    return {
      question: faq.question,
      answer: faq.answer,
      similarity: Math.min(score, 1),
    };
  });

  return scored
    .filter((f) => f.similarity > 0.1)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK);
}

