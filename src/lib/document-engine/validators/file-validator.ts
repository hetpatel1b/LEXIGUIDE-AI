import { FILE_CONSTRAINTS } from "@/lib/constants";
import type { DocumentType } from "@/types/document";
import { createDocumentError } from "../errors";
import { detectDocumentFormat } from "./format-detector";
import { sanitizeFilename, type SanitizedFilenameInfo } from "./filename-sanitizer";

export interface ValidatedDocumentFile {
  buffer: Buffer;
  filenameInfo: SanitizedFilenameInfo;
  format: DocumentType;
  mimeType: string;
  sizeBytes: number;
}

/**
 * Authoritative server-side file validator.
 * Validates existence, size, magic numbers, and extension consistency.
 */
export function validateDocumentFile(
  buffer: Buffer,
  rawFilename: string,
  declaredMimeType?: string
): ValidatedDocumentFile {
  // 1. Check existence and non-empty
  if (!buffer || buffer.length === 0) {
    throw createDocumentError(
      "EMPTY_DOCUMENT",
      "The selected file is empty (0 bytes). Please upload a valid legal document."
    );
  }

  const sizeBytes = buffer.length;

  // 2. Authoritative Size Limit (25MB)
  if (sizeBytes > FILE_CONSTRAINTS.maxFileSizeBytes) {
    throw createDocumentError(
      "FILE_TOO_LARGE",
      `Document size (${(sizeBytes / (1024 * 1024)).toFixed(1)}MB) exceeds the maximum limit of ${FILE_CONSTRAINTS.maxFileSizeMB}MB.`
    );
  }

  // 3. Sanitize filename and extract extension
  const filenameInfo = sanitizeFilename(rawFilename);

  // 4. Sniff actual binary format
  const formatResult = detectDocumentFormat(buffer);

  if (!formatResult.isRecognized || !formatResult.detectedFormat) {
    throw createDocumentError(
      "UNSUPPORTED_FILE_TYPE",
      formatResult.reason ||
        "Unsupported or unrecognized file type. LexiGuide AI accepts PDF, DOCX, and TXT documents only."
    );
  }

  const format: DocumentType = formatResult.detectedFormat;

  // 5. Cross-validate detected format against extension
  const ext = filenameInfo.extension.toLowerCase();
  const formatExtMap: Record<DocumentType, string[]> = {
    pdf: [".pdf"],
    docx: [".docx"],
    txt: [".txt", ".text"],
  };

  const allowedExts = formatExtMap[format];
  if (ext && !allowedExts.includes(ext)) {
    throw createDocumentError(
      "UNSUPPORTED_FILE_TYPE",
      `The file extension "${ext}" does not match its detected content format (${format.toUpperCase()}).`
    );
  }

  const effectiveMimeType = formatResult.mimeType || declaredMimeType || "application/octet-stream";

  return {
    buffer,
    filenameInfo,
    format,
    mimeType: effectiveMimeType,
    sizeBytes,
  };
}
