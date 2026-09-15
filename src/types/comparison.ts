/**
 * Comparison contracts for multi-document discrepancy, diff, and consistency detection.
 */

export type DifferenceType = "added" | "removed" | "modified" | "unchanged";

export type ChangeSeverity = "major" | "moderate" | "minor";

export type ComparisonCategory =
  | "All"
  | "Major Changes"
  | "Moderate Changes"
  | "Minor Changes"
  | "Unchanged"
  | "Financial"
  | "Obligations"
  | "Dates"
  | "Risks"
  | "Legal";

export interface ComparisonDocument {
  id: string;
  name: string;
  type: string;
  pageCount: number;
  sizeBytes: number;
  versionLabel: string;
  isPrimary?: boolean;
}

export interface ComparisonSourceEvidence {
  documentId: string;
  documentName: string;
  sectionId?: string;
  sectionTitle: string;
  chunkId: string;
  pageNumber: number;
  quote: string;
  verified: boolean;
}

export interface ComparisonChange {
  id: string;
  clauseTitle: string;
  category: "Financial" | "Obligations" | "Dates" | "Risks" | "Legal" | string;
  changeSeverity: ChangeSeverity;
  status?: DifferenceType;
  sectionA: string;
  sectionB: string;
  pageA: number;
  pageB: number;
  docAContent: string;
  docBContent: string;
  summaryChange: string;
  whyItMatters?: string;
  suggestedReviewQuestion?: string;
  diffHighlightA?: string;
  diffHighlightB?: string;
  sourceA?: ComparisonSourceEvidence;
  sourceB?: ComparisonSourceEvidence;
}

export interface ComparisonSummaryMetrics {
  sectionsCompared: number;
  changesIdentified: number;
  majorChanges: number;
  moderateChanges: number;
  minorChanges: number;
  unchangedCount: number;
  potentialInconsistencies?: number;
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

export interface ComparisonInconsistency {
  id: string;
  title: string;
  inconsistencyType: "internal" | "cross_version";
  documentId: string;
  documentName: string;
  severity: ChangeSeverity;
  provisionA: {
    sectionTitle: string;
    pageNumber: number;
    quote: string;
    chunkId: string;
  };
  provisionB: {
    sectionTitle: string;
    pageNumber: number;
    quote: string;
    chunkId: string;
  };
  explanation: string;
  whyItMatters: string;
  suggestedReviewQuestion?: string;
}

// Keep InconsistencyItem for backward compatibility if referenced
export interface InconsistencyItem {
  id: string;
  title: string;
  description: string;
  affectedDocuments: [string, string];
  potentialConflict: string;
}

export interface ComparisonUnchangedSection {
  id: string;
  title: string;
  sectionReference: string;
  pageNumber: number;
  chunkId?: string;
  note: string;
}

export interface ComparisonDiagnostics {
  comparisonRequestId: string;
  documentAId: string;
  documentBId: string;
  sectionCountA: number;
  sectionCountB: number;
  mappedSectionCount: number;
  unmappedSectionCount: number;
  changedClauseCount: number;
  aiClauseCount: number;
  contextChars: number;
  estimatedInputTokens: number;
  outputTokens?: number;
  aiCallCount: number;
  sectionMappingMs: number;
  clauseMappingMs: number;
  diffMs: number;
  nvidiaTtftMs: number;
  generationMs: number;
  jsonParseMs: number;
  zodMs: number;
  sourceValidationMs: number;
  totalMs: number;
  aiUsed: boolean;
  aiError?: string;
}

export interface ComparisonResult {
  documentA: ComparisonDocument;
  documentB: ComparisonDocument;
  metrics: ComparisonSummaryMetrics;
  changes: ComparisonChange[];
  inconsistencies: ComparisonInconsistency[];
  unchangedSections: ComparisonUnchangedSection[];
  unmappedSections?: {
    documentA: string[];
    documentB: string[];
  };
  diagnostics?: ComparisonDiagnostics;
}
