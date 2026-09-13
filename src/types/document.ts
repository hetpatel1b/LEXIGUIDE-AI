/**
 * Document-related domain contracts.
 * Establishes the type boundaries for document storage and metadata in future phases.
 */

export type DocumentType = "pdf" | "docx" | "txt";

export type ProcessingStatus =
  | "pending"
  | "uploading"
  | "uploaded"
  | "processing"
  | "analyzed"
  | "failed";

export interface DocumentMetadata {
  id: string;
  name: string;
  sizeBytes: number;
  type: DocumentType;
  mimeType: string;
  pageCount?: number;
  uploadedAt: string;
  status: ProcessingStatus;
}
