import test from "node:test";
import assert from "node:assert";
import { RawAiAnalysisResponseSchema } from "@/lib/ai/schemas/analysis-schema";
import {
  MOCK_VALID_EMPLOYMENT_RESPONSE,
  MOCK_VALID_NDA_RESPONSE,
  MOCK_INVALID_SCHEMA_RESPONSE,
} from "./fixtures/ai/mock-nemotron-responses";

test("AI Schema - validates compliant employment analysis response", () => {
  const parsed = JSON.parse(MOCK_VALID_EMPLOYMENT_RESPONSE);
  const result = RawAiAnalysisResponseSchema.safeParse(parsed);

  assert.strictEqual(result.success, true);
  if (result.success) {
    assert.strictEqual(result.data.analysisSchemaVersion, "1.0");
    assert.strictEqual(result.data.metadata.documentType, "Executive Employment Agreement");
    assert.strictEqual(result.data.keyClauses.length, 2);
    assert.strictEqual(result.data.potentialConcerns[0].severity, "high");
    assert.strictEqual(result.data.importantDates.length, 2);
  }
});

test("AI Schema - validates compliant NDA response with empty concerns and null dates", () => {
  const parsed = JSON.parse(MOCK_VALID_NDA_RESPONSE);
  const result = RawAiAnalysisResponseSchema.safeParse(parsed);

  assert.strictEqual(result.success, true);
  if (result.success) {
    assert.strictEqual(result.data.metadata.effectiveDate, null);
    assert.strictEqual(result.data.potentialConcerns.length, 0);
    assert.strictEqual(result.data.importantDates[0].type, "duration");
  }
});

test("AI Schema - rejects malformed payloads missing required schema version", () => {
  const parsed = JSON.parse(MOCK_INVALID_SCHEMA_RESPONSE);
  const result = RawAiAnalysisResponseSchema.safeParse(parsed);

  assert.strictEqual(result.success, false);
});

test("AI Schema - rejects invalid enum values for clause importance and risk severity", () => {
  const badData = {
    analysisSchemaVersion: "1.0",
    metadata: {},
    executiveSummary: {
      overview: "Valid overview text here that is long enough.",
    },
    keyClauses: [
      {
        id: "c1",
        title: "Clause",
        category: "General",
        summary: "Summary text",
        importance: "invalid-importance", // Invalid enum
        source: { chunkId: "chk_1", quote: "Text" },
      },
    ],
    potentialConcerns: [
      {
        id: "r1",
        title: "Concern",
        severity: "catastrophic", // Invalid enum
        explanation: "Valid explanation text that is long enough",
        whyItMatters: "Why it matters",
        suggestedReviewQuestion: "Question?",
        source: { chunkId: "chk_1", quote: "Text" },
      },
    ],
  };

  const result = RawAiAnalysisResponseSchema.safeParse(badData);
  assert.strictEqual(result.success, false);
});
