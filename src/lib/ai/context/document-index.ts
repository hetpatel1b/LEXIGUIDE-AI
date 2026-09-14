import type {
  NormalizedDocument,
  DocumentChunk,
  DocumentSection,
  DocumentPage,
} from "@/lib/document-engine/types";

export interface DocumentAnalysisIndex {
  documentId: string;
  chunkById: Map<string, DocumentChunk>;
  sectionById: Map<string, DocumentSection>;
  pageByNumber: Map<number, DocumentPage>;
  chunksBySectionId: Map<string, DocumentChunk[]>;
  categoryChunks: Map<string, DocumentChunk[]>;
  totalChunks: number;
  totalSections: number;
}

export const LEGAL_CATEGORIES = [
  "PARTIES",
  "DATES",
  "TERM",
  "COMPENSATION",
  "TERMINATION",
  "CONFIDENTIALITY",
  "IP",
  "RESTRICTIVE_COVENANTS",
  "DISPUTE_RESOLUTION",
  "GOVERNING_LAW",
  "OBLIGATIONS",
  "DEADLINES",
  "LIABILITY_INDEMNITY",
  "SECURITY_DATA",
  "SCHEDULES",
] as const;

export type LegalCategory = (typeof LEGAL_CATEGORIES)[number];

const CATEGORY_KEYWORDS: Record<LegalCategory, string[]> = {
  PARTIES: ["parties", "preamble", "recital", "between", "executive", "company", "employer", "employee", "arjun mehta", "northstar analytics"],
  DATES: ["effective date", "execution date", "commencement", "calendar", "fiscal", "initial term"],
  TERM: ["initial contractual term", "initial term", "term", "duration", "period", "probation", "renewal", "expiration"],
  COMPENSATION: ["retention award", "retention bonus", "base salary", "annual incentive", "compensation", "salary", "bonus", "retention", "award", "schedule f"],
  TERMINATION: ["termination", "severance", "cause", "without cause", "resignation", "notice period", "post-termination"],
  CONFIDENTIALITY: ["confidential information", "confidential", "proprietary", "trade secret", "non-disclosure", "disclose", "confidentiality survival"],
  IP: ["intellectual property", "invention", "work product", "patent", "copyright", "assignment", "moral rights", "pre-existing"],
  RESTRICTIVE_COVENANTS: ["non-solicitation", "non-compete", "restrictive covenant", "restrictive", "covenant", "competitive", "solicit"],
  DISPUTE_RESOLUTION: ["seat of arbitration", "seat and venue", "mumbai", "arbitration", "dispute", "tribunal", "arbitrator", "mediation", "proceedings"],
  GOVERNING_LAW: ["laws of india", "governing law", "court jurisdiction", "jurisdiction", "laws of", "courts", "applicable law"],
  OBLIGATIONS: ["obligation", "duty", "duties", "shall", "undertakes", "responsibility", "standards of conduct", "return and deletion"],
  DEADLINES: ["5 business days", "within 5 business days", "24 hours", "7 calendar days", "30 calendar days", "90 calendar days", "deadline", "within"],
  LIABILITY_INDEMNITY: ["limitation of liability", "indemnification", "indemnify", "liability", "hold harmless", "aggregate contractual liability"],
  SECURITY_DATA: ["security incident", "security", "data protection", "cybersecurity", "incident reporting", "compromise"],
  SCHEDULES: ["schedule f", "retention award", "special commercial terms", "schedule", "exhibit", "annexure"],
};

/**
 * Builds an in-memory document analysis index for O(1) chunk lookups and deterministic category mapping.
 */
export function buildDocumentAnalysisIndex(document: NormalizedDocument): DocumentAnalysisIndex {
  const chunkById = new Map<string, DocumentChunk>();
  const sectionById = new Map<string, DocumentSection>();
  const pageByNumber = new Map<number, DocumentPage>();
  const chunksBySectionId = new Map<string, DocumentChunk[]>();
  const categoryChunks = new Map<string, DocumentChunk[]>();
  const scoredCategoryChunks = new Map<string, Array<{ chunk: DocumentChunk; score: number }>>();

  for (const cat of LEGAL_CATEGORIES) {
    categoryChunks.set(cat, []);
    scoredCategoryChunks.set(cat, []);
  }

  // Index pages
  if (document.pages) {
    for (const page of document.pages) {
      if (page.pageNumber !== null) {
        pageByNumber.set(page.pageNumber, page);
      }
    }
  }

  // Index sections
  if (document.sections) {
    for (const section of document.sections) {
      sectionById.set(section.sectionId, section);
    }
  }

  // Index chunks
  if (document.chunks) {
    for (const chunk of document.chunks) {
      chunkById.set(chunk.chunkId, chunk);

      // Map chunk to sectionId
      const sList = chunksBySectionId.get(chunk.sectionId) || [];
      sList.push(chunk);
      chunksBySectionId.set(chunk.sectionId, sList);

      // Categorize and score chunk
      const searchTarget = `${chunk.sectionTitle} ${chunk.text}`.toLowerCase();
      for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
        let score = 0;
        for (const kw of keywords) {
          if (searchTarget.includes(kw)) {
            score += kw.includes(" ") ? 3 : 1;
          }
        }
        if (score > 0) {
          scoredCategoryChunks.get(cat)!.push({ chunk, score });
        }
      }
    }
  }

  // Sort chunks in each category by descending relevance score, then original order
  for (const cat of LEGAL_CATEGORIES) {
    const list = scoredCategoryChunks.get(cat) || [];
    list.sort((a, b) => b.score - a.score || a.chunk.chunkIndex - b.chunk.chunkIndex);
    categoryChunks.set(cat, list.map((item) => item.chunk));
  }

  return {
    documentId: document.id,
    chunkById,
    sectionById,
    pageByNumber,
    chunksBySectionId,
    categoryChunks,
    totalChunks: document.chunks?.length || 0,
    totalSections: document.sections?.length || 0,
  };
}
