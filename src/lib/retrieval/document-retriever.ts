import type { NormalizedDocument, DocumentChunk } from "@/lib/document-engine/types";
import type {
  DocumentRetriever,
  RetrievalQuery,
  RetrievalResult,
  RetrievedChunk,
} from "./types";
import { processQuery } from "./query-processor";
import { scoreChunk } from "./retrieval-scorer";

export const DEFAULT_TOP_K = 6;
export const DEFAULT_MIN_THRESHOLD = 3.0;

/**
 * Production implementation of DocumentRetriever.
 * Executes deterministic in-memory lexical & hybrid scoring across
 * active document chunks in <10ms.
 */
export class LexicalDocumentRetriever implements DocumentRetriever {
  public async retrieve(
    query: RetrievalQuery,
    document: NormalizedDocument
  ): Promise<RetrievalResult> {
    const t0 = Date.now();

    const topK = query.topK ?? DEFAULT_TOP_K;
    const threshold = query.threshold ?? DEFAULT_MIN_THRESHOLD;
    const includeAdjacent = query.includeAdjacent ?? true;

    // Document Isolation Guard
    if (document.id !== query.documentId) {
      console.warn(
        `[RETRIEVAL] Isolation error: targetDocumentId (${query.documentId}) != document.id (${document.id})`
      );
      return {
        documentId: query.documentId,
        query: query.query,
        normalizedQuery: "",
        expandedTerms: [],
        detectedSectionTarget: null,
        candidatesSearched: 0,
        retrievedChunks: [],
        highestScore: 0,
        isAboveThreshold: false,
        retrievalDurationMs: Date.now() - t0,
      };
    }

    const processedQuery = processQuery(query.query);

    if (!document.chunks || document.chunks.length === 0) {
      return {
        documentId: document.id,
        query: query.query,
        normalizedQuery: processedQuery.normalized,
        expandedTerms: processedQuery.expandedTerms,
        detectedSectionTarget: processedQuery.detectedSectionTarget,
        candidatesSearched: 0,
        retrievedChunks: [],
        highestScore: 0,
        isAboveThreshold: false,
        retrievalDurationMs: Date.now() - t0,
      };
    }

    // Build index of chunk by index for adjacent resolution
    const chunkByIndex = new Map<number, DocumentChunk>();
    for (const chunk of document.chunks) {
      chunkByIndex.set(chunk.chunkIndex, chunk);
    }

    // Score all candidate chunks belonging to this document
    interface ScoredItem {
      chunk: DocumentChunk;
      score: number;
      matchReasons: string[];
    }

    const scoredItems: ScoredItem[] = [];

    for (const chunk of document.chunks) {
      const { score, matchReasons } = scoreChunk(chunk, processedQuery, document.id);
      if (score > 0) {
        scoredItems.push({ chunk, score, matchReasons });
      }
    }

    // Sort descending by score
    scoredItems.sort((a, b) => b.score - a.score);

    const highestScore = scoredItems.length > 0 ? scoredItems[0].score : 0;
    const isAboveThreshold = highestScore >= threshold;

    if (!isAboveThreshold) {
      return {
        documentId: document.id,
        query: query.query,
        normalizedQuery: processedQuery.normalized,
        expandedTerms: processedQuery.expandedTerms,
        detectedSectionTarget: processedQuery.detectedSectionTarget,
        candidatesSearched: document.chunks.length,
        retrievedChunks: [],
        highestScore,
        isAboveThreshold: false,
        retrievalDurationMs: Date.now() - t0,
      };
    }

    // Select top candidates above threshold
    const candidatesAboveThreshold = scoredItems.filter((item) => item.score >= threshold);
    const topCandidates = candidatesAboveThreshold.slice(0, topK);

    const selectedChunkIds = new Set<string>(topCandidates.map((i) => i.chunk.chunkId));
    const retrieved: RetrievedChunk[] = topCandidates.map((item) => ({
      chunkId: item.chunk.chunkId,
      documentId: document.id,
      sectionId: item.chunk.sectionId,
      sectionNumber: item.chunk.sectionNumber,
      sectionTitle: item.chunk.sectionTitle || "Document Content",
      pageNumbers: item.chunk.pageNumbers || [],
      text: item.chunk.text,
      score: item.score,
      matchReasons: item.matchReasons,
      retrievalMethod: "lexical",
      isAdjacentContext: false,
    }));

    // Optionally include adjacent chunk context for the top scoring chunk
    if (includeAdjacent && retrieved.length > 0 && retrieved.length < topK + 2) {
      const topChunk = topCandidates[0].chunk;
      const nextChunk = chunkByIndex.get(topChunk.chunkIndex + 1);

      // Only add adjacent chunk if it belongs to the same section and isn't already included
      if (
        nextChunk &&
        nextChunk.sectionId === topChunk.sectionId &&
        !selectedChunkIds.has(nextChunk.chunkId)
      ) {
        retrieved.push({
          chunkId: nextChunk.chunkId,
          documentId: document.id,
          sectionId: nextChunk.sectionId,
          sectionNumber: nextChunk.sectionNumber,
          sectionTitle: nextChunk.sectionTitle || topChunk.sectionTitle || "Document Content",
          pageNumbers: nextChunk.pageNumbers || [],
          text: nextChunk.text,
          score: Math.max(1, topCandidates[0].score * 0.4),
          matchReasons: [`adjacent_to: ${topChunk.chunkId}`],
          retrievalMethod: "lexical",
          isAdjacentContext: true,
        });
      }
    }

    const durationMs = Date.now() - t0;
    console.log(
      `[RETRIEVAL] docId=${document.id} query="${query.query.slice(0, 30)}..." candidates=${document.chunks.length} above_threshold=${candidatesAboveThreshold.length} returned=${retrieved.length} highest_score=${highestScore} duration=${durationMs}ms`
    );

    return {
      documentId: document.id,
      query: query.query,
      normalizedQuery: processedQuery.normalized,
      expandedTerms: processedQuery.expandedTerms,
      detectedSectionTarget: processedQuery.detectedSectionTarget,
      candidatesSearched: document.chunks.length,
      retrievedChunks: retrieved,
      highestScore,
      isAboveThreshold: true,
      retrievalDurationMs: durationMs,
    };
  }
}

/**
 * Singleton instance of LexicalDocumentRetriever.
 */
export const defaultRetriever = new LexicalDocumentRetriever();
