import type { AnalysisContext } from "../types";

/**
 * Builds the user prompt supplying the bounded document context to the model.
 */
export function buildDocumentAnalysisPrompt(context: AnalysisContext): string {
  return `Please analyze the provided legal document context and produce the structured JSON analysis adhering strictly to item limits and concise values.

DOCUMENT METADATA:
- Name: ${context.displayName}
- Format: ${context.format.toUpperCase()}
- Document ID: ${context.documentId}
- Included Chunks: ${context.includedChunks} of ${context.totalChunks} total chunks

BEGIN DOCUMENT CONTEXT:
${context.contextText}
END DOCUMENT CONTEXT

Analyze the text above strictly following the system rules:
- Strictly adhere to item limits: 5-7 key clauses, 3-5 potential concerns, 4-6 obligations, 4-6 important dates.
- Do NOT fabricate any facts, clauses, dates, parties, or citations. If information is not present, use "Not found in the uploaded document." or null.
- Ensure every quote is a concise verbatim excerpt (under 120 characters) from the referenced chunk.
- Every string must be closed with double quotes. In particular, "chunkId": "chk_..." MUST have a closing double quote before the comma.
- Output valid JSON only without markdown code blocks.`;
}

/**
 * Builds the compact user prompt for recovery retry on malformed or truncated responses.
 */
export function buildDocumentAnalysisRetryPrompt(context: AnalysisContext): string {
  return `RETRY EXTRACTION: Please produce a compact, strictly valid JSON analysis from this document context.

DOCUMENT METADATA:
- Name: ${context.displayName}
- Document ID: ${context.documentId}

BEGIN DOCUMENT CONTEXT:
${context.contextText}
END DOCUMENT CONTEXT

RETRY INSTRUCTIONS:
- Exactly 4 key clauses, 3 concerns, 3 obligations, 3 dates.
- Keep quotes under 90 characters.
- Return ONLY valid JSON with double-quoted keys and closed string literals.`;
}
