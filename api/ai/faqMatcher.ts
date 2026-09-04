import { query } from "../index.js";

export interface FaqMatchResult {
  matched: boolean;
  faqId?: string;
  question?: string;
  answer?: string;
  score?: number;
}

// Tokenize, stem and clean text for resilient semantic matching
function stemWord(word: string): string {
  let w = word.toLowerCase().trim();
  if (w.endsWith("ies") && w.length > 4) w = w.slice(0, -3) + "y";
  else if (w.endsWith("es") && w.length > 4) w = w.slice(0, -2);
  else if (w.endsWith("s") && !w.endsWith("ss") && w.length > 3) w = w.slice(0, -1);
  else if (w.endsWith("ing") && w.length > 5) w = w.slice(0, -3);
  return w;
}

const SYNONYMS: Record<string, string> = {
  graphics: "graphic",
  costs: "price",
  cost: "price",
  pricing: "price",
  prices: "price",
  rate: "price",
  rates: "price",
  fee: "price",
  fees: "price",
  charge: "price",
  charges: "price",
  consult: "consultation",
  audit: "consultation",
  meeting: "consultation",
  call: "contact",
  phone: "contact",
  reach: "contact",
  email: "contact",
  whatsapp: "contact",
  reels: "video",
  reel: "video",
  videos: "video",
  websites: "web",
  website: "web",
  sites: "web",
  site: "web",
  services: "service",
  location: "office",
  address: "office",
  where: "office",
  tech: "technology",
  technologies: "technology",
  stack: "technology",
  changes: "revision",
  revisions: "revision",
  modify: "revision",
};

function normalizeToken(raw: string): string {
  const stemmed = stemWord(raw);
  return SYNONYMS[stemmed] || SYNONYMS[raw] || stemmed;
}

function tokenize(text: string): Set<string> {
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1)
    .map(normalizeToken);
  return new Set(words);
}

// Compute Jaccard token similarity with extra weight for exact phrase or substring match
export function computeStringSimilarity(queryText: string, targetText: string): number {
  const normQuery = queryText.toLowerCase().trim().replace(/[^\w\s]/g, "");
  const normTarget = targetText.toLowerCase().trim().replace(/[^\w\s]/g, "");

  if (!normQuery || !normTarget) return 0;
  if (normQuery === normTarget) return 1.0;

  // Exact substring containment
  if (normTarget.includes(normQuery) || normQuery.includes(normTarget)) {
    const ratio = Math.min(normQuery.length, normTarget.length) / Math.max(normQuery.length, normTarget.length);
    return Math.max(0.85, 0.7 + ratio * 0.3);
  }

  const queryTokens = tokenize(queryText);
  const targetTokens = tokenize(targetText);

  if (queryTokens.size === 0 || targetTokens.size === 0) return 0;

  let intersection = 0;
  for (const token of queryTokens) {
    if (targetTokens.has(token)) {
      intersection++;
    }
  }

  const union = new Set([...queryTokens, ...targetTokens]).size;
  const jaccard = union > 0 ? intersection / union : 0;
  const queryCoverage = queryTokens.size > 0 ? intersection / queryTokens.size : 0;

  // Blend jaccard and query coverage
  return Math.max(jaccard, queryCoverage * 0.85);
}

export async function matchFaq(
  userQuestion: string,
  minThreshold: number = 0.50
): Promise<FaqMatchResult> {
  try {
    const rows = await query<{
      id: string;
      question: string;
      answer: string;
      status: string;
    }>(
      `SELECT id, question, answer, status FROM faqs WHERE status = 'published'`
    );

    if (!rows || rows.length === 0) {
      return { matched: false };
    }

    let bestMatch: { faq: (typeof rows)[0]; score: number } | null = null;

    for (const faq of rows) {
      const score = computeStringSimilarity(userQuestion, faq.question);
      if (score > (bestMatch?.score || 0)) {
        bestMatch = { faq, score };
      }
    }

    if (bestMatch && bestMatch.score >= minThreshold) {
      return {
        matched: true,
        faqId: bestMatch.faq.id,
        question: bestMatch.faq.question,
        answer: bestMatch.faq.answer,
        score: bestMatch.score,
      };
    }

    return { matched: false };
  } catch (err) {
    console.error("Error in matchFaq:", err);
    return { matched: false };
  }
}
