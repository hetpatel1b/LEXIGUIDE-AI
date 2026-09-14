import type { DocumentType, ProcessingStatus } from "@/types/document";

/**
 * Source citation metadata allowing exact traceability:
 * Document -> Section -> Page -> Text slice.
 * Designed as the immutable provenance anchor for Phase 3/4.
 */
export interface SourceLocation {
  documentId: string;
  documentName: string;
  sectionId: string;
  sectionNumber: string | null;
  sectionTitle: string;
  pageNumbers: number[];
  startOffset: number;
  endOffset: number;
  exactText: string;
}

/**
 * A discrete physical or logical page in the document.
 * Physical page numbers are preserved for PDFs.
 * DOCX and TXT explicitly set pageNumber to null to avoid fabricating physical pages.
 */
export interface DocumentPage {
  pageId: string;
  pageNumber: number | null;
  text: string;
  startOffset: number;
  endOffset: number;
  characterCount: number;
  wordCount: number;
}

/**
 * A detected structural section of the legal document.
 * Deterministically detected from numbered headings, Articles, Clauses, or Schedules.
 * Falls back to "Document Content" if no explicit headings are discovered.
 */
export interface DocumentSection {
  sectionId: string;
  sectionNumber: string | null;
  title: string;
  startOffset: number;
  endOffset: number;
  pageReferences: number[];
  chunkIds: string[];
  characterCount: number;
}

/**
 * A deterministic retrieval chunk for downstream retrieval & Phase 3 intelligence.
 * Chunk boundaries respect sentence and paragraph endings.
 */
export interface DocumentChunk {
  chunkId: string;
  chunkIndex: number;
  text: string;
  sectionId: string;
  sectionNumber: string | null;
  sectionTitle: string;
  pageNumbers: number[];
  startOffset: number;
  endOffset: number;
  characterCount: number;
  wordCount: number;
}

/**
 * Safe extracted metadata from file container properties (e.g. PDF info dictionary).
 * Strict: Never infers legal entities, jurisdictions, or obligations.
 */
export interface DocumentExtractedMetadata {
  title?: string;
  author?: string;
  creator?: string;
  producer?: string;
  creationDate?: string;
  modificationDate?: string;
  pdfVersion?: string;
}

/**
 * The canonical, normalized representation of an ingested legal document.
 * Single source of truth consumed by downstream processing.
 */
export interface NormalizedDocument {
  id: string;
  originalFilename: string;
  displayName: string;
  format: DocumentType;
  mimeType: string;
  sizeBytes: number;
  pageCount: number | null;
  characterCount: number;
  wordCount: number;
  lineCount: number;
  paragraphCount: number;
  uploadedAt: string;
  status: ProcessingStatus;
  extractedMetadata: DocumentExtractedMetadata;
  pages: DocumentPage[];
  sections: DocumentSection[];
  chunks: DocumentChunk[];
}

/**
 * Configuration options for deterministic chunking.
 */
export interface ChunkerOptions {
  targetChunkChars?: number;
  overlapChars?: number;
  minChunkChars?: number;
}

/**
 * Raw text unit produced by format-specific parsers before normalization.
 */
export interface RawParsedPage {
  pageNumber: number | null;
  rawText: string;
}

export interface RawParsedDocument {
  format: DocumentType;
  pages: RawParsedPage[];
  extractedMetadata: DocumentExtractedMetadata;
}
