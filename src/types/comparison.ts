/**
 * Comparison contracts for multi-document discrepancy and consistency detection.
 */

export type DifferenceType = "added" | "removed" | "modified" | "unchanged";

export interface ComparisonDiff {
  id: string;
  clauseTitle: string;
  docAContent?: string;
  docBContent?: string;
  changeType: DifferenceType;
  significance: "critical" | "moderate" | "minor";
  notes?: string;
}

export interface InconsistencyItem {
  id: string;
  title: string;
  description: string;
  affectedDocuments: [string, string];
  potentialConflict: string;
}
