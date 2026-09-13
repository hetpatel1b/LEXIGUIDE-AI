/**
 * Comparison contracts for multi-document discrepancy and consistency detection.
 */

export type DifferenceType = "added" | "removed" | "modified" | "unchanged";

export type ChangeSeverity = "major" | "moderate" | "unchanged";

export type ComparisonCategory =
  | "All"
  | "Major Changes"
  | "Moderate Changes"
  | "Unchanged"
  | "Financial"
  | "Obligations"
  | "Dates"
  | "Risks";

export interface ComparisonDocument {
  id: string;
  name: string;
  type: string;
  pageCount: number;
  sizeBytes: number;
  versionLabel: string;
  isPrimary?: boolean;
}

export interface ComparisonChange {
  id: string;
  clauseTitle: string;
  category: "Financial" | "Obligations" | "Dates" | "Risks" | "Legal";
  changeSeverity: ChangeSeverity;
  sectionA: string;
  sectionB: string;
  pageA: number;
  pageB: number;
  docAContent: string;
  docBContent: string;
  summaryChange: string;
  whyItMatters?: string;
  diffHighlightA?: string;
  diffHighlightB?: string;
}

export interface ComparisonSummaryMetrics {
  sectionsCompared: number;
  changesIdentified: number;
  majorChanges: number;
  moderateChanges: number;
  minorChanges: number;
  unchangedCount: number;
}

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
