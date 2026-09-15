import type { NormalizedDocument, DocumentSection, DocumentChunk } from "@/lib/document-engine/types";
import type {
  ComparisonChange,
  ComparisonUnchangedSection,
  ComparisonSourceEvidence,
  DifferenceType,
} from "@/types/comparison";
import { type SectionMappingResult } from "./section-mapper";
import {
  isSubstantivelyIdentical,
  determineChangeSeverity,
  extractDiffHighlights,
} from "./diff-engine";

export interface ClauseMappingResult {
  changes: ComparisonChange[];
  unchangedSections: ComparisonUnchangedSection[];
}

function getSectionFullText(doc: NormalizedDocument, section: DocumentSection): string {
  const chunks = (doc.chunks || []).filter((c) => c.sectionId === section.sectionId);
  if (chunks.length > 0) {
    return chunks.map((c) => c.text).join(" ").trim();
  }
  return section.title;
}

function getPrimaryChunk(doc: NormalizedDocument, section: DocumentSection): DocumentChunk | null {
  const chunks = (doc.chunks || []).filter((c) => c.sectionId === section.sectionId);
  return chunks[0] || null;
}

/**
 * Builds candidate clause-level comparison items from mapped sections,
 * unmapped sections from A (removed), and unmapped sections from B (added).
 */
export function mapClauses(
  docA: NormalizedDocument,
  docB: NormalizedDocument,
  sectionMapping: SectionMappingResult
): ClauseMappingResult {
  const changes: ComparisonChange[] = [];
  const unchangedSections: ComparisonUnchangedSection[] = [];

  let changeIndex = 1;
  let unchangedIndex = 1;

  // 1. Process Mapped Section Pairs
  for (const pair of sectionMapping.mappedPairs) {
    const textA = getSectionFullText(docA, pair.sectionA);
    const textB = getSectionFullText(docB, pair.sectionB);

    const chunkA = getPrimaryChunk(docA, pair.sectionA);
    const chunkB = getPrimaryChunk(docB, pair.sectionB);

    const pageA = pair.sectionA.pageReferences[0] || (chunkA?.pageNumbers && chunkA.pageNumbers[0]) || 1;
    const pageB = pair.sectionB.pageReferences[0] || (chunkB?.pageNumbers && chunkB.pageNumbers[0]) || 1;

    const sectionRefA = pair.sectionA.sectionNumber
      ? `Section ${pair.sectionA.sectionNumber}`
      : pair.sectionA.title;
    const sectionRefB = pair.sectionB.sectionNumber
      ? `Section ${pair.sectionB.sectionNumber}`
      : pair.sectionB.title;

    if (isSubstantivelyIdentical(textA, textB)) {
      unchangedSections.push({
        id: `unchanged_${unchangedIndex++}`,
        title: pair.sectionA.title,
        sectionReference: sectionRefA,
        pageNumber: pageA,
        chunkId: chunkA?.chunkId,
        note: "Verified identical wording preserved across both document revisions.",
      });
    } else {
      const status: DifferenceType = "modified";
      const severity = determineChangeSeverity(pair.category, textA, textB, status);
      const { highlightA, highlightB } = extractDiffHighlights(textA, textB);

      const sourceA: ComparisonSourceEvidence = {
        documentId: docA.id,
        documentName: docA.displayName,
        sectionId: pair.sectionA.sectionId,
        sectionTitle: pair.sectionA.title,
        chunkId: chunkA?.chunkId || `chunk_a_${pair.sectionA.sectionId}`,
        pageNumber: pageA,
        quote: textA.slice(0, 300),
        verified: true,
      };

      const sourceB: ComparisonSourceEvidence = {
        documentId: docB.id,
        documentName: docB.displayName,
        sectionId: pair.sectionB.sectionId,
        sectionTitle: pair.sectionB.title,
        chunkId: chunkB?.chunkId || `chunk_b_${pair.sectionB.sectionId}`,
        pageNumber: pageB,
        quote: textB.slice(0, 300),
        verified: true,
      };

      changes.push({
        id: `chg_${changeIndex++}`,
        clauseTitle: pair.sectionB.title || pair.sectionA.title,
        category: pair.category,
        changeSeverity: severity,
        status,
        sectionA: sectionRefA,
        sectionB: sectionRefB,
        pageA,
        pageB,
        docAContent: textA.slice(0, 450),
        docBContent: textB.slice(0, 450),
        summaryChange: `Clause wording modified between ${docA.displayName} and ${docB.displayName}.`,
        diffHighlightA: highlightA,
        diffHighlightB: highlightB,
        sourceA,
        sourceB,
      });
    }
  }

  // 2. Process Unmapped Sections in Document A -> REMOVED
  for (const secA of sectionMapping.unmappedSectionsA) {
    const textA = getSectionFullText(docA, secA);
    const chunkA = getPrimaryChunk(docA, secA);
    const pageA = secA.pageReferences[0] || (chunkA?.pageNumbers && chunkA.pageNumbers[0]) || 1;
    const sectionRefA = secA.sectionNumber ? `Section ${secA.sectionNumber}` : secA.title;

    const sourceA: ComparisonSourceEvidence = {
      documentId: docA.id,
      documentName: docA.displayName,
      sectionId: secA.sectionId,
      sectionTitle: secA.title,
      chunkId: chunkA?.chunkId || `chunk_a_${secA.sectionId}`,
      pageNumber: pageA,
      quote: textA.slice(0, 300),
      verified: true,
    };

    changes.push({
      id: `chg_${changeIndex++}`,
      clauseTitle: secA.title,
      category: "Obligations",
      changeSeverity: determineChangeSeverity("Obligations", textA, "", "removed"),
      status: "removed",
      sectionA: sectionRefA,
      sectionB: "Omitted / Replaced",
      pageA,
      pageB: 1,
      docAContent: textA.slice(0, 450),
      docBContent: "No corresponding provision found in updated document.",
      summaryChange: `Provision "${secA.title}" is present in Document A but omitted or removed in Document B.`,
      whyItMatters:
        "Consider reviewing whether the omitted provision was intentionally removed or merged into another section.",
      sourceA,
    });
  }

  // 3. Process Unmapped Sections in Document B -> ADDED
  for (const secB of sectionMapping.unmappedSectionsB) {
    const textB = getSectionFullText(docB, secB);
    const chunkB = getPrimaryChunk(docB, secB);
    const pageB = secB.pageReferences[0] || (chunkB?.pageNumbers && chunkB.pageNumbers[0]) || 1;
    const sectionRefB = secB.sectionNumber ? `Section ${secB.sectionNumber}` : secB.title;

    const sourceB: ComparisonSourceEvidence = {
      documentId: docB.id,
      documentName: docB.displayName,
      sectionId: secB.sectionId,
      sectionTitle: secB.title,
      chunkId: chunkB?.chunkId || `chunk_b_${secB.sectionId}`,
      pageNumber: pageB,
      quote: textB.slice(0, 300),
      verified: true,
    };

    changes.push({
      id: `chg_${changeIndex++}`,
      clauseTitle: secB.title,
      category: "Obligations",
      changeSeverity: determineChangeSeverity("Obligations", "", textB, "added"),
      status: "added",
      sectionA: "Not in Document A",
      sectionB: sectionRefB,
      pageA: 1,
      pageB,
      docAContent: "Provision was not present in the baseline document.",
      docBContent: textB.slice(0, 450),
      summaryChange: `New provision "${secB.title}" added to Document B.`,
      whyItMatters:
        "Review newly introduced obligations or covenants to ensure they align with business expectations.",
      sourceB,
    });
  }

  return {
    changes,
    unchangedSections,
  };
}
