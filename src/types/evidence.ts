/**
 * Types for verbatim evidence citations and modal views.
 */

export interface EvidenceDetail {
  id: string;
  documentTitle: string;
  sectionReference: string;
  pageNumber: number;
  excerpt: string;
  contextNote?: string;
}
