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

/**
 * Selects chunks deterministically when document exceeds single-pass context budget.
 * Distributes chunk selection across all sections so neither beginning nor end is dropped.
 */
function selectBoundedChunks(chunks: DocumentChunk[], maxChars: number): DocumentChunk[] {
  let totalChars = chunks.reduce((acc, c) => acc + c.text.length, 0);
  if (totalChars <= maxChars) {
    return chunks;
  }

  // If over budget, pick first chunk of each section, plus evenly distributed chunks
  const sectionMap = new Map<string, DocumentChunk[]>();
  for (const chunk of chunks) {
    const list = sectionMap.get(chunk.sectionId) || [];
    list.push(chunk);
    sectionMap.set(chunk.sectionId, list);
  }

  const selected: DocumentChunk[] = [];
  let currentChars = 0;

  // 1. Take first chunk of every section to guarantee structural coverage
  for (const [, sChunks] of sectionMap.entries()) {
    if (sChunks.length > 0) {
      const first = sChunks[0];
      if (currentChars + first.text.length <= maxChars) {
        selected.push(first);
        currentChars += first.text.length;
      }
    }
  }

  // 2. Fill remaining budget with subsequent chunks in document order
  for (const chunk of chunks) {
    if (!selected.includes(chunk)) {
      if (currentChars + chunk.text.length <= maxChars) {
        selected.push(chunk);
        currentChars += chunk.text.length;
      } else {
        break;
      }
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
