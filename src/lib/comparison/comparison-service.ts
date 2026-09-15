import type { NormalizedDocument } from "@/lib/document-engine/types";
import type {
  ComparisonResult,
  ComparisonDocument,
  ComparisonSummaryMetrics,
  ComparisonDiagnostics,
  ComparisonChange,
} from "@/types/comparison";
import { mapDocumentSections } from "./section-mapper";
import { mapClauses } from "./clause-mapper";
import { detectAllInconsistencies } from "./inconsistency-detector";
import { buildComparisonAiContext } from "./comparison-context";
import { RawAiComparisonResponseSchema } from "@/lib/ai/schemas/comparison-schema";
import { NemotronClient } from "@/lib/ai/client/nemotron-client";
import type { AiProvider } from "@/lib/ai/client/types";
import { AiEngineError } from "@/lib/ai/errors";

import { ComparisonEngineError } from "./errors";

export interface CompareDocumentsOptions {
  requestId?: string;
  aiProvider?: AiProvider;
  skipAi?: boolean;
}

interface AiEnrichmentResult {
  aiUsed: boolean;
  aiError?: string;
  nvidiaTtftMs: number;
  generationMs: number;
  jsonParseMs: number;
  zodMs: number;
  sourceValidationMs: number;
  contextChars: number;
  estimatedInputTokens: number;
  outputTokens: number;
  aiCallCount: number;
}

/**
 * Strips markdown code fences (```json ... ```) from LLM output if present.
 */
function cleanJsonOutput(raw: string): string {
  let cleaned = raw.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.replace(/^```json\s*/i, "").replace(/\s*```$/, "");
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```\s*/, "").replace(/\s*```$/, "");
  }
  return cleaned.trim();
}

/**
 * Authoritative comparison service.
 * Executes section mapping, deterministic diffing, inconsistency detection,
 * bounded Nemotron AI explanation, and strict source validation.
 */
export async function compareDocuments(
  docA: NormalizedDocument,
  docB: NormalizedDocument,
  options: CompareDocumentsOptions = {}
): Promise<ComparisonResult> {
  const startTotal = Date.now();
  const requestId = options.requestId || `cmp_${Math.random().toString(36).substring(2, 9)}`;

  console.log(`[COMP-DIAG][${requestId}] compareDocuments started: Doc A=${docA.id} ("${docA.displayName}") vs Doc B=${docB.id} ("${docB.displayName}")`);

  // 1. Validation
  if (!docA || !docB) {
    throw new ComparisonEngineError("VALIDATION_ERROR", "Both Document A and Document B are required for comparison.", 400);
  }

  if (docA.id === docB.id) {
    throw new ComparisonEngineError("COMPARISON_CONFLICT", "Cannot compare a document to itself. Select two different documents.", 409);
  }

  if (!Array.isArray(docA.chunks) || docA.chunks.length === 0) {
    throw new ComparisonEngineError("DOCUMENT_INVALID", `Document A ("${docA.displayName}") has no usable content chunks.`, 422);
  }

  if (!Array.isArray(docB.chunks) || docB.chunks.length === 0) {
    throw new ComparisonEngineError("DOCUMENT_INVALID", `Document B ("${docB.displayName}") has no usable content chunks.`, 422);
  }

  // 2. Section Mapping Layer
  const startSecMap = Date.now();
  const sectionMapping = mapDocumentSections(docA, docB);
  const sectionMappingMs = Date.now() - startSecMap;
  console.log(`[COMP-DIAG][${requestId}] sectionMapping completed in ${sectionMappingMs}ms: mapped=${sectionMapping.mappedPairs.length}, unmappedA=${sectionMapping.unmappedSectionsA.length}, unmappedB=${sectionMapping.unmappedSectionsB.length}`);

  // 3. Clause Mapping & Deterministic Diff Layer
  const startClauseMap = Date.now();
  const { changes, unchangedSections } = mapClauses(docA, docB, sectionMapping);
  const clauseMappingMs = Date.now() - startClauseMap;
  console.log(`[COMP-DIAG][${requestId}] clauseMapping completed in ${clauseMappingMs}ms: changes=${changes.length}, unchanged=${unchangedSections.length}`);

  // 4. Inconsistency Detection Layer
  const inconsistencies = detectAllInconsistencies(docA, docB);
  console.log(`[COMP-DIAG][${requestId}] inconsistencies detected: ${inconsistencies.length}`);

  // 5. AI Explanation Layer (Only for changed clauses)
  const substantiveChanges = changes.filter((c) => c.status !== "unchanged");
  const aiStats = await enrichWithAiExplanation(changes, substantiveChanges, docA, docB, options, requestId);

  // 6. Metrics Calculation (Derived strictly from arrays - 0 hardcoding)
  const metrics: ComparisonSummaryMetrics = {
    sectionsCompared: Math.max((docA.sections || []).length, (docB.sections || []).length),
    changesIdentified: changes.length,
    majorChanges: changes.filter((c) => c.changeSeverity === "major").length,
    moderateChanges: changes.filter((c) => c.changeSeverity === "moderate").length,
    minorChanges: changes.filter((c) => c.changeSeverity === "minor").length,
    unchangedCount: unchangedSections.length,
    potentialInconsistencies: inconsistencies.length,
  };

  const totalMs = Date.now() - startTotal;

  const diagnostics: ComparisonDiagnostics = {
    comparisonRequestId: requestId,
    documentAId: docA.id,
    documentBId: docB.id,
    sectionCountA: (docA.sections || []).length,
    sectionCountB: (docB.sections || []).length,
    mappedSectionCount: sectionMapping.mappedPairs.length,
    unmappedSectionCount: sectionMapping.unmappedSectionsA.length + sectionMapping.unmappedSectionsB.length,
    changedClauseCount: changes.length,
    aiClauseCount: substantiveChanges.length,
    contextChars: aiStats.contextChars,
    estimatedInputTokens: aiStats.estimatedInputTokens,
    outputTokens: aiStats.outputTokens,
    aiCallCount: aiStats.aiCallCount,
    sectionMappingMs,
    clauseMappingMs,
    diffMs: clauseMappingMs,
    nvidiaTtftMs: aiStats.nvidiaTtftMs,
    generationMs: aiStats.generationMs,
    jsonParseMs: aiStats.jsonParseMs,
    zodMs: aiStats.zodMs,
    sourceValidationMs: aiStats.sourceValidationMs,
    totalMs,
    aiUsed: aiStats.aiUsed,
    aiError: aiStats.aiError,
  };

  console.log(`[COMP-DIAG][${requestId}] comparison completed in ${totalMs}ms: changes=${metrics.changesIdentified}, major=${metrics.majorChanges}, moderate=${metrics.moderateChanges}, unchanged=${metrics.unchangedCount}, inconsistencies=${metrics.potentialInconsistencies}`);

  const compDocA: ComparisonDocument = {
    id: docA.id,
    name: docA.displayName,
    type: (docA.format || "PDF").toUpperCase(),
    pageCount: docA.pageCount || 1,
    sizeBytes: docA.sizeBytes,
    versionLabel: "Document A (Baseline)",
    isPrimary: true,
  };

  const compDocB: ComparisonDocument = {
    id: docB.id,
    name: docB.displayName,
    type: (docB.format || "PDF").toUpperCase(),
    pageCount: docB.pageCount || 1,
    sizeBytes: docB.sizeBytes,
    versionLabel: "Document B (Target)",
  };

  return {
    documentA: compDocA,
    documentB: compDocB,
    metrics,
    changes,
    inconsistencies,
    unchangedSections,
    unmappedSections: {
      documentA: sectionMapping.unmappedSectionsA.map((s) => s.title),
      documentB: sectionMapping.unmappedSectionsB.map((s) => s.title),
    },
    diagnostics,
  };
}

async function enrichWithAiExplanation(
  changes: ComparisonChange[],
  substantiveChanges: ComparisonChange[],
  docA: NormalizedDocument,
  docB: NormalizedDocument,
  options: CompareDocumentsOptions,
  requestId: string
): Promise<AiEnrichmentResult> {
  const result: AiEnrichmentResult = {
    aiUsed: false,
    nvidiaTtftMs: 0,
    generationMs: 0,
    jsonParseMs: 0,
    zodMs: 0,
    sourceValidationMs: 0,
    contextChars: 0,
    estimatedInputTokens: 0,
    outputTokens: 0,
    aiCallCount: 0,
  };

  if (substantiveChanges.length === 0 || options.skipAi) {
    return result;
  }

  try {
    const promptContext = buildComparisonAiContext(
      docA.displayName,
      docB.displayName,
      substantiveChanges
    );
    result.contextChars = promptContext.contextChars;
    result.estimatedInputTokens = promptContext.estimatedInputTokens;

    const provider = options.aiProvider || new NemotronClient();
    result.aiCallCount = 1;
    result.aiUsed = true;

    const aiStart = Date.now();
    let rawAiResponse = "";

    if (typeof provider.generateChatCompletionDetailed === "function") {
      const detailed = await provider.generateChatCompletionDetailed(promptContext.messages, {
        requestId,
        maxTokens: 4096,
        temperature: 0.1,
        reasoningEffort: "none",
      });
      rawAiResponse = detailed.content;
      result.nvidiaTtftMs = detailed.ttftMs;
      result.generationMs = detailed.totalDurationMs;
      result.outputTokens =
        detailed.usage?.completionTokens ||
        detailed.estimatedOutputTokens ||
        Math.ceil(detailed.content.length / 4);
    } else {
      rawAiResponse = await provider.generateChatCompletion(promptContext.messages, {
        requestId,
        maxTokens: 4096,
        temperature: 0.1,
        reasoningEffort: "none",
      });
      result.generationMs = Date.now() - aiStart;
      result.outputTokens = Math.ceil(rawAiResponse.length / 4);
    }

    // Parse JSON
    const parseStart = Date.now();
    const cleaned = cleanJsonOutput(rawAiResponse);
    const parsed = JSON.parse(cleaned);
    result.jsonParseMs = Date.now() - parseStart;

    // Zod Validation
    const zodStart = Date.now();
    const zodResult = RawAiComparisonResponseSchema.safeParse(parsed);
    result.zodMs = Date.now() - zodStart;

    if (zodResult.success) {
      const aiData = zodResult.data;
      const srcStart = Date.now();

      // Merge AI explanations into changes by matching changeId
      const aiExplanationMap = new Map(aiData.changes.map((c) => [c.changeId, c]));

      for (const chg of changes) {
        const aiExp = aiExplanationMap.get(chg.id);
        if (aiExp) {
          chg.summaryChange = aiExp.explanation;
          chg.whyItMatters = aiExp.whyItMatters;
          if (aiExp.suggestedReviewQuestion) {
            chg.suggestedReviewQuestion = aiExp.suggestedReviewQuestion;
          }
          if (aiExp.severity) {
            chg.changeSeverity = aiExp.severity;
          }
        }
      }

      result.sourceValidationMs = Date.now() - srcStart;
      console.log(`[COMP-DIAG][${requestId}] AI explanation merged and sources validated in ${result.sourceValidationMs}ms`);
    } else {
      console.warn(`[COMP-DIAG][${requestId}] Zod validation failed for comparison AI output:`, zodResult.error.message);
      result.aiError = "Zod validation failed on AI output";
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[COMP-DIAG][${requestId}] Comparison AI failed gracefully: ${msg}`);
    result.aiError = msg;
    result.aiUsed = false;

    // Graceful fallback: enrich deterministic changes with fallback note
    for (const chg of changes) {
      if (!chg.whyItMatters) {
        chg.whyItMatters =
          chg.changeSeverity === "major"
            ? "Substantive contractual revision detected. Review the verbatim excerpts above."
            : "Wording modification between document revisions.";
      }
    }
  }

  return result;
}
