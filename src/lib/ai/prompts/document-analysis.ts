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

<untrusted_document_context document_name="${context.displayName}" document_id="${context.documentId}">
${context.contextText}
</untrusted_document_context>

Analyze the text above strictly following the system rules:
- Strictly adhere to item limits: 4-5 key clauses, 3 potential concerns, 3-4 obligations, 3-4 important dates.
- Keep all summaries and explanations concise (1 sentence, max 20 words).
- In "source", supply ONLY "chunkId" and "quote" (verbatim excerpt under 45 characters). Do not output sectionId, sectionTitle, or pageNumber.
- financialTerms: summarize all explicit compensation terms (base salary INR 2,400,000, 15% incentive, retention award INR 600,000) in 1-2 concise sentences.
- jurisdiction / governingLaw: capture the specific seat of arbitration (e.g. Mumbai) and governing law (e.g. Laws of India).
- Do NOT fabricate any facts, clauses, dates, parties, or citations. If information is not present, use "Not found in the uploaded document." or null.
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
- Exactly 3 key clauses, 2 concerns, 3 obligations, 2 dates.
- Keep quotes under 40 characters.
- Return ONLY valid JSON with double-quoted keys and closed string literals.`;
}
