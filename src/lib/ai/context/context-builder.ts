import type { NormalizedDocument, DocumentChunk } from "@/lib/document-engine/types";
import { AI_CONFIG } from "../config";
import type { AnalysisContext } from "../types";
import {
  buildDocumentAnalysisIndex,
  LEGAL_CATEGORIES,
  type LegalCategory,
  type DocumentAnalysisIndex,
} from "./document-index";

/**
 * Neutralizes potential prompt injection markers inside untrusted document text.
 * Wraps or clarifies that text is literal data.
 */
function sanitizeDocumentText(text: string): string {
  return text
    .replace(/<\|im_start\|>/gi, "[im_start]")
    .replace(/<\|im_end\|>/gi, "[im_end]")
    .replace(/\[SYSTEM_PROMPT\]/gi, "[DOCUMENT_TEXT: SYSTEM_PROMPT]")
    .replace(/\[INSTRUCTIONS\]/gi, "[DOCUMENT_TEXT: INSTRUCTIONS]");
}

/**
 * Formats a single chunk into an unambiguous, structured contextual block.
 */
function formatChunkForPrompt(chunk: DocumentChunk): string {
  const sectionLabel = chunk.sectionNumber
    ? `${chunk.sectionNumber} ${chunk.sectionTitle}`
    : chunk.sectionTitle;
  const pageLabel =
    chunk.pageNumbers && chunk.pageNumbers.length > 0
      ? chunk.pageNumbers.join(", ")
      : "N/A";

  const safeText = sanitizeDocumentText(chunk.text);

  return `---
CHUNK_ID: ${chunk.chunkId}
SECTION: ${sectionLabel}
PAGE: ${pageLabel}
CONTENT:
${safeText}
---`;
}

export interface CoverageReport {
  categories: Record<LegalCategory, boolean>;
  coveredCount: number;
  totalCategories: number;
  summary: string;
}

/**
 * Evaluates category coverage across a set of selected chunks.
 */
export function evaluateCoverage(
  selectedChunks: DocumentChunk[],
  index: DocumentAnalysisIndex
): CoverageReport {
  const selectedIds = new Set(selectedChunks.map((c) => c.chunkId));
  const categories = {} as Record<LegalCategory, boolean>;
  let coveredCount = 0;

  for (const cat of LEGAL_CATEGORIES) {
    const chunksInCat = index.categoryChunks.get(cat) || [];
    const isCovered = chunksInCat.some((c) => selectedIds.has(c.chunkId));
    categories[cat] = isCovered;
    if (isCovered) coveredCount++;
  }

  const summary = LEGAL_CATEGORIES.map((cat) => `${cat}: ${categories[cat] ? "yes" : "no"}`).join(", ");

  return {
    categories,
    coveredCount,
    totalCategories: LEGAL_CATEGORIES.length,
    summary,
  };
}

/**
 * Coverage-Aware Context Selector:
 * Selects chunks deterministically ensuring all 12 key legal categories are represented
 * without exceeding the target character budget.
 */
function selectCoverageAwareChunks(
  document: NormalizedDocument,
  maxChars: number,
  index?: DocumentAnalysisIndex
): { selectedChunks: DocumentChunk[]; coverage: CoverageReport } {
  const docIndex = index || buildDocumentAnalysisIndex(document);
  const chunks = document.chunks || [];

  const getChunkFormattedSize = (c: DocumentChunk) => c.text.length + 95;

  let totalEstimatedChars = chunks.reduce((acc, c) => acc + getChunkFormattedSize(c), 0);
  if (totalEstimatedChars <= maxChars) {
    const coverage = evaluateCoverage(chunks, docIndex);
    return { selectedChunks: chunks, coverage };
  }

  const selected: DocumentChunk[] = [];
  const selectedIds = new Set<string>();
  let currentChars = 0;

  const tryAddChunk = (chunk: DocumentChunk | undefined) => {
    if (!chunk || selectedIds.has(chunk.chunkId)) return false;
    const size = getChunkFormattedSize(chunk);
    if (currentChars + size <= maxChars) {
      selected.push(chunk);
      selectedIds.add(chunk.chunkId);
      currentChars += size;
      return true;
    }
    return false;
  };

  // 1. Mandatory Identity Chunks: Preamble, parties, recitals, effective date (first 2-3 chunks)
  for (let i = 0; i < Math.min(3, chunks.length); i++) {
    tryAddChunk(chunks[i]);
  }

  // 2. Guaranteed Category Coverage: 1-2 highest-relevance chunks for each of the 12 legal categories
  for (const cat of LEGAL_CATEGORIES) {
    const catChunks = docIndex.categoryChunks.get(cat) || [];
    for (let i = 0; i < Math.min(2, catChunks.length); i++) {
      tryAddChunk(catChunks[i]);
    }
  }

  // 3. Structural Distribution: First chunk of each section
  for (const [, sChunks] of docIndex.chunksBySectionId.entries()) {
    if (sChunks.length > 0) {
      tryAddChunk(sChunks[0]);
    }
  }

  // 4. Fill remaining budget with sequential document order chunks
  for (const chunk of chunks) {
    if (!tryAddChunk(chunk) && currentChars >= maxChars) {
      break;
    }
  }

  // Sort selected chunks back to original document order
  const sorted = selected.sort((a, b) => a.chunkIndex - b.chunkIndex);
  const coverage = evaluateCoverage(sorted, docIndex);

  return { selectedChunks: sorted, coverage };
}

/**
 * Builds the bounded analysis context from a Phase 2 NormalizedDocument.
 * Emits structured [CONTEXT] diagnostics with deterministic category coverage.
 */
export function buildAnalysisContext(
  document: NormalizedDocument,
  maxChars: number = AI_CONFIG.maxContextChars,
  index?: DocumentAnalysisIndex
): AnalysisContext {
  const { selectedChunks, coverage } = selectCoverageAwareChunks(document, maxChars, index);

  const formattedBlocks = selectedChunks.map(formatChunkForPrompt);
  const contextText = formattedBlocks.join("\n\n");
  const estimatedTokens = Math.ceil(contextText.length / 4);

  console.log(
    `[CONTEXT] chunks=${selectedChunks.length}/${document.chunks?.length || 0} chars=${contextText.length} estimated_tokens=${estimatedTokens} coverage=${coverage.coveredCount}/${coverage.totalCategories} categories`
  );
  console.log(`[CONTEXT] ${coverage.summary}`);

  return {
    documentId: document.id,
    displayName: document.displayName,
    format: document.format,
    totalChunks: document.chunks?.length || 0,
    includedChunks: selectedChunks.length,
    estimatedTokens,
    contextText,
  };
}
