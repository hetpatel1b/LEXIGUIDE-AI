import type { DocumentChunk } from "@/lib/document-engine/types";
import type { ProcessedQuery } from "./query-processor";

export interface ChunkScoreResult {
  score: number;
  matchReasons: string[];
}

/**
 * Normalizes chunk text for matching: lowercases and collapses whitespace.
 */
function normalizeChunkText(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ");
}

/**
 * Scores a single document chunk against a processed query.
 * Strictly enforces document isolation: chunks from other documents are scored 0.
 */
export function scoreChunk(
  chunk: DocumentChunk,
  processedQuery: ProcessedQuery,
  targetDocumentId: string
): ChunkScoreResult {
  // 1. Strict Document Isolation Guard
  const rawChunk = chunk as unknown as Record<string, unknown>;
  if (rawChunk.documentId && typeof rawChunk.documentId === "string") {
    if (rawChunk.documentId !== targetDocumentId) {
      return { score: 0, matchReasons: ["rejected_cross_document"] };
    }
  }

  const chunkText = normalizeChunkText(chunk.text);
  const sectionTitle = (chunk.sectionTitle || "").toLowerCase();
  const sectionNumber = (chunk.sectionNumber || "").toLowerCase();

  let score = 0;
  const matchReasons: string[] = [];

  // 2. Exact Query Substring Match (Highest confidence)
  if (processedQuery.normalized.length >= 8 && chunkText.includes(processedQuery.normalized)) {
    score += 15;
    matchReasons.push(`full_query_match: "${processedQuery.normalized.slice(0, 40)}"`);
  }

  // 3. Multi-word Phrase Matches (Very high relevance)
  for (const phrase of processedQuery.phrases) {
    if (phrase.length >= 4 && chunkText.includes(phrase)) {
      score += 8;
      matchReasons.push(`exact_phrase: "${phrase}"`);
    }
  }

  // 4. Core Query Token Matches
  let coreTokenMatches = 0;
  for (const token of processedQuery.tokens) {
    if (token.length < 2) continue;

    // Word boundary or substring match
    if (chunkText.includes(token)) {
      coreTokenMatches += 1;
      score += 2;

      // Check frequency bonus (diminishing returns)
      let count = 0;
      let pos = 0;
      while ((pos = chunkText.indexOf(token, pos)) !== -1) {
        count++;
        pos += token.length;
        if (count >= 4) break;
      }

      if (count > 1) {
        score += Math.min(count - 1, 3) * 0.5;
      }
      matchReasons.push(`token: "${token}"`);
    }
  }

  // Multi-token co-occurrence bonus
  if (coreTokenMatches >= 2) {
    score += 2;
  }

  // Completeness bonus: If a high percentage of query tokens match the same chunk
  if (processedQuery.tokens.length > 0) {
    const matchRatio = coreTokenMatches / processedQuery.tokens.length;
    if (matchRatio >= 0.75 && processedQuery.tokens.length >= 2) {
      score += 4;
      matchReasons.push(`high_token_coverage: ${Math.round(matchRatio * 100)}%`);
    }
  }

  // 5. Section Target & Title Boost
  if (processedQuery.detectedSectionTarget) {
    const targetNorm = processedQuery.detectedSectionTarget.toLowerCase();
    const isTargetMatch =
      sectionTitle.includes(targetNorm) ||
      sectionNumber.includes(targetNorm) ||
      targetNorm.includes(sectionNumber);

    if (isTargetMatch) {
      score += 12;
      matchReasons.push(`section_target_match: "${processedQuery.detectedSectionTarget}"`);
    }
  }

  // General section title token overlap
  let sectionTitleOverlap = false;
  for (const token of processedQuery.tokens) {
    if (token.length >= 3 && sectionTitle.includes(token)) {
      sectionTitleOverlap = true;
      score += 3;
      matchReasons.push(`section_title_overlap: "${token}"`);
    }
  }

  // 6. Legal Synonym & Number Expansions
  for (const expTerm of processedQuery.expandedTerms) {
    // Avoid double counting core tokens or phrases already scored
    if (processedQuery.tokens.includes(expTerm) || processedQuery.phrases.includes(expTerm)) {
      continue;
    }

    if (chunkText.includes(expTerm)) {
      score += 1.5;
      matchReasons.push(`synonym_match: "${expTerm}"`);
    }
  }

  return {
    score: Math.round(score * 10) / 10,
    matchReasons,
  };
}
