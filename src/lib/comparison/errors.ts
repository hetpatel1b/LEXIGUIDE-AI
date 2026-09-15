export type ComparisonErrorCode =
  | "VALIDATION_ERROR"
  | "COMPARISON_CONFLICT"
  | "DOCUMENT_NOT_FOUND"
  | "DOCUMENT_INVALID"
  | "INTERNAL_ERROR";

export class ComparisonEngineError extends Error {
  public readonly code: ComparisonErrorCode;
  public readonly statusCode: number;

  constructor(code: ComparisonErrorCode, message: string, statusCode: number = 400) {
    super(message);
    this.name = "ComparisonEngineError";
    this.code = code;
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, ComparisonEngineError.prototype);
  }
}
