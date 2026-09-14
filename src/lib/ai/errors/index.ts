/**
 * Typed machine-readable error codes for the AI Analysis Engine.
 */
export type AiErrorCode =
  | "AI_CONFIG_ERROR"
  | "AI_AUTH_ERROR"
  | "AI_RATE_LIMITED"
  | "AI_TIMEOUT"
  | "AI_PROVIDER_ERROR"
  | "AI_INVALID_RESPONSE"
  | "AI_SCHEMA_ERROR"
  | "AI_SOURCE_VALIDATION_ERROR"
  | "AI_CONTEXT_TOO_LARGE"
  | "AI_UNKNOWN_ERROR";

export interface AiErrorDetails {
  code: AiErrorCode;
  message: string;
  statusCode?: number;
  details?: Record<string, unknown>;
}

/**
 * Structured domain error for AI analysis failures.
 * Encapsulates safe user-facing messaging while preserving diagnostic context server-side.
 */
export class AiEngineError extends Error {
  public readonly code: AiErrorCode;
  public readonly statusCode: number;
  public readonly details?: Record<string, unknown>;

  constructor(code: AiErrorCode, message: string, statusCode: number = 500, details?: Record<string, unknown>) {
    super(message);
    this.name = "AiEngineError";
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, AiEngineError.prototype);
  }
}

/**
 * Maps any internal error or AiEngineError to a safe, user-friendly explanation.
 * Strictly guarantees that API keys, raw provider responses, internal URLs, or stack traces
 * are never leaked to client applications.
 */
export function toSafeUserMessage(error: unknown): string {
  if (error instanceof AiEngineError) {
    switch (error.code) {
      case "AI_CONFIG_ERROR":
      case "AI_AUTH_ERROR":
        return "AI analysis service is temporarily unavailable. Please check system configuration or try again later.";
      case "AI_RATE_LIMITED":
        return "The AI analysis service is experiencing high traffic. Please wait a moment and try again.";
      case "AI_TIMEOUT":
        return "The analysis request timed out while processing your document. Please try again.";
      case "AI_CONTEXT_TOO_LARGE":
        return "The document is too extensive for single-pass analysis. Please consider a shorter section or summary.";
      case "AI_SCHEMA_ERROR":
        return "The AI generated an unexpected response structure. Please retry analysis.";
      case "AI_INVALID_RESPONSE":
        if (error.details?.diagnostic === "TRUNCATED_OR_MALFORMED_JSON") {
          return "LexiGuide received an incomplete AI analysis. Please retry.";
        }
        return "The AI generated an unexpected response structure. Please retry analysis.";
      case "AI_SOURCE_VALIDATION_ERROR":
        return "The analysis could not be safely verified against the document source text. Analysis aborted for safety.";
      case "AI_PROVIDER_ERROR":
      case "AI_UNKNOWN_ERROR":
      default:
        return "An error occurred while analyzing the document with AI. Please try again.";
    }
  }

  if (error instanceof Error && error.name === "AbortError") {
    return "The analysis request timed out. Please try again.";
  }

  return "An unexpected error occurred during document analysis. Please try again.";
}
