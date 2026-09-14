/**
 * Source citation pointing back to the immutable NormalizedDocument.
 */
export interface SourceCitation {
  chunkId: string;
  sectionId?: string | null;
  sectionTitle?: string | null;
  pageNumber?: number | null;
  quote: string;
}

export interface DocumentParty {
  role: string;
  name: string;
}

export interface ExtractedDocumentMetadata {
  documentType: string;
  parties: DocumentParty[];
  effectiveDate: string | null;
  terminationDate: string | null;
  jurisdiction: string | null;
  governingLaw: string | null;
  financialTerms: string | null;
}

export interface ExecutiveSummary {
  overview: string;
  keyThemes: string[];
  majorObligationsSummary: string[];
  reviewPriorities: string[];
}

export interface KeyClause {
  id: string;
  title: string;
  category: string;
  summary: string;
  importance: "critical" | "standard" | "notable";
  source: SourceCitation;
  verified: boolean;
}

export interface PotentialConcern {
  id: string;
  title: string;
  severity: "high" | "medium" | "low";
  explanation: string;
  whyItMatters: string;
  suggestedReviewQuestion: string;
  source: SourceCitation;
  verified: boolean;
}

export interface Obligation {
  id: string;
  description: string;
  party: string;
  responsibleParty: string;
  deadline: string | null;
  consequence: string | null;
  source: SourceCitation;
  verified: boolean;
}

export interface ImportantDate {
  id: string;
  label: string;
  dateOrDuration: string;
  type: "calendar_date" | "duration" | "notice_period" | "renewal_period";
  source: SourceCitation;
  verified: boolean;
}

/**
 * Complete canonical AnalysisResult produced by Nemotron AI analysis.
 */
export interface AnalysisResult {
  analysisSchemaVersion: "1.0";
  documentId: string;
  documentName: string;
  analyzedAt: string;
  modelUsed: string;
  metadata: ExtractedDocumentMetadata;
  executiveSummary: ExecutiveSummary;
  keyClauses: KeyClause[];
  potentialConcerns: PotentialConcern[];
  obligations: Obligation[];
  importantDates: ImportantDate[];
  analysisNotes: string[];
}

/**
 * Bounded prompt context prepared by the ContextBuilder.
 */
export interface AnalysisContext {
  documentId: string;
  displayName: string;
  format: string;
  totalChunks: number;
  includedChunks: number;
  estimatedTokens: number;
  contextText: string;
}
