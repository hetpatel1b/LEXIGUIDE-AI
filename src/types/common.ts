/**
 * Common shared utility types for API responses and operational statuses.
 */

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  timestamp: string;
}

export type OperationState = "idle" | "loading" | "success" | "error";
