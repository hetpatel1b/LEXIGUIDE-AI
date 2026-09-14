import type { NormalizedDocument } from "@/lib/document-engine/types";
import { NemotronClient } from "../client/nemotron-client";
import type { AiProvider, ChatCompletionResult } from "../client/types";
import { buildAnalysisContext } from "../context/context-builder";
import { buildDocumentAnalysisIndex } from "../context/document-index";
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

  const tDoc0 = Date.now();
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

  const docIndex = buildDocumentAnalysisIndex(document);
  const documentValidationMs = Date.now() - tDoc0;

  console.log(
    `[AI-DIAG]${reqTag} document validated and indexed in ${documentValidationMs}ms: sections=${document.sections?.length}, chunks=${document.chunks?.length}`
  );

  const client = provider || new NemotronClient();

  let lastContextSelectionMs = 0;
  let lastPromptConstructionMs = 0;
  let lastJsonParseMs = 0;
  let lastTtftMs = 0;
  let lastGenMs = 0;

  // Helper to execute a single generation pass
  const executePass = async (isRetry: boolean): Promise<{ rawResult: ChatCompletionResult; parsed: unknown }> => {
    const passBudget = isRetry ? 12000 : AI_CONFIG.maxContextChars;
    const tCtx0 = Date.now();
    const context = buildAnalysisContext(document, passBudget, docIndex);
    lastContextSelectionMs = Date.now() - tCtx0;

    console.log(
      `[AI-DIAG]${reqTag} ${isRetry ? "RETRY " : ""}context built: chars=${context.contextText.length}, includedChunks=${context.includedChunks}/${context.totalChunks}`
    );

    const tPr0 = Date.now();
    const userPrompt = isRetry
      ? buildDocumentAnalysisRetryPrompt(context)
      : buildDocumentAnalysisPrompt(context);
    const systemPrompt = isRetry ? SYSTEM_PROMPT_RETRY_V1 : SYSTEM_PROMPT_V1;
    lastPromptConstructionMs = Date.now() - tPr0;

    console.log(`[AI-DIAG]${reqTag} ${isRetry ? "RETRY " : ""}prompt built: chars=${userPrompt.length}`);

    const messages = [
      { role: "system" as const, content: systemPrompt },
      { role: "user" as const, content: userPrompt },
    ];

    let genResult: ChatCompletionResult;
    if (client.generateChatCompletionDetailed) {
      genResult = await client.generateChatCompletionDetailed(messages, {
        maxTokens: isRetry ? 1800 : AI_CONFIG.maxTokens,
        requestId: reqId,
      });
    } else {
      const content = await client.generateChatCompletion(messages, {
        maxTokens: isRetry ? 1800 : AI_CONFIG.maxTokens,
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

    lastTtftMs = genResult.ttftMs;
    lastGenMs = Math.max(0, genResult.totalDurationMs - genResult.ttftMs);

    console.log(
      `[AI-DIAG]${reqTag} ${isRetry ? "RETRY " : ""}AI response received: chars=${genResult.content.length}, finish_reason=${genResult.finishReason}, TTFT=${genResult.ttftMs}ms, duration=${genResult.totalDurationMs}ms`
    );

    const tJ0 = Date.now();
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
      lastJsonParseMs = Date.now() - tJ0;
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
  let lastRawResult: ChatCompletionResult | undefined;
  try {
    const pass1 = await executePass(false);
    parsedJson = pass1.parsed;
    lastRawResult = pass1.rawResult;
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
      lastRawResult = pass2.rawResult;
      console.log(`[AI-DIAG]${reqTag} Pass 2 recovery retry parsed successfully!`);
    } else {
      throw pass1Error;
    }
  }

  // Zod Schema Validation
  const tZod0 = Date.now();
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
  const zodValidationMs = Date.now() - tZod0;
  console.log(`[AI-DIAG]${reqTag} Zod validation complete in ${zodValidationMs}ms`);

  // Source & Evidence Verification against Phase 2 chunks/sections
  const tSrc0 = Date.now();
  const modelName = process.env.AI_MODEL || process.env.NVIDIA_MODEL_ID || AI_CONFIG.defaultModel;
  const verifiedResult = validateAnalysisSources(
    validationResult.data,
    document,
    modelName,
    docIndex
  );
  const sourceValidationMs = Date.now() - tSrc0;

  const totalApiMs = Date.now() - t0;
  const usageTokens = lastRawResult?.usage
    ? ` input_tokens=${lastRawResult.usage.promptTokens ?? "N/A"} output_tokens=${lastRawResult.usage.completionTokens ?? "N/A"} total_tokens=${lastRawResult.usage.totalTokens ?? "N/A"}`
    : "";

  console.log(
    `[PERF] request_id=${reqId} provider=nvidia model=${modelName} doc_val_ms=${documentValidationMs} ctx_sel_ms=${lastContextSelectionMs} prompt_ms=${lastPromptConstructionMs} ttft_ms=${lastTtftMs} gen_ms=${lastGenMs} provider_total_ms=${lastRawResult?.totalDurationMs ?? 0} json_parse_ms=${lastJsonParseMs} zod_val_ms=${zodValidationMs} src_val_ms=${sourceValidationMs} total_api_ms=${totalApiMs} finish_reason=${lastRawResult?.finishReason ?? "stop"} output_chars=${lastRawResult?.content.length ?? 0} estimated_output_tokens=${lastRawResult?.estimatedOutputTokens ?? Math.ceil((lastRawResult?.content.length ?? 0) / 4)}${usageTokens}`
  );
  console.log(
    `[AI-DIAG]${reqTag} source validation complete: verifiedClauses=${verifiedResult.keyClauses.length}, verifiedConcerns=${verifiedResult.potentialConcerns.length}, totalDuration=${totalApiMs}ms`
  );

  return verifiedResult;
}
