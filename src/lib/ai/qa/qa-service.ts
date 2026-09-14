import type { NormalizedDocument, DocumentChunk } from "@/lib/document-engine/types";
import { NemotronClient } from "../client/nemotron-client";
import { AiEngineError } from "../errors";
import { RawQaResponseSchema, type RawQaResponse } from "../schemas/qa-schema";
import { QA_SYSTEM_PROMPT, buildQaUserPrompt } from "../prompts/qa-prompt";
import { defaultRetriever } from "@/lib/retrieval/document-retriever";
import type { DocumentRetriever, RetrievedChunk } from "@/lib/retrieval/types";
import { classifyQuestionQuality } from "@/lib/retrieval/query-processor";

export interface VerifiedQaSource {
  chunkId: string;
  sectionId: string;
  sectionTitle: string;
  pageNumber: number | null;
  quote: string;
  isVerified: boolean;
}

export interface QaDiagnostics {
  qaRequestId: string;
  documentId: string;
  questionLength: number;
  candidateCount: number;
  topK: number;
  retrievalMethod: string;
  retrievalMs: number;
  contextChars: number;
  estimatedInputTokens: number;
  nvidiaTtftMs: number;
  generationMs: number;
  jsonParseMs: number;
  zodMs: number;
  sourceValidationMs: number;
  totalMs: number;
  answerStatus: string;
  verifiedSourceCount: number;
}

export interface GroundedQaResult {
  documentId: string;
  documentName: string;
  question: string;
  answer: string;
  answerStatus: "grounded" | "not_found" | "partially_supported" | "clarification";
  keyPoints: Array<{
    text: string;
    source?: VerifiedQaSource;
  }>;
  sources: VerifiedQaSource[];
  nextStep: string | null;
  diagnostics: QaDiagnostics;
}

function normalizeForComparison(text: string): string {
  return text.replace(/\s+/g, " ").trim().toLowerCase();
}

/**
 * Extracts and cleans JSON string from LLM response.
 */
function extractCleanJson(rawText: string): string {
  let cleaned = rawText.trim();

  // Strip markdown code fences if present
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "");
    const lastFence = cleaned.lastIndexOf("```");
    if (lastFence !== -1) {
      cleaned = cleaned.substring(0, lastFence).trim();
    }
  }

  // Find first '{' and last '}'
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1).trim();
  }

  return cleaned;
}

/**
 * Verifies model-generated citations against authentic document chunks.
 * Resolves authoritative sectionTitle, pageNumber, and sectionId from chunk provenance.
 */
function verifyQaSource(
  citation: { chunkId: string; quote: string },
  chunkMap: Map<string, DocumentChunk>
): VerifiedQaSource {
  const targetChunk = chunkMap.get(citation.chunkId);

  if (!targetChunk) {
    return {
      chunkId: citation.chunkId,
      sectionId: "unknown",
      sectionTitle: "Document Content",
      pageNumber: null,
      quote: citation.quote,
      isVerified: false,
    };
  }

  const normQuote = normalizeForComparison(citation.quote || "");
  const normChunkText = normalizeForComparison(targetChunk.text);
  const quoteMatches = normQuote.length > 0 && normChunkText.includes(normQuote);

  return {
    chunkId: targetChunk.chunkId,
    sectionId: targetChunk.sectionId,
    sectionTitle: targetChunk.sectionTitle || "Document Content",
    pageNumber: targetChunk.pageNumbers && targetChunk.pageNumbers.length > 0 ? targetChunk.pageNumbers[0] : null,
    quote: citation.quote,
    isVerified: quoteMatches,
  };
}

/**
 * Production Q&A Service coordinating server-side retrieval,
 * prompt building, NVIDIA Nemotron inference, Zod validation, and source verification.
 */
export class QaService {
  private retriever: DocumentRetriever;
  private customAiClient?: NemotronClient;

  constructor(retriever: DocumentRetriever = defaultRetriever, aiClient?: NemotronClient) {
    this.retriever = retriever;
    this.customAiClient = aiClient;
  }

  private getAiClient(): NemotronClient {
    if (this.customAiClient) return this.customAiClient;
    return new NemotronClient();
  }

  public async answerQuestion(
    document: NormalizedDocument,
    question: string,
    requestId?: string
  ): Promise<GroundedQaResult> {
    const totalStart = Date.now();
    const qaRequestId =
      requestId || `qa_${Math.random().toString(36).substring(2, 9)}_${Date.now().toString(36)}`;
    const reqTag = `[${qaRequestId}]`;

    // 1. Validate Input
    const cleanQuestion = (question || "").trim();
    if (!cleanQuestion) {
      throw new AiEngineError("AI_INVALID_RESPONSE", "Question cannot be empty.", 400);
    }

    if (!document || !document.chunks || !Array.isArray(document.chunks)) {
      throw new AiEngineError("AI_INVALID_RESPONSE", "Invalid document: no chunks available.", 422);
    }

    console.log(`[QA-DIAG]${reqTag} request started: documentId=${document.id}`);
    console.log(`[QA-DIAG]${reqTag} documentId=${document.id}`);
    console.log(`[QA-DIAG]${reqTag} activeDocumentFound=true`);
    console.log(`[QA-DIAG]${reqTag} chunkCount=${document.chunks.length}`);
    console.log(`[QA-DIAG]${reqTag} questionLength=${cleanQuestion.length}`);

    // 2. Classify Question Quality (Specific vs Vague vs Empty)
    const quality = classifyQuestionQuality(cleanQuestion);
    if (quality === "vague") {
      const totalMs = Date.now() - totalStart;
      console.log(`[QA-DIAG]${reqTag} questionClassification=vague`);
      console.log(`[QA-DIAG]${reqTag} answerStatus=clarification`);
      console.log(`[QA-DIAG]${reqTag} verifiedSourceCount=0`);
      console.log(`[QA-DIAG]${reqTag} total=${totalMs}ms`);
      console.log(`[QA-DIAG]${reqTag} request completed`);

      return {
        documentId: document.id,
        documentName: document.displayName,
        question: cleanQuestion,
        answer:
          "Sure — what would you like to know about this document? You can ask about termination, payment, confidentiality, obligations, deadlines, dispute resolution, or a specific clause.",
        answerStatus: "clarification",
        keyPoints: [
          { text: "Termination, notice periods, and severance" },
          { text: "Compensation, base salary, bonuses, and benefits" },
          { text: "Confidentiality, non-disclosure, and trade secrets" },
          { text: "Obligations, incident reporting, and disclosure deadlines" },
          { text: "Dispute resolution, governing law, and arbitration seat" },
        ],
        sources: [],
        nextStep: "Ask a specific question about any of these topics, or reference a clause.",
        diagnostics: {
          qaRequestId,
          documentId: document.id,
          questionLength: cleanQuestion.length,
          candidateCount: document.chunks.length,
          topK: 6,
          retrievalMethod: "clarification_fast_path",
          retrievalMs: 0,
          contextChars: 0,
          estimatedInputTokens: 0,
          nvidiaTtftMs: 0,
          generationMs: 0,
          jsonParseMs: 0,
          zodMs: 0,
          sourceValidationMs: 0,
          totalMs,
          answerStatus: "clarification",
          verifiedSourceCount: 0,
        },
      };
    }

    // 3. Perform Retrieval
    console.log(`[QA-DIAG]${reqTag} retrieval started`);
    const retrievalStart = Date.now();
    const retrievalResult = await this.retriever.retrieve(
      {
        documentId: document.id,
        query: cleanQuestion,
        topK: 6,
        threshold: 3.0,
        includeAdjacent: true,
      },
      document
    );
    const retrievalMs = Date.now() - retrievalStart;

    console.log(`[QA-DIAG]${reqTag} candidateCount=${document.chunks.length}`);
    console.log(`[QA-DIAG]${reqTag} topK=6`);
    console.log(`[QA-DIAG]${reqTag} topScore=${retrievalResult.highestScore}`);
    console.log(`[QA-DIAG]${reqTag} threshold=3.0`);
    console.log(`[QA-DIAG]${reqTag} qualifiedEvidenceCount=${retrievalResult.retrievedChunks.length}`);
    console.log(`[QA-DIAG]${reqTag} retrieval completed in ${retrievalMs}ms`);

    // Index chunks by ID for O(1) source validation
    const chunkMap = new Map<string, DocumentChunk>();
    for (const chunk of document.chunks) {
      chunkMap.set(chunk.chunkId, chunk);
    }

    // 4. Check Evidence Threshold (Not-Found Fast Path)
    if (!retrievalResult.isAboveThreshold || retrievalResult.retrievedChunks.length === 0) {
      const totalMs = Date.now() - totalStart;
      console.log(`[QA-DIAG]${reqTag} contextChars=0`);
      console.log(`[QA-DIAG]${reqTag} answerStatus=not_found`);
      console.log(`[QA-DIAG]${reqTag} verifiedSourceCount=0`);
      console.log(`[QA-DIAG]${reqTag} total=${totalMs}ms`);
      console.log(`[QA-DIAG]${reqTag} request completed`);

      return {
        documentId: document.id,
        documentName: document.displayName,
        question: cleanQuestion,
        answer: "Not found in the uploaded document.",
        answerStatus: "not_found",
        keyPoints: [],
        sources: [],
        nextStep: "Try phrasing your question using specific terms that appear in this contract.",
        diagnostics: {
          qaRequestId,
          documentId: document.id,
          questionLength: cleanQuestion.length,
          candidateCount: document.chunks.length,
          topK: 6,
          retrievalMethod: "lexical",
          retrievalMs,
          contextChars: 0,
          estimatedInputTokens: 0,
          nvidiaTtftMs: 0,
          generationMs: 0,
          jsonParseMs: 0,
          zodMs: 0,
          sourceValidationMs: 0,
          totalMs,
          answerStatus: "not_found",
          verifiedSourceCount: 0,
        },
      };
    }

    // 5. Build Grounded Context & User Prompt
    const userPrompt = buildQaUserPrompt(
      cleanQuestion,
      retrievalResult.retrievedChunks,
      document.displayName
    );
    const contextChars = userPrompt.length;
    const estimatedInputTokens = Math.ceil(contextChars / 4);

    console.log(`[QA-DIAG]${reqTag} contextChars=${contextChars}`);
    console.log(`[QA-DIAG]${reqTag} NVIDIA request started`);
    console.log(`[QA-DIAG]${reqTag} model=nvidia/nemotron-3-super-120b-a12b`);

    // 6. Invoke NVIDIA Nemotron 3 Super 120B
    const messages = [
      { role: "system" as const, content: QA_SYSTEM_PROMPT },
      { role: "user" as const, content: userPrompt },
    ];

    const client = this.getAiClient();
    const aiResult = await client.generateChatCompletionDetailed(messages, {
      maxTokens: 1000,
      temperature: 0.1,
      reasoningEffort: "none",
      stream: true,
      requestId: qaRequestId,
    });

    const generationMs = Math.max(0, aiResult.totalDurationMs - aiResult.ttftMs);
    console.log(`[QA-DIAG]${reqTag} NVIDIA status=200`);
    console.log(`[QA-DIAG]${reqTag} TTFT=${aiResult.ttftMs}ms`);
    console.log(`[QA-DIAG]${reqTag} generation=${generationMs}ms`);
    console.log(`[QA-DIAG]${reqTag} outputChars=${aiResult.content.length}`);

    // 7. JSON Parse
    const jsonStart = Date.now();
    let rawJson: unknown;
    try {
      const cleaned = extractCleanJson(aiResult.content);
      rawJson = JSON.parse(cleaned);
    } catch (parseError) {
      console.error(`[QA]${reqTag} Failed to parse JSON response:`, aiResult.content.slice(0, 200));
      throw new AiEngineError(
        "AI_INVALID_RESPONSE",
        "AI engine returned non-JSON structured output for Q&A.",
        502
      );
    }
    const jsonParseMs = Date.now() - jsonStart;
    console.log(`[QA-DIAG]${reqTag} JSON parse=success (${jsonParseMs}ms)`);

    // 8. Zod Validation
    const zodStart = Date.now();
    let validated: RawQaResponse;
    try {
      validated = RawQaResponseSchema.parse(rawJson);
    } catch (zodError) {
      console.error(`[QA]${reqTag} Zod schema validation failed:`, zodError);
      throw new AiEngineError(
        "AI_SCHEMA_ERROR",
        "AI engine output did not conform to the grounded Q&A schema.",
        502
      );
    }
    const zodMs = Date.now() - zodStart;
    console.log(`[QA-DIAG]${reqTag} Zod=success (${zodMs}ms)`);

    // 9. Source Verification
    const srcStart = Date.now();
    const verifiedSources: VerifiedQaSource[] = [];

    for (const src of validated.sources) {
      const verified = verifyQaSource(src, chunkMap);
      if (verified.isVerified) {
        verifiedSources.push(verified);
      }
    }

    const verifiedKeyPoints = validated.keyPoints.map((kp) => {
      if (!kp.source) return { text: kp.text };
      const verified = verifyQaSource(kp.source, chunkMap);
      return {
        text: kp.text,
        source: verified.isVerified ? verified : undefined,
      };
    });
    const sourceValidationMs = Date.now() - srcStart;
    console.log(
      `[QA-DIAG]${reqTag} sourceValidation=completed (${verifiedSources.length}/${validated.sources.length} verified in ${sourceValidationMs}ms)`
    );

    // 10. Status Normalization
    let finalStatus: "grounded" | "not_found" | "partially_supported" = validated.answerStatus;
    if (validated.answer.toLowerCase().includes("not found in the uploaded document")) {
      finalStatus = "not_found";
    } else if (finalStatus === "grounded" && verifiedSources.length === 0) {
      // If claimed grounded but no verbatim sources passed validation
      finalStatus = "partially_supported";
    }

    const totalMs = Date.now() - totalStart;
    console.log(`[QA-DIAG]${reqTag} answerStatus=${finalStatus}`);
    console.log(`[QA-DIAG]${reqTag} verifiedSourceCount=${verifiedSources.length}`);
    console.log(`[QA-DIAG]${reqTag} total=${totalMs}ms`);
    console.log(`[QA-DIAG]${reqTag} request completed`);

    return {
      documentId: document.id,
      documentName: document.displayName,
      question: cleanQuestion,
      answer: validated.answer,
      answerStatus: finalStatus,
      keyPoints: verifiedKeyPoints,
      sources: verifiedSources,
      nextStep: validated.nextStep,
      diagnostics: {
        qaRequestId,
        documentId: document.id,
        questionLength: cleanQuestion.length,
        candidateCount: document.chunks.length,
        topK: 6,
        retrievalMethod: "lexical",
        retrievalMs,
        contextChars,
        estimatedInputTokens,
        nvidiaTtftMs: aiResult.ttftMs,
        generationMs,
        jsonParseMs,
        zodMs,
        sourceValidationMs,
        totalMs,
        answerStatus: finalStatus,
        verifiedSourceCount: verifiedSources.length,
      },
    };
  }
}

export const defaultQaService = new QaService();
