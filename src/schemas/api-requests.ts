import { z } from "zod";
import { QUOTA_CONFIG } from "@/lib/security/quota-config";

/**
 * Strict Zod validation schemas for all public LexiGuide AI API endpoints.
 * Prevents oversized payloads, type coercion attacks, malformed document references,
 * empty questions, and invalid states before any server processing or AI invocation.
 */

export const DocumentIdSchema = z
  .string()
  .trim()
  .min(1, "Document ID cannot be empty.")
  .max(100, "Document ID is too long.")
  .regex(/^[a-zA-Z0-9_-]+$/, "Document ID contains invalid characters.");

export const AnalysisRequestSchema = z
  .object({
    documentId: DocumentIdSchema.optional(),
    document: z
      .object({
        id: DocumentIdSchema,
        displayName: z.string().trim().min(1).max(255),
        chunks: z
          .array(
            z.object({
              chunkId: z.string().min(1),
              text: z.string().min(0),
            }).passthrough()
          )
          .max(500, "Document exceeds maximum chunk limit."),
      })
      .passthrough()
      .optional(),
    requestId: z.string().max(100).optional(),
  })
  .refine(
    (data) => Boolean(data.documentId || data.document),
    "Either 'documentId' or 'document' must be provided."
  );

export type AnalysisRequestInput = z.infer<typeof AnalysisRequestSchema>;

export const QaRequestSchema = z.object({
  documentId: DocumentIdSchema,
  question: z
    .string()
    .trim()
    .min(1, "Question cannot be empty.")
    .max(
      QUOTA_CONFIG.maxQuestionLength,
      `Question exceeds the maximum length of ${QUOTA_CONFIG.maxQuestionLength} characters.`
    ),
  document: z
    .object({
      id: DocumentIdSchema,
      chunks: z.array(z.any()).min(1),
    })
    .passthrough()
    .optional(),
  requestId: z.string().max(100).optional(),
});

export type QaRequestInput = z.infer<typeof QaRequestSchema>;

export const ComparisonRequestSchema = z
  .object({
    documentAId: DocumentIdSchema,
    documentBId: DocumentIdSchema,
    comparisonId: z.string().trim().max(100).optional(),
    skipAi: z.boolean().optional(),
    requestId: z.string().max(100).optional(),
  })
  .refine(
    (data) => data.documentAId !== data.documentBId,
    {
      message: "Cannot compare a document to itself. Select two different documents.",
      path: ["documentBId"],
    }
  );

export type ComparisonRequestInput = z.infer<typeof ComparisonRequestSchema>;
