/**
 * Document analysis contracts for clauses, risks, and obligations.
 */

export type RiskSeverity = "low" | "medium" | "high";

export interface ClauseItem {
  id: string;
  title: string;
  category: string;
  summary: string;
  pageNumber?: number;
  sectionReference?: string;
  importance?: "critical" | "standard" | "notable";
  evidenceSnippet?: string;
  verified?: boolean;
}

export interface RiskItem {
  id: string;
  title: string;
  severity: RiskSeverity;
  description: string;
  recommendation: string;
  clauseReference?: string;
  pageNumber?: number;
  evidenceSnippet?: string;
  verified?: boolean;
}

export interface ObligationItem {
  id: string;
  party: string;
  duty: string;
  deadline?: string;
  consequences?: string;
  clauseReference?: string;
  pageNumber?: number;
  status?: "Identified" | "Pending Review";
  verified?: boolean;
}

export type ImportantDateType =
  | "calendar_date"
  | "duration"
  | "notice_period"
  | "renewal_period";

export interface ImportantDateItem {
  id: string;
  event: string;
  dateOrDuration: string;
  type: ImportantDateType;
  sourceSection?: string;
  pageNumber?: number;
  description?: string;
  verified?: boolean;
}

export interface DocumentSectionItem {
  id: string;
  sectionNumber: string;
  title: string;
  pageNumber: number;
}

export interface ExecutiveSummaryData {
  overview: string;
  bulletPoints: string[];
  documentContext: {
    jurisdiction: string;
    governingLaw: string;
    effectiveDate: string;
    documentType: string;
  };
}
