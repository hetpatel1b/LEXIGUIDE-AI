import type { NormalizedDocument, DocumentChunk } from "@/lib/document-engine/types";
import { AI_CONFIG } from "../config";
import type { AnalysisContext } from "../types";

/**
 * Neutralizes potential prompt injection markers inside untrusted document text.
 * Wraps or clarifies that text is literal data.
 */
function sanitizeDocumentText(text: string): string {
  // Replace obvious instruction override markers with safe literals
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

const LEGAL_PRIORITY_KEYWORDS = [
  "parties", "title", "preamble", "recital", "definition",
  "term", "termination", "compensation", "salary", "incentive", "retention", "bonus", "payment",
  "confidential", "intellectual property", "ip", "invention", "ownership",
  "non-compete", "restrictive", "non-solicit", "security", "data protection",
  "liability", "indemnif", "governing law", "dispute", "arbitration", "jurisdiction",
  "notice", "schedule", "exhibit"
];

/**
 * Selects chunks deterministically using legal priority heuristics when document
 * exceeds single-pass context budget.
 */
function selectBoundedChunks(chunks: DocumentChunk[], maxChars: number): DocumentChunk[] {
  // Approximate chunk block size including header formatting (~90 chars overhead per chunk)
  const getChunkFormattedSize = (c: DocumentChunk) => c.text.length + 95;

  let totalEstimatedChars = chunks.reduce((acc, c) => acc + getChunkFormattedSize(c), 0);
  if (totalEstimatedChars <= maxChars) {
    return chunks;
  }

  const selected: DocumentChunk[] = [];
  const selectedIds = new Set<string>();
  let currentChars = 0;

  const addChunk = (chunk: DocumentChunk) => {
    if (!selectedIds.has(chunk.chunkId)) {
      const size = getChunkFormattedSize(chunk);
      if (currentChars + size <= maxChars) {
        selected.push(chunk);
        selectedIds.add(chunk.chunkId);
        currentChars += size;
        return true;
      }
    }
    return false;
  };

  // 1. Mandatory Identity Chunks: First 3 chunks (Preamble, parties, recitals, effective date)
  for (let i = 0; i < Math.min(3, chunks.length); i++) {
    addChunk(chunks[i]);
  }

  // 2. High-Priority Legal Headings: compensation, term, termination, IP, restrictive covenants, governing law
  for (const chunk of chunks) {
    const titleLower = (chunk.sectionTitle || "").toLowerCase();
    const isPriority = LEGAL_PRIORITY_KEYWORDS.some((kw) => titleLower.includes(kw));
    if (isPriority) {
      addChunk(chunk);
    }
  }

  // 3. Structural Distribution: First chunk of each remaining section to preserve document architecture
  const sectionMap = new Map<string, DocumentChunk[]>();
  for (const chunk of chunks) {
    const list = sectionMap.get(chunk.sectionId) || [];
    list.push(chunk);
    sectionMap.set(chunk.sectionId, list);
  }

  for (const [, sChunks] of sectionMap.entries()) {
    if (sChunks.length > 0) {
      addChunk(sChunks[0]);
    }
  }

  // 4. Fill remaining budget with sequential chunks in document order
  for (const chunk of chunks) {
    if (!addChunk(chunk) && currentChars >= maxChars) {
      break;
    }
  }

  // Sort selected chunks back to original document order
  return selected.sort((a, b) => a.chunkIndex - b.chunkIndex);
}

/**
 * Builds the bounded analysis context from a Phase 2 NormalizedDocument.
 * Acts as the clean interface separating document structure from AI prompting,
 * ready for Phase 4 retrieval integration without refactoring the AI provider.
 */
export function buildAnalysisContext(
  document: NormalizedDocument,
  maxChars: number = AI_CONFIG.maxContextChars
): AnalysisContext {
  const allChunks = document.chunks || [];
  const selectedChunks = selectBoundedChunks(allChunks, maxChars);

  const formattedBlocks = selectedChunks.map(formatChunkForPrompt);
  const contextText = formattedBlocks.join("\n\n");

  const estimatedTokens = Math.ceil(contextText.length / 4);

  return {
    documentId: document.id,
    displayName: document.displayName,
    format: document.format,
    totalChunks: allChunks.length,
    includedChunks: selectedChunks.length,
    estimatedTokens,
    contextText,
  };
}
