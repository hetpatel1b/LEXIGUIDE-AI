/**
 * Types for verbatim evidence citations, modal views, and copilot dialogue context.
 */

export interface EvidenceDetail {
  id: string;
  documentTitle: string;
  sectionReference: string;
  pageNumber: number;
  excerpt: string;
  contextNote?: string;
}

export interface CopilotQAPair {
  question: string;
  answer: string;
  sectionReference: string;
  pageNumber: number;
  evidenceExcerpt: string;
  suggestedNextStep?: string;
}
