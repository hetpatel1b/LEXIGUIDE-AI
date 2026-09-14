import type { NormalizedDocument } from "@/lib/document-engine/types";

/**
 * Options passed to the document retrieval engine.
 */
export interface RetrievalQuery {
  /** The target document ID to search within. MUST match active document. */
  documentId: string;
  /** The raw user question or query string. */
  query: string;
  /** Maximum number of top candidates to retrieve (default: 6). */
  topK?: number;
  /** Minimum relevance score required to consider evidence found (default: 3.0). */
  threshold?: number;
  /** Whether to append adjacent chunk context from the same section (default: true). */
  includeAdjacent?: boolean;
}

/**
 * A retrieved chunk with scoring provenance and match metadata.
 */
export interface RetrievedChunk {
  chunkId: string;
  documentId: string;
  sectionId: string;
  sectionNumber: string | null;
  sectionTitle: string;
  pageNumbers: number[];
  text: string;
  score: number;
  matchReasons: string[];
  retrievalMethod: "lexical" | "hybrid";
  isAdjacentContext?: boolean;
}

/**
 * Full result of a retrieval operation, containing diagnostic telemetry.
 */
export interface RetrievalResult {
  documentId: string;
  query: string;
  normalizedQuery: string;
  expandedTerms: string[];
  detectedSectionTarget: string | null;
  candidatesSearched: number;
  retrievedChunks: RetrievedChunk[];
  highestScore: number;
  isAboveThreshold: boolean;
  retrievalDurationMs: number;
}

/**
 * Abstract retriever interface allowing clean separation of retrieval
 * strategy (in-memory lexical now, vector database in future) without
 * altering Q&A domain logic.
 */
export interface DocumentRetriever {
  retrieve(query: RetrievalQuery, document: NormalizedDocument): Promise<RetrievalResult>;
}
