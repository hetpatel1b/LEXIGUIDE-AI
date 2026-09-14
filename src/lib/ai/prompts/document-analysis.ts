import type { AnalysisContext } from "../types";

/**
 * Builds the user prompt supplying the bounded document context to the model.
 */
export function buildDocumentAnalysisPrompt(context: AnalysisContext): string {
  return `Please analyze the following legal document and produce the structured JSON analysis.

DOCUMENT METADATA:
- Name: ${context.displayName}
- Format: ${context.format.toUpperCase()}
- Document ID: ${context.documentId}
- Included Chunks: ${context.includedChunks} of ${context.totalChunks} total chunks

BEGIN DOCUMENT CONTEXT:
${context.contextText}
END DOCUMENT CONTEXT

Analyze the text above strictly following the system rules. Remember:
- Do NOT fabricate any facts, clauses, dates, parties, or citations.
- If information is not present, use "Not found in the uploaded document." or null.
- Ensure every quote is verbatim from the referenced chunk.
- Output valid JSON only.`;
}
