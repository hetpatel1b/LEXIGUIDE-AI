import type {
  ChunkerOptions,
  DocumentChunk,
  DocumentPage,
  DocumentSection,
} from "../types";

const DEFAULT_TARGET_CHARS = 1000;
const DEFAULT_OVERLAP_CHARS = 150;
const DEFAULT_MIN_CHARS = 100;

/**
 * Deterministic, boundary-aware legal document chunker.
 * Respects section hierarchies, paragraph breaks, and sentence endings.
 * Emits stable IDs and exact character/page citations for downstream RAG.
 */
export function chunkDocument(
  fullText: string,
  sections: DocumentSection[],
  pages: DocumentPage[],
  documentId: string,
  options?: ChunkerOptions
): { chunks: DocumentChunk[]; updatedSections: DocumentSection[] } {
  const targetChars = options?.targetChunkChars ?? DEFAULT_TARGET_CHARS;
  const overlapChars = options?.overlapChars ?? DEFAULT_OVERLAP_CHARS;
  const minChars = options?.minChunkChars ?? DEFAULT_MIN_CHARS;

  const chunks: DocumentChunk[] = [];
  let globalChunkIndex = 1;

  // We will populate section.chunkIds as we generate them
  const updatedSections = sections.map((sec) => ({
    ...sec,
    chunkIds: [] as string[],
  }));

  for (let sIdx = 0; sIdx < updatedSections.length; sIdx++) {
    const section = updatedSections[sIdx];
    const sectionText = fullText.slice(section.startOffset, section.endOffset).trim();

    if (!sectionText) {
      continue;
    }

    // If section fits cleanly within target size + min buffer, keep as one cohesive chunk
    if (sectionText.length <= targetChars + minChars) {
      const chunkId = `chk_${documentId}_${globalChunkIndex}`;
      const pageNumbers = getPageReferencesForSpan(
        section.startOffset,
        section.endOffset,
        pages
      );

      const chunk: DocumentChunk = {
        chunkId,
        chunkIndex: globalChunkIndex++,
        text: sectionText,
        sectionId: section.sectionId,
        sectionNumber: section.sectionNumber,
        sectionTitle: section.title,
        pageNumbers,
        startOffset: section.startOffset,
        endOffset: section.endOffset,
        characterCount: sectionText.length,
        wordCount: countWords(sectionText),
      };

      chunks.push(chunk);
      section.chunkIds.push(chunkId);
      continue;
    }

    // For larger sections: split by natural semantic units (paragraphs, then sentences)
    const units = splitIntoSemanticUnits(sectionText, targetChars);
    let currentChunkText = "";
    let currentChunkStart = section.startOffset;

    for (let uIdx = 0; uIdx < units.length; uIdx++) {
      const unit = units[uIdx];

      // If adding this unit keeps us within target or if we are empty
      if (
        !currentChunkText ||
        currentChunkText.length + unit.length + 1 <= targetChars
      ) {
        currentChunkText = currentChunkText
          ? `${currentChunkText} ${unit}`
          : unit;
      } else {
        // Current chunk has reached capacity; finalize it
        const trimmedChunk = currentChunkText.trim();
        if (trimmedChunk.length > 0) {
          const chunkId = `chk_${documentId}_${globalChunkIndex}`;
          const chunkEnd = currentChunkStart + trimmedChunk.length;
          const pageNumbers = getPageReferencesForSpan(
            currentChunkStart,
            chunkEnd,
            pages
          );

          chunks.push({
            chunkId,
            chunkIndex: globalChunkIndex++,
            text: trimmedChunk,
            sectionId: section.sectionId,
            sectionNumber: section.sectionNumber,
            sectionTitle: section.title,
            pageNumbers,
            startOffset: currentChunkStart,
            endOffset: chunkEnd,
            characterCount: trimmedChunk.length,
            wordCount: countWords(trimmedChunk),
          });
          section.chunkIds.push(chunkId);
        }

        // Start next chunk with overlap from the tail of the previous chunk if applicable
        const overlapText = extractOverlap(trimmedChunk, overlapChars);
        currentChunkStart = currentChunkStart + trimmedChunk.length - overlapText.length;
        currentChunkText = overlapText ? `${overlapText} ${unit}` : unit;
      }
    }

    // Finalize any remaining text in this section
    const remainingTrimmed = currentChunkText.trim();
    if (remainingTrimmed.length > 0) {
      const chunkId = `chk_${documentId}_${globalChunkIndex}`;
      const chunkEnd = currentChunkStart + remainingTrimmed.length;
      const pageNumbers = getPageReferencesForSpan(
        currentChunkStart,
        chunkEnd,
        pages
      );

      chunks.push({
        chunkId,
        chunkIndex: globalChunkIndex++,
        text: remainingTrimmed,
        sectionId: section.sectionId,
        sectionNumber: section.sectionNumber,
        sectionTitle: section.title,
        pageNumbers,
        startOffset: currentChunkStart,
        endOffset: chunkEnd,
        characterCount: remainingTrimmed.length,
        wordCount: countWords(remainingTrimmed),
      });
      section.chunkIds.push(chunkId);
    }
  }

  return { chunks, updatedSections };
}

/**
 * Splits text into natural semantic units: paragraphs first; if a paragraph exceeds maxChars, splits by sentences.
 */
function splitIntoSemanticUnits(text: string, maxChars: number): string[] {
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  const units: string[] = [];

  for (const para of paragraphs) {
    if (para.length <= maxChars) {
      units.push(para);
    } else {
      // Split on sentence boundaries: period, question mark, or exclamation followed by space
      const sentences = para
        .split(/(?<=[.?!])\s+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      for (const sent of sentences) {
        units.push(sent);
      }
    }
  }

  return units;
}

/**
 * Extracts a clean overlapping tail that respects sentence or word boundaries.
 */
function extractOverlap(text: string, maxOverlapChars: number): string {
  if (text.length <= maxOverlapChars) return "";

  const tail = text.slice(text.length - maxOverlapChars);
  // Break at sentence boundary if possible
  const sentenceIndex = tail.search(/[.?!]\s+[A-Z]/);
  if (sentenceIndex !== -1) {
    return tail.slice(sentenceIndex + 2).trim();
  }

  // Fallback to word boundary
  const spaceIndex = tail.indexOf(" ");
  if (spaceIndex !== -1 && spaceIndex < tail.length - 20) {
    return tail.slice(spaceIndex + 1).trim();
  }

  return "";
}

function countWords(str: string): number {
  return str.trim().split(/\s+/).filter(Boolean).length;
}

function getPageReferencesForSpan(
  startOffset: number,
  endOffset: number,
  pages: DocumentPage[]
): number[] {
  const matchingPages: number[] = [];
  for (const page of pages) {
    if (page.pageNumber === null) continue;
    if (startOffset < page.endOffset && endOffset > page.startOffset) {
      matchingPages.push(page.pageNumber);
    }
  }
  return matchingPages;
}
