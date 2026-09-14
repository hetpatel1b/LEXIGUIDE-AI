import type { NormalizedDocument } from "@/lib/document-engine/types";
import { NemotronClient } from "../client/nemotron-client";
import type { AiProvider } from "../client/types";
import { buildAnalysisContext } from "../context/context-builder";
import { SYSTEM_PROMPT_V1 } from "../prompts/analysis-system";
import { buildDocumentAnalysisPrompt } from "../prompts/document-analysis";
import { RawAiAnalysisResponseSchema } from "../schemas/analysis-schema";
import { validateAnalysisSources } from "./source-validator";
import { AiEngineError } from "../errors";
import { AI_CONFIG } from "../config";
import type { AnalysisResult } from "../types";

/**
 * Strips markdown code blocks (e.g. ```json ... ```) from model response text.
 */
function extractJsonString(rawText: string): string {
  const trimmed = rawText.trim();
  const jsonBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/i;
  const match = trimmed.match(jsonBlockRegex);
  if (match && match[1]) {
    return match[1].trim();
  }
  return trimmed;
}

/**
 * End-to-end orchestrator for real document AI analysis.
 * Coordinates context building, Nemotron invocation, JSON parsing, Zod validation,
 * and authoritative source citation verification.
 */
export async function analyzeDocument(
  document: NormalizedDocument,
  provider?: AiProvider
): Promise<AnalysisResult> {
  const t0 = Date.now();
  console.log(`[AI-DIAG] request received docId=${document?.id}`);

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

  console.log(`[AI-DIAG] document validated: sections=${document.sections?.length}, chunks=${document.chunks?.length}`);

  // 1. Build bounded model context from Phase 2 NormalizedDocument
  const context = buildAnalysisContext(document);
  console.log(`[AI-DIAG] context built: chars=${context.contextText.length}, includedChunks=${context.includedChunks}/${context.totalChunks}`);

  // 2. Prepare system and user prompt messages
  const userPrompt = buildDocumentAnalysisPrompt(context);
  console.log(`[AI-DIAG] prompt built: chars=${userPrompt.length}`);

  const messages = [
    { role: "system" as const, content: SYSTEM_PROMPT_V1 },
    { role: "user" as const, content: userPrompt },
  ];

  // 3. Invoke Nemotron provider (or custom/mock provider in tests)
  const client = provider || new NemotronClient();
  const rawResponse = await client.generateChatCompletion(messages);
  console.log(`[AI-DIAG] raw AI response received: chars=${rawResponse.length}`);

  // 4. Extract and parse JSON
  const jsonStr = extractJsonString(rawResponse);
  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(jsonStr);
  } catch (parseErr) {
    console.error(`[AI-DIAG] JSON parse failure: ${String(parseErr)}`);
    throw new AiEngineError(
      "AI_INVALID_RESPONSE",
      "AI provider response could not be parsed as valid JSON.",
      422,
      { rawResponse: rawResponse.slice(0, 300), error: String(parseErr) }
    );
  }

  console.log(`[AI-DIAG] JSON parsed successfully`);

  // 5. Zod Schema Validation
  const validationResult = RawAiAnalysisResponseSchema.safeParse(parsedJson);
  if (!validationResult.success) {
    console.error(`[AI-DIAG] Zod validation failure: ${JSON.stringify(validationResult.error.format())}`);
    throw new AiEngineError(
      "AI_SCHEMA_ERROR",
      "AI response failed structured schema validation.",
      422,
      { errors: validationResult.error.format() }
    );
  }

  console.log(`[AI-DIAG] Zod validation complete`);

  // 6. Source & Evidence Verification against Phase 2 chunks/sections
  const modelName = process.env.NVIDIA_MODEL_ID || AI_CONFIG.defaultModel;
  const verifiedResult = validateAnalysisSources(
    validationResult.data,
    document,
    modelName
  );

  const totalDuration = Date.now() - t0;
  console.log(
    `[AI-DIAG] source validation complete: verifiedClauses=${verifiedResult.keyClauses.length}, verifiedConcerns=${verifiedResult.potentialConcerns.length}, totalDuration=${totalDuration}ms`
  );

  return verifiedResult;
}
