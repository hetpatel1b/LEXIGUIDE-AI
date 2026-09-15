import type { DocumentSection, DocumentChunk, NormalizedDocument } from "@/lib/document-engine/types";

export interface MappedSectionPair {
  sectionA: DocumentSection;
  sectionB: DocumentSection;
  score: number;
  category: string;
}

export interface SectionMappingResult {
  mappedPairs: MappedSectionPair[];
  unmappedSectionsA: DocumentSection[];
  unmappedSectionsB: DocumentSection[];
}

/**
 * Normalizes heading strings for deterministic matching only.
 * Strips leading numbering (8.1, Section 8, Clause 8, ARTICLE IV), punctuation, and casing.
 * Original document text is NEVER modified.
 */
export function normalizeHeadingForComparison(heading: string): string {
  if (!heading) return "";
  let norm = heading.trim().toLowerCase();

  // Strip common structural prefixes
  norm = norm
    .replace(/^(?:section|clause|article|schedule|annexure|appendix|exhibit)\s+[\divxlcdm\.]*[\s:\-–—]*/i, "")
    .replace(/^[\divxlcdm]+(?:\.[\divxlcdm]+)*[\s:\-–—]*/i, "")
    .replace(/[\(\)\[\]\{\}'"“”]/g, "")
    .replace(/[&]/g, " and ")
    .replace(/[\s\-_–—:\.]+/g, " ")
    .trim();

  return norm;
}

/**
 * Extracts a normalized section number (e.g., "8", "8.1", "IV") from sectionNumber or title.
 */
export function extractSectionNumber(section: DocumentSection): string | null {
  if (section.sectionNumber && section.sectionNumber.trim()) {
    return section.sectionNumber.trim().toLowerCase().replace(/^section\s+/i, "");
  }

  const match = section.title.match(/(?:(?:section|clause|article)\s+)?([\divxlcdm]+(?:\.[\divxlcdm]+)*)/i);
  return match ? match[1].toLowerCase() : null;
}

/**
 * Classifies a section or text into standard legal categories.
 */
export function classifyLegalCategory(title: string, sampleContent?: string): string {
  const text = `${title} ${sampleContent || ""}`.toLowerCase();

  if (text.includes("non-compete") || text.includes("non competition") || text.includes("restrictive covenant")) {
    return "Non-Compete";
  }
  if (text.includes("non-solicit") || text.includes("non solicitation")) {
    return "Non-Solicitation";
  }
  if (text.includes("terminat") || text.includes("severance") || text.includes("notice period")) {
    return "Termination";
  }
  if (
    text.includes("compensat") ||
    text.includes("salary") ||
    text.includes("bonus") ||
    text.includes("remunerat") ||
    text.includes("stipend") ||
    text.includes("fee")
  ) {
    return "Compensation";
  }
  if (text.includes("confidential") || text.includes("proprietary") || text.includes("nondisclosure") || text.includes("nda")) {
    return "Confidentiality";
  }
  if (
    text.includes("intellectual property") ||
    text.includes("work product") ||
    text.includes("invention") ||
    text.includes("copyright") ||
    text.includes("patent")
  ) {
    return "Intellectual Property";
  }
  if (text.includes("indemnif") || text.includes("hold harmless")) {
    return "Indemnification";
  }
  if (text.includes("liabilit") || text.includes("limitation of liability") || text.includes("damage cap")) {
    return "Liability";
  }
  if (text.includes("arbitrat") || text.includes("governing law") || text.includes("jurisdiction") || text.includes("dispute")) {
    return "Dispute Resolution";
  }
  if (text.includes("data protection") || text.includes("privacy") || text.includes("security") || text.includes("gdpr")) {
    return "Data Protection";
  }
  if (text.includes("benefit") || text.includes("leave") || text.includes("vacation") || text.includes("provident") || text.includes("insurance")) {
    return "Benefits";
  }
  if (text.includes("warrant") || text.includes("representation")) {
    return "Warranty";
  }
  if (text.includes("force majeure") || text.includes("act of god")) {
    return "Force Majeure";
  }
  if (text.includes("renew") || text.includes("term") || text.includes("duration") || text.includes("effective date")) {
    return "Dates";
  }
  if (text.includes("obligation") || text.includes("duty") || text.includes("compliance") || text.includes("covenant")) {
    return "Obligations";
  }

  return "General";
}

/**
 * Calculates Jaccard similarity over word tokens.
 */
function tokenJaccardSimilarity(textA: string, textB: string): number {
  const setA = new Set(textA.toLowerCase().split(/\s+/).filter((w) => w.length > 2));
  const setB = new Set(textB.toLowerCase().split(/\s+/).filter((w) => w.length > 2));

  if (setA.size === 0 && setB.size === 0) return 1.0;
  if (setA.size === 0 || setB.size === 0) return 0.0;

  let intersection = 0;
  for (const item of setA) {
    if (setB.has(item)) intersection++;
  }

  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Computes deterministic multi-signal match score between two sections.
 * Combines heading normalization, section numbers, category overlap, and chunk text.
 */
export function computeSectionSimilarityScore(
  secA: DocumentSection,
  secB: DocumentSection,
  chunksA: DocumentChunk[],
  chunksB: DocumentChunk[]
): number {
  const normA = normalizeHeadingForComparison(secA.title);
  const normB = normalizeHeadingForComparison(secB.title);

  // Exact normalized heading match
  if (normA && normB && normA === normB) {
    return 0.95;
  }

  let score = 0;

  // 1. Heading Token Similarity (weight: 0.45)
  const headingSim = tokenJaccardSimilarity(normA, normB);
  score += headingSim * 0.45;

  // Substring match check
  if (normA && normB && (normA.includes(normB) || normB.includes(normA))) {
    score += 0.2;
  }

  // 2. Section Number Match (weight: 0.20)
  const numA = extractSectionNumber(secA);
  const numB = extractSectionNumber(secB);
  if (numA && numB && numA === numB) {
    score += 0.2;
  }

  // 3. Category Match (weight: 0.15)
  const catA = classifyLegalCategory(secA.title);
  const catB = classifyLegalCategory(secB.title);
  if (catA !== "General" && catA === catB) {
    score += 0.15;
  }

  // 4. Content Chunk Overlap (weight: 0.20)
  const textA = chunksA
    .filter((c) => c.sectionId === secA.sectionId)
    .slice(0, 3)
    .map((c) => c.text)
    .join(" ");
  const textB = chunksB
    .filter((c) => c.sectionId === secB.sectionId)
    .slice(0, 3)
    .map((c) => c.text)
    .join(" ");

  if (textA && textB) {
    const contentSim = tokenJaccardSimilarity(textA, textB);
    score += contentSim * 0.2;
  }

  return Math.min(score, 1.0);
}

/**
 * Maps sections between Document A and Document B.
 * Uses greedy mutual assignment with a confidence threshold.
 */
export function mapDocumentSections(
  docA: NormalizedDocument,
  docB: NormalizedDocument,
  threshold = 0.4
): SectionMappingResult {
  const sectionsA = docA.sections || [];
  const sectionsB = docB.sections || [];
  const chunksA = docA.chunks || [];
  const chunksB = docB.chunks || [];

  // Build candidate pairs with scores
  const candidates: Array<{
    secA: DocumentSection;
    secB: DocumentSection;
    score: number;
  }> = [];

  for (const secA of sectionsA) {
    for (const secB of sectionsB) {
      const score = computeSectionSimilarityScore(secA, secB, chunksA, chunksB);
      if (score >= threshold) {
        candidates.push({ secA, secB, score });
      }
    }
  }

  // Sort descending by score
  candidates.sort((a, b) => b.score - a.score);

  const matchedA = new Set<string>();
  const matchedB = new Set<string>();
  const mappedPairs: MappedSectionPair[] = [];

  for (const cand of candidates) {
    if (matchedA.has(cand.secA.sectionId) || matchedB.has(cand.secB.sectionId)) {
      continue;
    }
    matchedA.add(cand.secA.sectionId);
    matchedB.add(cand.secB.sectionId);

    const category = classifyLegalCategory(cand.secB.title || cand.secA.title);
    mappedPairs.push({
      sectionA: cand.secA,
      sectionB: cand.secB,
      score: cand.score,
      category,
    });
  }

  const unmappedSectionsA = sectionsA.filter((s) => !matchedA.has(s.sectionId));
  const unmappedSectionsB = sectionsB.filter((s) => !matchedB.has(s.sectionId));

  return {
    mappedPairs,
    unmappedSectionsA,
    unmappedSectionsB,
  };
}
