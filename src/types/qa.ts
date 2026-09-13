/**
 * Grounded Q&A domain contracts and evidence citations.
 */

export interface EvidenceCitation {
  id: string;
  excerpt: string;
  pageNumber?: number;
  sectionTitle?: string;
  confidenceScore?: number;
}

export interface QuestionMessage {
  id: string;
  documentId: string;
  question: string;
  answer?: string;
  evidence?: EvidenceCitation[];
  askedAt: string;
  answeredAt?: string;
}
