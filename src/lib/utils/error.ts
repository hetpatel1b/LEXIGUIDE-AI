/**
 * Standard application error codes.
 */
export type AppErrorCode =
  | "VALIDATION_ERROR"
  | "FILE_TOO_LARGE"
  | "UNSUPPORTED_FILE_TYPE"
  | "RATE_LIMITED"
  | "NOT_FOUND"
  | "INTERNAL_ERROR"
  | "NETWORK_ERROR";

/**
 * Structured application error for controlled error throwing and handling.
 */
export class AppError extends Error {
  public readonly code: AppErrorCode;
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, code: AppErrorCode = "INTERNAL_ERROR", statusCode = 500) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = true;

    // Maintains proper stack trace in V8 environments
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }
}

/**
 * Sanitizes unknown errors for safe presentation in user interfaces.
 * Ensures internal paths, database traces, or raw exception strings are never displayed.
 */
export function getSafeErrorMessage(error: unknown, fallbackMessage = "An unexpected error occurred. Please try again."): string {
  if (error instanceof AppError && error.isOperational) {
    return error.message;
  }

  if (error instanceof Error && process.env.NODE_ENV === "development") {
    return error.message;
  }

  return fallbackMessage;
}
