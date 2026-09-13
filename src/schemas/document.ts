import { z } from "zod";
import { FILE_CONSTRAINTS } from "@/lib/constants";

/**
 * Validation schema for document upload metadata.
 * Enforces file size limits and accepted legal document formats.
 */
export const documentUploadSchema = z.object({
  name: z
    .string()
    .min(1, "Document name is required")
    .max(255, "Document name must not exceed 255 characters"),
  sizeBytes: z
    .number()
    .positive("Document size must be positive")
    .max(
      FILE_CONSTRAINTS.maxFileSizeBytes,
      `File size exceeds maximum limit of ${FILE_CONSTRAINTS.maxFileSizeMB}MB`
    ),
  mimeType: z.enum(FILE_CONSTRAINTS.acceptedMimeTypes, {
    errorMap: () => ({
      message: "Unsupported file format. LexiGuide AI accepts PDF, DOCX, and TXT files only.",
    }),
  }),
});

export type DocumentUploadInput = z.infer<typeof documentUploadSchema>;
