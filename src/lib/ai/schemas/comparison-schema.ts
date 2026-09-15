import { z } from "zod";

/**
 * AI Explanation for a changed clause pair.
 * The AI provides what changed, why it matters, and a review question.
 * The application independently attaches authoritative page, chunk, and section metadata.
 */
export const AiComparisonChangeExplanationSchema = z.object({
  changeId: z.string().describe("The matching change identifier passed in the prompt (e.g. chg_0)"),
  title: z.string().optional().describe("Descriptive title of the clause or change"),
  severity: z.enum(["major", "moderate", "minor"]).optional().describe("Materiality of the change"),
  explanation: z.string().min(1).describe("Concise explanation of the substantive difference between Version A and B"),
  whyItMatters: z.string().min(1).describe("Cautious, practical explanation of potential legal/operational implications"),
  suggestedReviewQuestion: z.string().optional().describe("Specific follow-up question for document review"),
});

/**
 * AI finding for an internal or cross-version conflict.
 */
export const AiComparisonInconsistencySchema = z.object({
  title: z.string().min(1).describe("Title of the potential conflict"),
  explanation: z.string().min(1).describe("Explanation of the contradictory terms"),
  whyItMatters: z.string().min(1).describe("Why this conflict may cause ambiguity or warrants review"),
  provisionAQuote: z.string().optional().describe("Quote from first provision"),
  provisionBQuote: z.string().optional().describe("Quote from second provision"),
});

/**
 * Authoritative Zod schema for Nemotron comparison structured output.
 */
export const RawAiComparisonResponseSchema = z.object({
  changes: z.array(AiComparisonChangeExplanationSchema).default([]),
  inconsistencies: z.array(AiComparisonInconsistencySchema).default([]),
});

export type RawAiComparisonResponse = z.infer<typeof RawAiComparisonResponseSchema>;
export type AiComparisonChangeExplanation = z.infer<typeof AiComparisonChangeExplanationSchema>;
export type AiComparisonInconsistency = z.infer<typeof AiComparisonInconsistencySchema>;
