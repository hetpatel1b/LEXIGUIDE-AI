import type { DocumentType } from "@/types/document";

export interface FormatDetectionResult {
  detectedFormat: DocumentType | null;
  mimeType: string;
  isRecognized: boolean;
  reason?: string;
}

/**
 * Sniffs raw buffer bytes to authoritatively determine the document format.
 * Defeats extension spoofing (e.g. malicious executable renamed to file.pdf).
 */
export function detectDocumentFormat(buffer: Buffer): FormatDetectionResult {
  if (!buffer || buffer.length === 0) {
    return {
      detectedFormat: null,
      mimeType: "application/octet-stream",
      isRecognized: false,
      reason: "Buffer is empty",
    };
  }

  // 1. Check for PDF Magic Bytes (%PDF-)
  // Typically at byte 0, but spec allows within the first 1024 bytes.
  const headerSlice = buffer.subarray(0, Math.min(buffer.length, 1024));
  const pdfHeaderIndex = headerSlice.indexOf("%PDF-");
  if (pdfHeaderIndex !== -1) {
    return {
      detectedFormat: "pdf",
      mimeType: "application/pdf",
      isRecognized: true,
    };
  }

  // 2. Check for DOCX (ZIP archive with OpenXML markers)
  // ZIP starts with PK\x03\x04, PK\x05\x06, or PK\x07\x08
  const isZip =
    buffer.length >= 4 &&
    buffer[0] === 0x50 &&
    buffer[1] === 0x4b &&
    (buffer[2] === 0x03 || buffer[2] === 0x05 || buffer[2] === 0x07);

  if (isZip) {
    // Inspect buffer for OpenXML package identifiers: [Content_Types].xml and word/
    const bufferStr = buffer.toString("binary");
    const hasContentTypes = bufferStr.includes("[Content_Types].xml");
    const hasWordDir =
      bufferStr.includes("word/document.xml") ||
      bufferStr.includes("word/_rels/") ||
      bufferStr.includes("word/");

    if (hasContentTypes && hasWordDir) {
      return {
        detectedFormat: "docx",
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        isRecognized: true,
      };
    }

    // Generic ZIP archive, but not a valid Word (.docx) document
    return {
      detectedFormat: null,
      mimeType: "application/zip",
      isRecognized: false,
      reason: "ZIP archive does not contain a valid DOCX WordprocessingML package",
    };
  }

  // 3. Check for TXT (UTF-8 / ASCII text stream)
  // Verify buffer contains readable text without binary null bytes or excessive control codes
  const maxInspect = Math.min(buffer.length, 4096);
  let nullBytes = 0;
  let controlChars = 0;

  for (let i = 0; i < maxInspect; i++) {
    const byte = buffer[i];
    if (byte === 0x00) {
      nullBytes++;
    } else if (byte < 0x09 || (byte > 0x0d && byte < 0x20)) {
      // Non-whitespace control character
      controlChars++;
    }
  }

  // If there are null bytes or more than 2% control characters, it is binary data, not text
  if (nullBytes > 0 || controlChars / maxInspect > 0.02) {
    return {
      detectedFormat: null,
      mimeType: "application/octet-stream",
      isRecognized: false,
      reason: "File contains binary data or control characters incompatible with plain text",
    };
  }

  // Verify UTF-8 decoding is clean without corrupt replacement characters
  try {
    const decoder = new TextDecoder("utf-8", { fatal: true });
    decoder.decode(buffer.subarray(0, maxInspect));
    return {
      detectedFormat: "txt",
      mimeType: "text/plain",
      isRecognized: true,
    };
  } catch {
    return {
      detectedFormat: null,
      mimeType: "application/octet-stream",
      isRecognized: false,
      reason: "File content is not valid UTF-8 text",
    };
  }
}
