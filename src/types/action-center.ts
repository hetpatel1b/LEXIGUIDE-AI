/**
 * Action Center domain contracts and state management.
 * Provides a structured decision and follow-up workspace for legal findings.
 */

export type ActionCategory = "review" | "upcoming" | "confirm" | "discuss";

export type ActionStatus =
  | "needs_review"
  | "upcoming"
  | "confirm"
  | "discuss"
  | "completed";

export interface ActionItem {
  id: string;
  title: string;
  category: ActionCategory;
  status: ActionStatus;
  description: string;
  whyItMatters?: string;
  sourceSection?: string;
  pageNumber?: number;
  suggestedQuestion?: string;
  isChecked?: boolean;
  evidenceSnippet?: string;
  dueDate?: string;
}

export interface ActionSummaryMetrics {
  total: number;
  completed: number;
  reviewCount: number;
  upcomingCount: number;
  confirmCount: number;
  discussCount: number;
}
