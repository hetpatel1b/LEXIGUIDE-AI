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

test("AI Analysis Service - recovers when Pass 1 is truncated and Pass 2 retry succeeds", async () => {
  let callCount = 0;
  const retryProvider: AiProvider = {
    async generateChatCompletionDetailed() {
      callCount++;
      if (callCount === 1) {
        // Pass 1: truncated output with finish_reason='length'
        return {
          content: '{"analysisSchemaVersion": "1.0", "metadata": { "documentType": "Employment"',
          finishReason: "length",
          ttftMs: 10,
          totalDurationMs: 20,
          model: "test-model",
        };
      }
      // Pass 2: valid complete output with finish_reason='stop'
      return {
        content: MOCK_VALID_EMPLOYMENT_RESPONSE,
        finishReason: "stop",
        ttftMs: 5,
        totalDurationMs: 15,
        model: "test-model",
      };
    },
    async generateChatCompletion() {
      return MOCK_VALID_EMPLOYMENT_RESPONSE;
    },
  };

  const result = await analyzeDocument(employmentDoc, retryProvider, "test_retry_req");
  assert.strictEqual(callCount, 2, "Should have executed retry pass");
  assert.strictEqual(result.analysisSchemaVersion, "1.0");
  assert.strictEqual(result.keyClauses.length, 2);
});

test("AI Analysis Service - does not retry on authentication error", async () => {
  let callCount = 0;
  const authFailProvider: AiProvider = {
    async generateChatCompletionDetailed() {
      callCount++;
      throw new AiEngineError("AI_AUTH_ERROR", "Authentication failed", 401);
    },
    async generateChatCompletion() {
      throw new AiEngineError("AI_AUTH_ERROR", "Authentication failed", 401);
    },
  };

  await assert.rejects(
    async () => {
      await analyzeDocument(employmentDoc, authFailProvider);
    },
    (err: unknown) => {
      assert.ok(err instanceof AiEngineError);
      assert.strictEqual(err.code, "AI_AUTH_ERROR");
      assert.strictEqual(callCount, 1, "Must not retry authentication failure");
      return true;
    }
  );
});

test("AI Analysis Service - safely normalizes unclosed quotes on chunkId", async () => {
  // Inject a chunkId missing closing quote before comma (e.g. "chunkId": "chk_123, instead of "chunkId": "chk_123",)
  const rawWithMissingQuote = MOCK_VALID_EMPLOYMENT_RESPONSE.replace(
    /"chunkId":\s*"([^"]+)",/g,
    '"chunkId": "$1,'
  );

  const provider: AiProvider = {
    async generateChatCompletionDetailed() {
      return {
        content: rawWithMissingQuote,
        finishReason: "stop",
        ttftMs: 10,
        totalDurationMs: 20,
        model: "test-model",
      };
    },
    async generateChatCompletion() {
      return rawWithMissingQuote;
    },
  };

  const result = await analyzeDocument(employmentDoc, provider);
  assert.strictEqual(result.analysisSchemaVersion, "1.0");
  assert.strictEqual(result.keyClauses.length, 2);
});
