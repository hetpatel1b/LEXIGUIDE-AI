import { z } from "zod";

/**
 * Raw citation emitted by the model.
 * Quotes are strictly bounded to <= 150 chars (target <= 100).
 */
export const QaRawSourceCitationSchema = z.object({
  chunkId: z.string().describe("The exact chunkId (e.g. chk_xxx) from which the fact was extracted"),
  quote: z
    .string()
    .max(150, "Quotes must be concise excerpts <= 150 characters")
    .describe("Exact verbatim snippet from the document chunk"),
});

export const QaKeyPointSchema = z.object({
  text: z.string().describe("A concise key factual point"),
  source: QaRawSourceCitationSchema.optional(),
});

/**
 * Authoritative schema for Nemotron Q&A structured output.
 */
export const RawQaResponseSchema = z.object({
  answer: z
    .string()
    .min(1, "Answer cannot be empty")
    .describe("Direct, objective, document-grounded answer to the user's question"),
  answerStatus: z
    .enum(["grounded", "not_found", "partially_supported"])
    .describe(
      "'grounded' if directly supported by evidence; 'not_found' if not in document; 'partially_supported' if only part is in document"
    ),
  keyPoints: z.array(QaKeyPointSchema).default([]),
  sources: z.array(QaRawSourceCitationSchema).default([]),
  nextStep: z
    .string()
    .nullable()
    .default(null)
    .describe("Optional practical next step for the user to review"),
});

export type RawQaResponse = z.infer<typeof RawQaResponseSchema>;
export type QaRawSourceCitation = z.infer<typeof QaRawSourceCitationSchema>;
export type QaKeyPoint = z.infer<typeof QaKeyPointSchema>;
