/**
 * Grounded Q&A domain contracts and evidence citations.
 */

export type QACategory =
  | "understand"
  | "obligations"
  | "concerns"
  | "clauses";

export interface QATopicGroup {
  id: QACategory;
  title: string;
  description: string;
  iconName: string;
  questions: string[];
}

export interface EvidenceCitation {
  id: string;
  excerpt: string;
  pageNumber?: number;
  sectionTitle?: string;
  confidenceScore?: number;
  documentTitle?: string;
}

export interface QuestionMessage {
  id: string;
  documentId: string;
  question: string;
  answer?: string;
  evidence?: EvidenceCitation[];
  askedAt: string;
  answeredAt?: string;
  category?: QACategory;
  suggestedNextStep?: string;
  isNotFound?: boolean;
}
