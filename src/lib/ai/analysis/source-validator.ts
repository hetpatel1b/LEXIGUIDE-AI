import type { NormalizedDocument, DocumentChunk } from "@/lib/document-engine/types";
import type { DocumentAnalysisIndex } from "../context/document-index";
import type { RawAiAnalysisResponse } from "../schemas/analysis-schema";
import type {
  AnalysisResult,
  KeyClause,
  PotentialConcern,
  Obligation,
  ImportantDate,
  SourceCitation,
} from "../types";

/**
 * Normalizes text for lenient whitespace comparison.
 * Collapses spaces, tabs, and newlines into single spaces.
 */
function normalizeForComparison(text: string): string {
  return text.replace(/\s+/g, " ").trim().toLowerCase();
}

/**
 * Validates a citation against the NormalizedDocument chunks and sections.
 * Returns verified: true ONLY if chunk exists and quote matches chunk text.
 */
function verifyCitation(
  citation: SourceCitation,
  chunkMap: Map<string, DocumentChunk>,
  sectionMap: Map<string, string>
): { verifiedCitation: SourceCitation; isVerified: boolean } {
  const targetChunk = chunkMap.get(citation.chunkId);

  if (!targetChunk) {
    // Chunk does not exist in the document
    return {
      verifiedCitation: {
        ...citation,
        quote: citation.quote || "",
      },
      isVerified: false,
    };
  }

  // Inherit or verify section title
  const resolvedSectionTitle =
    citation.sectionTitle ||
    (citation.sectionId ? sectionMap.get(citation.sectionId) : null) ||
    targetChunk.sectionTitle ||
    "Document Content";

  const resolvedSectionId = citation.sectionId || targetChunk.sectionId;
  const resolvedPageNumber =
    citation.pageNumber !== undefined && citation.pageNumber !== null
      ? citation.pageNumber
      : targetChunk.pageNumbers && targetChunk.pageNumbers.length > 0
      ? targetChunk.pageNumbers[0]
      : null;

  // Verify quote exists in chunk text
  const normQuote = normalizeForComparison(citation.quote || "");
  const normChunkText = normalizeForComparison(targetChunk.text);

  const quoteMatches = normQuote.length > 0 && normChunkText.includes(normQuote);

  return {
    verifiedCitation: {
      chunkId: targetChunk.chunkId,
      sectionId: resolvedSectionId,
      sectionTitle: resolvedSectionTitle,
      pageNumber: resolvedPageNumber,
      quote: citation.quote,
    },
    isVerified: quoteMatches,
  };
}

/**
 * Validates all AI findings against the authentic Phase 2 NormalizedDocument.
 * Marks verified: true only when facts are grounded in real chunk text.
 * Uses precomputed DocumentAnalysisIndex for O(1) lookups if available.
 */
export function validateAnalysisSources(
  raw: RawAiAnalysisResponse,
  document: NormalizedDocument,
  modelName: string,
  index?: DocumentAnalysisIndex
): AnalysisResult {
  const t0 = Date.now();

  const chunkMap = index ? index.chunkById : new Map<string, DocumentChunk>();
  if (!index) {
    for (const chunk of document.chunks || []) {
      chunkMap.set(chunk.chunkId, chunk);
    }
  }

  const sectionMap = new Map<string, string>();
  if (index) {
    for (const [secId, section] of index.sectionById.entries()) {
      sectionMap.set(secId, section.title);
    }
  } else {
    for (const section of document.sections || []) {
      sectionMap.set(section.sectionId, section.title);
    }
  }

  // 1. Validate Key Clauses
  const verifiedClauses: KeyClause[] = raw.keyClauses.map((clause) => {
    const { verifiedCitation, isVerified } = verifyCitation(
      clause.source,
      chunkMap,
      sectionMap
    );
    return {
      ...clause,
      source: verifiedCitation,
      verified: isVerified,
    };
  });

  // 2. Validate Potential Concerns
  const verifiedConcerns: PotentialConcern[] = raw.potentialConcerns.map((concern) => {
    const { verifiedCitation, isVerified } = verifyCitation(
      concern.source,
      chunkMap,
      sectionMap
    );
    return {
      ...concern,
      source: verifiedCitation,
      verified: isVerified,
    };
  });

  // 3. Validate Obligations
  const verifiedObligations: Obligation[] = raw.obligations.map((obligation) => {
    const { verifiedCitation, isVerified } = verifyCitation(
      obligation.source,
      chunkMap,
      sectionMap
    );
    return {
      ...obligation,
      source: verifiedCitation,
      verified: isVerified,
    };
  });

  // 4. Validate Important Dates
  const verifiedDates: ImportantDate[] = raw.importantDates.map((dateItem) => {
    const { verifiedCitation, isVerified } = verifyCitation(
      dateItem.source,
      chunkMap,
      sectionMap
    );
    return {
      ...dateItem,
      source: verifiedCitation,
      verified: isVerified,
    };
  });

  const durationMs = Date.now() - t0;
  console.log(
    `[PERF] source_validation_ms=${durationMs} items_validated=${verifiedClauses.length + verifiedConcerns.length + verifiedObligations.length + verifiedDates.length}`
  );

  return {
    analysisSchemaVersion: "1.0",
    documentId: document.id,
    documentName: document.displayName,
    analyzedAt: new Date().toISOString(),
    modelUsed: modelName,
    metadata: raw.metadata,
    executiveSummary: raw.executiveSummary,
    keyClauses: verifiedClauses,
    potentialConcerns: verifiedConcerns,
    obligations: verifiedObligations,
    importantDates: verifiedDates,
    analysisNotes: raw.analysisNotes,
  };
}
