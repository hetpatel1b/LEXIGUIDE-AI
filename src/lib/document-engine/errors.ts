/**
 * Machine-readable document engine error codes.
 */
export type DocumentErrorCode =
  | "VALIDATION_ERROR"
  | "FILE_TOO_LARGE"
  | "UNSUPPORTED_FILE_TYPE"
  | "EMPTY_DOCUMENT"
  | "NO_READABLE_TEXT"
  | "PARSING_ERROR"
  | "CORRUPTED_DOCUMENT"
  | "INTERNAL_ERROR";

export interface DocumentErrorResponse {
  success: false;
  error: {
    code: DocumentErrorCode;
    message: string;
    suggestion?: string;
  };
  timestamp: string;
}

/**
 * Structured document engine error.
 * Encapsulates safe user-facing message, HTTP status code, and machine-readable error code.
 * Ensures internal filesystem paths, memory dumps, or library stack traces never leak to the client.
 */
export class DocumentEngineError extends Error {
  public readonly code: DocumentErrorCode;
  public readonly statusCode: number;
  public readonly suggestion?: string;

  constructor(
    message: string,
    code: DocumentErrorCode = "INTERNAL_ERROR",
    statusCode = 500,
    suggestion?: string
  ) {
    super(message);
    this.name = "DocumentEngineError";
    this.code = code;
    this.statusCode = statusCode;
    this.suggestion = suggestion;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, DocumentEngineError);
    }
  }

  public toResponse(): DocumentErrorResponse {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        suggestion: this.suggestion,
      },
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Creates user-friendly errors with actionable remediation advice.
 */
export function createDocumentError(
  code: DocumentErrorCode,
  customMessage?: string
): DocumentEngineError {
  switch (code) {
    case "FILE_TOO_LARGE":
      return new DocumentEngineError(
        customMessage || "The uploaded document exceeds the maximum allowable limit of 25MB.",
        "FILE_TOO_LARGE",
        413,
        "Please select a smaller document under 25MB."
      );
    case "UNSUPPORTED_FILE_TYPE":
      return new DocumentEngineError(
        customMessage || "Unsupported file format. LexiGuide AI accepts PDF, DOCX, and TXT documents.",
        "UNSUPPORTED_FILE_TYPE",
        415,
        "Please upload a document ending in .pdf, .docx, or .txt."
      );
    case "EMPTY_DOCUMENT":
      return new DocumentEngineError(
        customMessage || "The uploaded document is empty and contains no readable data.",
        "EMPTY_DOCUMENT",
        422,
        "Please verify your file content and try again."
      );
    case "NO_READABLE_TEXT":
      return new DocumentEngineError(
        customMessage || "No readable text was found in this document. It may be a scanned or image-only PDF.",
        "NO_READABLE_TEXT",
        422,
        "LexiGuide AI requires searchable, text-based documents. Please upload an OCR-processed or text-based document."
      );
    case "CORRUPTED_DOCUMENT":
      return new DocumentEngineError(
        customMessage || "The document appears to be corrupted or cannot be read.",
        "CORRUPTED_DOCUMENT",
        422,
        "Please re-export or re-save the file and attempt uploading again."
      );
    case "PARSING_ERROR":
      return new DocumentEngineError(
        customMessage || "We encountered an issue extracting structure from this document.",
        "PARSING_ERROR",
        422,
        "Please try saving the document in standard PDF, DOCX, or plain text format."
      );
    case "VALIDATION_ERROR":
      return new DocumentEngineError(
        customMessage || "Document validation failed.",
        "VALIDATION_ERROR",
        400,
        "Please verify the document format and size."
      );
    case "INTERNAL_ERROR":
    default:
      return new DocumentEngineError(
        "An unexpected error occurred while processing the document.",
        "INTERNAL_ERROR",
        500,
        "Please try again in a few moments."
      );
  }
}
