import test from "node:test";
import assert from "node:assert";
import { validateAnalysisSources } from "@/lib/ai/analysis/source-validator";
import { RawAiAnalysisResponseSchema } from "@/lib/ai/schemas/analysis-schema";
import employmentDocRaw from "./fixtures/ai/employment-agreement.json";
import {
  MOCK_VALID_EMPLOYMENT_RESPONSE,
  MOCK_FABRICATED_QUOTE_RESPONSE,
} from "./fixtures/ai/mock-nemotron-responses";
import type { NormalizedDocument } from "@/lib/document-engine/types";

const employmentDoc = employmentDocRaw as unknown as NormalizedDocument;

test("Source Validator - marks verified: true for authentic chunks and quotes", () => {
  const parsed = RawAiAnalysisResponseSchema.parse(JSON.parse(MOCK_VALID_EMPLOYMENT_RESPONSE));
  const result = validateAnalysisSources(parsed, employmentDoc, "test-model");

  assert.strictEqual(result.keyClauses.length, 2);
  assert.strictEqual(result.keyClauses[0].verified, true);
  assert.strictEqual(result.keyClauses[1].verified, true);
  assert.strictEqual(result.potentialConcerns[0].verified, true);
  assert.strictEqual(result.obligations[0].verified, true);
  assert.strictEqual(result.importantDates[0].verified, true);
});

test("Source Validator - handles whitespace and newline variation gracefully", () => {
  const customData = {
    ...JSON.parse(MOCK_VALID_EMPLOYMENT_RESPONSE),
    keyClauses: [
      {
        id: "c_ws",
        title: "Whitespace Variant",
        category: "Compensation",
        summary: "Summary test",
        importance: "standard",
        source: {
          chunkId: "chk_doc_test_employment_001_001",
          sectionId: "sec_02",
          // Contains extra newlines and multiple spaces that still match normalized source text
          quote: "Base   salary   shall be INR 45,00,000 \n\n per annum",
        },
      },
    ],
  };

  const parsed = RawAiAnalysisResponseSchema.parse(customData);
  const result = validateAnalysisSources(parsed, employmentDoc, "test-model");

  assert.strictEqual(result.keyClauses[0].verified, true);
});

test("Source Validator - detects fabricated chunk IDs and flags verified: false", () => {
  const parsed = RawAiAnalysisResponseSchema.parse(JSON.parse(MOCK_FABRICATED_QUOTE_RESPONSE));
  const result = validateAnalysisSources(parsed, employmentDoc, "test-model");

  // First clause references chk_nonexistent_999
  assert.strictEqual(result.keyClauses[0].verified, false);
});

test("Source Validator - detects fabricated quotes in real chunks and flags verified: false", () => {
  const parsed = RawAiAnalysisResponseSchema.parse(JSON.parse(MOCK_FABRICATED_QUOTE_RESPONSE));
  const result = validateAnalysisSources(parsed, employmentDoc, "test-model");

  // Second clause references real chunk chk_doc_test_employment_001_000, but quote "100 million dollars" is fake
  assert.strictEqual(result.keyClauses[1].verified, false);
});
