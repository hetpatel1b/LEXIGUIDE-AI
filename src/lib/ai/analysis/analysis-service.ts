import type { NormalizedDocument } from "@/lib/document-engine/types";
import { NemotronClient } from "../client/nemotron-client";
import type { AiProvider, ChatCompletionResult } from "../client/types";
import { buildAnalysisContext } from "../context/context-builder";
import { SYSTEM_PROMPT_V1, SYSTEM_PROMPT_RETRY_V1 } from "../prompts/analysis-system";
import { buildDocumentAnalysisPrompt, buildDocumentAnalysisRetryPrompt } from "../prompts/document-analysis";
import { RawAiAnalysisResponseSchema } from "../schemas/analysis-schema";
import { validateAnalysisSources } from "./source-validator";
import { AiEngineError } from "../errors";
import { AI_CONFIG } from "../config";
import type { AnalysisResult } from "../types";

/**
 * Strips markdown code blocks and applies safe syntax normalization
 * without fabricating legal content or values.
 */
function safeCleanJsonString(rawText: string): string {
  let cleaned = rawText.trim();
  const jsonBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/i;
  const match = cleaned.match(jsonBlockRegex);
  if (match && match[1]) {
    cleaned = match[1].trim();
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  }

  // Safe normalization: close missing double quote on chunkId (e.g. "chunkId": "chk_doc_123, -> "chunkId": "chk_doc_123",)
  cleaned = cleaned.replace(/"chunkId":\s*"([^"\r\n,]+),/g, '"chunkId": "$1",');

  return cleaned;
}

/**
 * Inspects response completeness and structural integrity before parsing.
 */
function isTruncatedOrIncomplete(cleanedJson: string, finishReason: string | null): boolean {
  if (finishReason === "length") {
    return true;
  }

  const trimmed = cleanedJson.trim();
  if (!trimmed.endsWith("}")) {
    return true;
  }

  let inString = false;
  let escaped = false;
  let braceDepth = 0;
  let bracketDepth = 0;

  for (let i = 0; i < trimmed.length; i++) {
    const ch = trimmed[i];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === "\\") {
        escaped = true;
      } else if (ch === '"') {
        inString = false;
      }
    } else {
      if (ch === '"') {
        inString = true;
      } else if (ch === "{") {
        braceDepth++;
      } else if (ch === "}") {
        braceDepth--;
      } else if (ch === "[") {
        bracketDepth++;
      } else if (ch === "]") {
        bracketDepth--;
      }
    }
  }

  return inString || braceDepth !== 0 || bracketDepth !== 0;
}

/**
 * End-to-end orchestrator for real document AI analysis.
 * Coordinates context building, Nemotron invocation, truncation detection,
 * safe single retry, Zod validation, and authoritative source verification.
 */
export async function analyzeDocument(
  document: NormalizedDocument,
  provider?: AiProvider,
  requestId?: string
): Promise<AnalysisResult> {
  const reqId = requestId || `ana_${Math.random().toString(36).substring(2, 9)}_${Date.now().toString(36)}`;
  const reqTag = `[${reqId}]`;
  const t0 = Date.now();
  console.log(`[AI-DIAG]${reqTag} analyzeDocument started docId=${document?.id}`);

  if (!document || !document.id) {
    throw new AiEngineError(
      "AI_INVALID_RESPONSE",
      "Invalid document provided for analysis.",
      400
    );
  }

  if (!document.chunks || document.chunks.length === 0) {
    throw new AiEngineError(
      "AI_INVALID_RESPONSE",
      "Document contains no text chunks to analyze.",
      422
    );
  }

  console.log(
    `[AI-DIAG]${reqTag} document validated: sections=${document.sections?.length}, chunks=${document.chunks?.length}`
  );

  const client = provider || new NemotronClient();

  // Helper to execute a single generation pass
  const executePass = async (isRetry: boolean): Promise<{ rawResult: ChatCompletionResult; parsed: unknown }> => {
    const passBudget = isRetry ? 12000 : AI_CONFIG.maxContextChars;
    const context = buildAnalysisContext(document, passBudget);
    console.log(
      `[AI-DIAG]${reqTag} ${isRetry ? "RETRY " : ""}context built: chars=${context.contextText.length}, includedChunks=${context.includedChunks}/${context.totalChunks}`
    );

    const userPrompt = isRetry
      ? buildDocumentAnalysisRetryPrompt(context)
      : buildDocumentAnalysisPrompt(context);
    const systemPrompt = isRetry ? SYSTEM_PROMPT_RETRY_V1 : SYSTEM_PROMPT_V1;

    console.log(`[AI-DIAG]${reqTag} ${isRetry ? "RETRY " : ""}prompt built: chars=${userPrompt.length}`);

    const messages = [
      { role: "system" as const, content: systemPrompt },
      { role: "user" as const, content: userPrompt },
    ];

    let genResult: ChatCompletionResult;
    if (client.generateChatCompletionDetailed) {
      genResult = await client.generateChatCompletionDetailed(messages, {
        maxTokens: isRetry ? 4000 : AI_CONFIG.maxTokens,
        requestId: reqId,
      });
    } else {
      const content = await client.generateChatCompletion(messages, {
        maxTokens: isRetry ? 4000 : AI_CONFIG.maxTokens,
        requestId: reqId,
      });
      genResult = {
        content,
        finishReason: null,
        ttftMs: Date.now() - t0,
        totalDurationMs: Date.now() - t0,
        model: process.env.NVIDIA_MODEL_ID || AI_CONFIG.defaultModel,
      };
    }

    console.log(
      `[AI-DIAG]${reqTag} ${isRetry ? "RETRY " : ""}AI response received: chars=${genResult.content.length}, finish_reason=${genResult.finishReason}, TTFT=${genResult.ttftMs}ms, duration=${genResult.totalDurationMs}ms`
    );

    const cleaned = safeCleanJsonString(genResult.content);

    if (isTruncatedOrIncomplete(cleaned, genResult.finishReason)) {
      console.warn(
        `[AI-DIAG]${reqTag} ${isRetry ? "RETRY " : ""}detected truncated or malformed output (finish_reason=${genResult.finishReason}, chars=${genResult.content.length})`
      );
      throw new AiEngineError(
        "AI_INVALID_RESPONSE",
        "AI provider response was truncated or malformed.",
        422,
        {
          diagnostic: "TRUNCATED_OR_MALFORMED_JSON",
          finish_reason: genResult.finishReason,
          output_chars: genResult.content.length,
          ttft: genResult.ttftMs,
          total_time: genResult.totalDurationMs,
        }
      );
    }

    try {
      const parsed = JSON.parse(cleaned);
      return { rawResult: genResult, parsed };
    } catch (parseErr) {
      console.error(`[AI-DIAG]${reqTag} ${isRetry ? "RETRY " : ""}JSON.parse failure: ${String(parseErr)}`);
      throw new AiEngineError(
        "AI_INVALID_RESPONSE",
        "AI provider response could not be parsed as valid JSON.",
        422,
        {
          diagnostic: "TRUNCATED_OR_MALFORMED_JSON",
          finish_reason: genResult.finishReason,
          output_chars: genResult.content.length,
          error: String(parseErr),
        }
      );
    }
  };

  // Attempt Pass 1
  let parsedJson: unknown;
  try {
    const pass1 = await executePass(false);
    parsedJson = pass1.parsed;
    console.log(`[AI-DIAG]${reqTag} Pass 1 JSON parsed successfully`);
  } catch (pass1Error) {
    // Step 14: Safe single retry ONLY for invalid/truncated JSON (not auth/rate-limit/timeout)
    if (
      pass1Error instanceof AiEngineError &&
      pass1Error.code === "AI_INVALID_RESPONSE" &&
      pass1Error.details?.diagnostic === "TRUNCATED_OR_MALFORMED_JSON"
    ) {
      console.warn(
        `[AI-DIAG]${reqTag} Triggering single recovery retry with reduced context and tighter item limits...`
      );
      const pass2 = await executePass(true);
      parsedJson = pass2.parsed;
      console.log(`[AI-DIAG]${reqTag} Pass 2 recovery retry parsed successfully!`);
    } else {
      throw pass1Error;
    }
  }

  // Zod Schema Validation
  const validationResult = RawAiAnalysisResponseSchema.safeParse(parsedJson);
  if (!validationResult.success) {
    console.error(
      `[AI-DIAG]${reqTag} Zod validation failure: ${JSON.stringify(validationResult.error.format())}`
    );
    throw new AiEngineError(
      "AI_SCHEMA_ERROR",
      "AI response failed structured schema validation.",
      422,
      { errors: validationResult.error.format() }
    );
  }

  console.log(`[AI-DIAG]${reqTag} Zod validation complete`);

  // Source & Evidence Verification against Phase 2 chunks/sections
  const modelName = process.env.NVIDIA_MODEL_ID || AI_CONFIG.defaultModel;
  const verifiedResult = validateAnalysisSources(
    validationResult.data,
    document,
    modelName
  );

  const totalDuration = Date.now() - t0;
  console.log(
    `[AI-DIAG]${reqTag} source validation complete: verifiedClauses=${verifiedResult.keyClauses.length}, verifiedConcerns=${verifiedResult.potentialConcerns.length}, totalDuration=${totalDuration}ms`
  );

  return verifiedResult;
}
