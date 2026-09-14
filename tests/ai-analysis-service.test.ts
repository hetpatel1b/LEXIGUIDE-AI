import test from "node:test";
import assert from "node:assert";
import { analyzeDocument } from "@/lib/ai/analysis/analysis-service";
import type { AiProvider, ChatMessage } from "@/lib/ai/client/types";
import { AiEngineError } from "@/lib/ai/errors";
import employmentDocRaw from "./fixtures/ai/employment-agreement.json";
import ndaDocRaw from "./fixtures/ai/nda-agreement.json";
import noHeadersDocRaw from "./fixtures/ai/no-headers.json";
import {
  MOCK_VALID_EMPLOYMENT_RESPONSE,
  MOCK_VALID_NDA_RESPONSE,
  MOCK_INVALID_SCHEMA_RESPONSE,
} from "./fixtures/ai/mock-nemotron-responses";
import type { NormalizedDocument } from "@/lib/document-engine/types";

const employmentDoc = employmentDocRaw as unknown as NormalizedDocument;
const ndaDoc = ndaDocRaw as unknown as NormalizedDocument;
const noHeadersDoc = noHeadersDocRaw as unknown as NormalizedDocument;

class MockAiProvider implements AiProvider {
  constructor(private readonly mockOutput: string) {}

  async generateChatCompletion(messages: ChatMessage[]): Promise<string> {
    assert.ok(messages.length >= 2);
    assert.strictEqual(messages[0].role, "system");
    assert.strictEqual(messages[1].role, "user");
    return this.mockOutput;
  }
}

test("AI Analysis Service - analyzes employment agreement end-to-end with verified citations", async () => {
  const provider = new MockAiProvider(MOCK_VALID_EMPLOYMENT_RESPONSE);
  const result = await analyzeDocument(employmentDoc, provider);

  assert.strictEqual(result.analysisSchemaVersion, "1.0");
  assert.strictEqual(result.documentId, employmentDoc.id);
  assert.strictEqual(result.metadata.documentType, "Executive Employment Agreement");
  assert.strictEqual(result.keyClauses.length, 2);
  assert.strictEqual(result.keyClauses[0].verified, true);
  assert.strictEqual(result.potentialConcerns.length, 1);
  assert.strictEqual(result.potentialConcerns[0].verified, true);
});

test("AI Analysis Service - analyzes NDA with missing financial terms preserving 'Not found'", async () => {
  const provider = new MockAiProvider(MOCK_VALID_NDA_RESPONSE);
  const result = await analyzeDocument(ndaDoc, provider);

  assert.strictEqual(result.documentId, ndaDoc.id);
  assert.strictEqual(result.metadata.financialTerms, "Not found in the uploaded document.");
  assert.strictEqual(result.metadata.effectiveDate, null);
  assert.strictEqual(result.obligations[0].verified, true);
});

test("AI Analysis Service - safely strips markdown code blocks (```json ... ```)", async () => {
  const markdownWrapped = `\`\`\`json\n${MOCK_VALID_EMPLOYMENT_RESPONSE}\n\`\`\``;
  const provider = new MockAiProvider(markdownWrapped);
  const result = await analyzeDocument(employmentDoc, provider);

  assert.strictEqual(result.analysisSchemaVersion, "1.0");
  assert.strictEqual(result.keyClauses.length, 2);
});

test("AI Analysis Service - throws AI_INVALID_RESPONSE when model produces non-JSON output", async () => {
  const provider = new MockAiProvider("I am a language model and here is your legal analysis: ...not json");

  await assert.rejects(
    async () => {
      await analyzeDocument(employmentDoc, provider);
    },
    (err: unknown) => {
      assert.ok(err instanceof AiEngineError);
      assert.strictEqual(err.code, "AI_INVALID_RESPONSE");
      return true;
    }
  );
});

test("AI Analysis Service - throws AI_SCHEMA_ERROR when model response fails schema validation", async () => {
  const provider = new MockAiProvider(MOCK_INVALID_SCHEMA_RESPONSE);

  await assert.rejects(
    async () => {
      await analyzeDocument(employmentDoc, provider);
    },
    (err: unknown) => {
      assert.ok(err instanceof AiEngineError);
      assert.strictEqual(err.code, "AI_SCHEMA_ERROR");
      return true;
    }
  );
});

test("AI Analysis Service - rejects document with empty chunks", async () => {
  const emptyDoc: NormalizedDocument = {
    ...employmentDoc,
    chunks: [],
  };

  await assert.rejects(
    async () => {
      await analyzeDocument(emptyDoc, new MockAiProvider(MOCK_VALID_EMPLOYMENT_RESPONSE));
    },
    (err: unknown) => {
      assert.ok(err instanceof AiEngineError);
      assert.strictEqual(err.code, "AI_INVALID_RESPONSE");
      return true;
    }
  );
});
