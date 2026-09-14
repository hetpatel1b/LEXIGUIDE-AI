import { z } from "zod";

/**
 * Zod validation schemas for AI-generated document analysis.
 * Enforces schema versioning ("1.0") and strict structural grounding.
 */

export const SourceCitationSchema = z.object({
  chunkId: z.string().min(1, "chunkId is required"),
  sectionId: z.string().nullable().optional(),
  sectionTitle: z.string().nullable().optional(),
  pageNumber: z.number().int().positive().nullable().optional(),
  quote: z.string().min(1, "quote is required"),
});

export const DocumentPartySchema = z.object({
  role: z.string().min(1, "role is required"),
  name: z.string().min(1, "name is required"),
});

export const ExtractedDocumentMetadataSchema = z.object({
  documentType: z.string().default("Not found in the uploaded document."),
  parties: z.array(DocumentPartySchema).default([]),
  effectiveDate: z.string().nullable().default(null),
  terminationDate: z.string().nullable().default(null),
  jurisdiction: z.string().nullable().default(null),
  governingLaw: z.string().nullable().default(null),
  financialTerms: z.string().nullable().default(null),
});

export const ExecutiveSummarySchema = z.object({
  overview: z.string().min(10, "Overview summary must contain at least 10 characters"),
  keyThemes: z.array(z.string()).default([]),
  majorObligationsSummary: z.array(z.string()).default([]),
  reviewPriorities: z.array(z.string()).default([]),
});

export const KeyClauseSchema = z.object({
  id: z.string().min(1, "Clause id is required"),
  title: z.string().min(1, "Clause title is required"),
  category: z.string().min(1, "Clause category is required"),
  summary: z.string().min(5, "Clause summary must contain at least 5 characters"),
  importance: z.enum(["critical", "standard", "notable"]).default("standard"),
  source: SourceCitationSchema,
  verified: z.boolean().default(false),
});

export const PotentialConcernSchema = z.object({
  id: z.string().min(1, "Concern id is required"),
  title: z.string().min(1, "Concern title is required"),
  severity: z.enum(["high", "medium", "low"]).default("medium"),
  explanation: z.string().min(10, "Explanation must contain at least 10 characters"),
  whyItMatters: z.string().min(5, "whyItMatters must contain at least 5 characters"),
  suggestedReviewQuestion: z.string().min(5, "suggestedReviewQuestion is required"),
  source: SourceCitationSchema,
  verified: z.boolean().default(false),
});

export const ObligationSchema = z.object({
  id: z.string().min(1, "Obligation id is required"),
  description: z.string().min(5, "Obligation description must contain at least 5 characters"),
  party: z.string().min(1, "Party description is required"),
  responsibleParty: z.string().min(1, "Responsible party is required"),
  deadline: z.string().nullable().default(null),
  consequence: z.string().nullable().default(null),
  source: SourceCitationSchema,
  verified: z.boolean().default(false),
});

export const ImportantDateSchema = z.object({
  id: z.string().min(1, "Date id is required"),
  label: z.string().min(1, "Date label is required"),
  dateOrDuration: z.string().min(1, "dateOrDuration is required"),
  type: z.enum(["calendar_date", "duration", "notice_period", "renewal_period"]).default("calendar_date"),
  source: SourceCitationSchema,
  verified: z.boolean().default(false),
});

/**
 * Raw output schema parsed directly from model JSON.
 */
export const RawAiAnalysisResponseSchema = z.object({
  analysisSchemaVersion: z.literal("1.0"),
  metadata: ExtractedDocumentMetadataSchema,
  executiveSummary: ExecutiveSummarySchema,
  keyClauses: z.array(KeyClauseSchema).default([]),
  potentialConcerns: z.array(PotentialConcernSchema).default([]),
  obligations: z.array(ObligationSchema).default([]),
  importantDates: z.array(ImportantDateSchema).default([]),
  analysisNotes: z.array(z.string()).default([]),
});

export type RawAiAnalysisResponse = z.infer<typeof RawAiAnalysisResponseSchema>;
