import type { DocumentPage, DocumentSection } from "../types";
import {
  ARTICLE_PATTERN,
  SECTION_PATTERN,
  CLAUSE_PATTERN,
  SCHEDULE_PATTERN,
  NUMBERED_SECTION_PATTERN,
  COMMON_LEGAL_HEADING_SET,
} from "./patterns";

interface HeadingMatch {
  sectionNumber: string | null;
  title: string;
  startOffset: number;
}

/**
 * Deterministically detects structural legal sections within a document.
 * Maps sections to exact document offsets and overlapping page numbers.
 */
export function detectSections(
  fullText: string,
  pages: DocumentPage[],
  documentId: string
): DocumentSection[] {
  if (!fullText.trim()) {
    return [];
  }

  const lines = fullText.split("\n");
  const headingMatches: HeadingMatch[] = [];

  let currentOffset = 0;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();
    const lineStartOffset = currentOffset;

    // Advance offset for next line (+1 for the newline char)
    currentOffset += rawLine.length + 1;

    // Skip empty lines or lines that are too long to be headings (>120 chars)
    if (!trimmed || trimmed.length > 120) {
      continue;
    }

    // 1. Check ARTICLE
    const articleMatch = trimmed.match(ARTICLE_PATTERN);
    if (articleMatch) {
      const num = articleMatch[1].trim();
      const title = articleMatch[2]?.trim() || num;
      headingMatches.push({
        sectionNumber: num,
        title: title || num,
        startOffset: lineStartOffset,
      });
      continue;
    }

    // 2. Check SECTION
    const secMatch = trimmed.match(SECTION_PATTERN);
    if (secMatch) {
      const num = secMatch[1].trim();
      const title = secMatch[2]?.trim() || num;
      headingMatches.push({
        sectionNumber: num,
        title: title || num,
        startOffset: lineStartOffset,
      });
      continue;
    }

    // 3. Check CLAUSE
    const clauseMatch = trimmed.match(CLAUSE_PATTERN);
    if (clauseMatch) {
      const num = clauseMatch[1].trim();
      const title = clauseMatch[2]?.trim() || num;
      headingMatches.push({
        sectionNumber: num,
        title: title || num,
        startOffset: lineStartOffset,
      });
      continue;
    }

    // 4. Check SCHEDULE / EXHIBIT
    const schedMatch = trimmed.match(SCHEDULE_PATTERN);
    if (schedMatch) {
      const num = schedMatch[1].trim();
      const title = schedMatch[2]?.trim() || num;
      headingMatches.push({
        sectionNumber: num,
        title: title || num,
        startOffset: lineStartOffset,
      });
      continue;
    }

    // 5. Check Numbered Sections (e.g. "1. Definitions" or "2.3 Severability")
    const numMatch = trimmed.match(NUMBERED_SECTION_PATTERN);
    if (numMatch) {
      const num = numMatch[1].trim();
      const title = numMatch[2]?.trim() || "";
      // Avoid matching pure numbers or dates
      if (title.length >= 2 && !/^\d+$/.test(title)) {
        headingMatches.push({
          sectionNumber: num,
          title: title,
          startOffset: lineStartOffset,
        });
        continue;
      }
    }

    // 6. Check Known Common Legal Headings (exact match on trimmed line, case-insensitive)
    const cleanHeader = trimmed.replace(/[:.-]+$/, "").trim().toLowerCase();
    if (COMMON_LEGAL_HEADING_SET.has(cleanHeader)) {
      headingMatches.push({
        sectionNumber: null,
        title: trimmed.replace(/[:.-]+$/, "").trim(),
        startOffset: lineStartOffset,
      });
      continue;
    }
  }

  // If no headings found, generate the single canonical fallback section
  if (headingMatches.length === 0) {
    const allPageNumbers = pages
      .map((p) => p.pageNumber)
      .filter((n): n is number => n !== null);

    return [
      {
        sectionId: `sec_${documentId}_1`,
        sectionNumber: null,
        title: "Document Content",
        startOffset: 0,
        endOffset: fullText.length,
        pageReferences: allPageNumbers.length > 0 ? allPageNumbers : [1],
        chunkIds: [],
        characterCount: fullText.length,
      },
    ];
  }

  const sections: DocumentSection[] = [];
  let secCounter = 1;

  // If the document has significant preamble text before the first section heading
  if (headingMatches[0].startOffset > 50) {
    const preambleEnd = headingMatches[0].startOffset;
    const preamblePages = getPageReferencesForSpan(0, preambleEnd, pages);
    sections.push({
      sectionId: `sec_${documentId}_${secCounter++}`,
      sectionNumber: null,
      title: "Preamble & Recitals",
      startOffset: 0,
      endOffset: preambleEnd,
      pageReferences: preamblePages,
      chunkIds: [],
      characterCount: preambleEnd,
    });
  }

  // Construct sections from matches
  for (let i = 0; i < headingMatches.length; i++) {
    const current = headingMatches[i];
    const nextStart =
      i + 1 < headingMatches.length ? headingMatches[i + 1].startOffset : fullText.length;

    const startOffset = current.startOffset;
    const endOffset = nextStart;
    const pageRefs = getPageReferencesForSpan(startOffset, endOffset, pages);

    sections.push({
      sectionId: `sec_${documentId}_${secCounter++}`,
      sectionNumber: current.sectionNumber,
      title: current.title,
      startOffset,
      endOffset,
      pageReferences: pageRefs,
      chunkIds: [],
      characterCount: Math.max(0, endOffset - startOffset),
    });
  }

  return sections;
}

/**
 * Finds all page numbers whose spans overlap with [startOffset, endOffset].
 */
function getPageReferencesForSpan(
  startOffset: number,
  endOffset: number,
  pages: DocumentPage[]
): number[] {
  const matchingPages: number[] = [];

  for (const page of pages) {
    if (page.pageNumber === null) continue;

    // Overlap condition: startA < endB && endA > startB
    if (startOffset < page.endOffset && endOffset > page.startOffset) {
      matchingPages.push(page.pageNumber);
    }
  }

  return matchingPages;
}
