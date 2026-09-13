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
}

export interface RiskItem {
  id: string;
  title: string;
  severity: RiskSeverity;
  description: string;
  recommendation: string;
  clauseReference?: string;
  pageNumber?: number;
}

export interface ObligationItem {
  id: string;
  party: string;
  duty: string;
  deadline?: string;
  consequences?: string;
  clauseReference?: string;
}
