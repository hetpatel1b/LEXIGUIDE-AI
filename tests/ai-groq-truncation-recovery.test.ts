import test from "node:test";
import assert from "node:assert";
import { GroqClient } from "@/lib/ai/client/groq-client";
import { analyzeDocument } from "@/lib/ai/analysis/analysis-service";
import type { AiProvider, ChatMessage, ChatCompletionOptions } from "@/lib/ai/client/types";
import { AiEngineError } from "@/lib/ai/errors";
import { RawAiAnalysisResponseSchema } from "@/lib/ai/schemas/analysis-schema";
import { validateAnalysisSources } from "@/lib/ai/analysis/source-validator";
import employmentDocRaw from "./fixtures/ai/employment-agreement.json";
import { MOCK_VALID_EMPLOYMENT_RESPONSE } from "./fixtures/ai/mock-groq-responses";
import type { NormalizedDocument } from "@/lib/document-engine/types";

if (!process.env.GROQ_API_KEY) {
  process.env.GROQ_API_KEY = "mock_test_key_for_ci_environment";
}

const employmentDoc = employmentDocRaw as unknown as NormalizedDocument;

test("Groq Truncation & Structured Output Recovery Suite", async (t) => {
  const originalFetch = globalThis.fetch;

  // 1. Streaming: Valid stream with multiple content deltas accumulated in order
  await t.test("Streaming - accumulates multiple content deltas in order with finish_reason=stop", async () => {
    globalThis.fetch = async () => {
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('data: {"choices":[{"delta":{"content":"{\\"status\\":\\"ok\\","},"finish_reason":null}]}\n\n'));
          controller.enqueue(new TextEncoder().encode('data: {"choices":[{"delta":{"content":"\\"part2\\":true}"},"finish_reason":null}]}\n\n'));
          controller.enqueue(new TextEncoder().encode('data: {"choices":[{"delta":{},"finish_reason":"stop"}],"usage":{"total_tokens":50}}\n\n'));
          controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
          controller.close();
        },
      });
      return new Response(stream, { status: 200, headers: { "content-type": "text/event-stream" } });
    };

    try {
      const client = new GroqClient({ apiKey: "test-key" });
      const res = await client.generateChatCompletionDetailed([{ role: "user", content: "test" }]);
      assert.strictEqual(res.content, '{"status":"ok","part2":true}');
      assert.strictEqual(res.finishReason, "stop");
      assert.strictEqual(res.usage?.totalTokens, 50);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  // 2. Streaming: Captures finish_reason=length
  await t.test("Streaming - captures finish_reason=length on truncated output", async () => {
    globalThis.fetch = async () => {
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('data: {"choices":[{"delta":{"content":"{\\"incomplete\\":true"},"finish_reason":null}]}\n\n'));
          controller.enqueue(new TextEncoder().encode('data: {"choices":[{"delta":{},"finish_reason":"length"}]}\n\n'));
          controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
          controller.close();
        },
      });
      return new Response(stream, { status: 200, headers: { "content-type": "text/event-stream" } });
    };

    try {
      const client = new GroqClient({ apiKey: "test-key" });
      const res = await client.generateChatCompletionDetailed([{ role: "user", content: "test" }]);
      assert.strictEqual(res.finishReason, "length");
      assert.strictEqual(res.content, '{"incomplete":true');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  // 3. Streaming: Missing final event / premature termination detected as interrupted
  await t.test("Streaming - detects stream closed without [DONE] or finish_reason as interrupted", async () => {
    globalThis.fetch = async () => {
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('data: {"choices":[{"delta":{"content":"{\\"partial\\":\\"stream\\"}"},"finish_reason":null}]}\n\n'));
          // Stream closes abruptly without sending finish_reason or [DONE]
          controller.close();
        },
      });
      return new Response(stream, { status: 200, headers: { "content-type": "text/event-stream" } });
    };

    try {
      const client = new GroqClient({ apiKey: "test-key" });
      const res = await client.generateChatCompletionDetailed([{ role: "user", content: "test" }]);
      assert.strictEqual(res.finishReason, "interrupted");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  // 4. Streaming: Empty response stream throws AI_INVALID_RESPONSE
  await t.test("Streaming - throws AI_INVALID_RESPONSE when stream produces empty content", async () => {
    globalThis.fetch = async () => {
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
          controller.close();
        },
      });
      return new Response(stream, { status: 200, headers: { "content-type": "text/event-stream" } });
    };

    try {
      const client = new GroqClient({ apiKey: "test-key" });
      await assert.rejects(
        async () => {
          await client.generateChatCompletionDetailed([{ role: "user", content: "test" }]);
        },
        (err: unknown) => {
          assert.ok(err instanceof AiEngineError);
          assert.strictEqual(err.code, "AI_INVALID_RESPONSE");
          return true;
        }
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  // 5. Output Validation: Complete valid JSON passes Zod validation
  await t.test("Output Validation - complete valid JSON passes Zod validation", () => {
    const parsed = JSON.parse(MOCK_VALID_EMPLOYMENT_RESPONSE);
    const validated = RawAiAnalysisResponseSchema.safeParse(parsed);
    assert.strictEqual(validated.success, true);
    if (validated.success) {
      assert.strictEqual(validated.data.analysisSchemaVersion, "1.0");
      assert.strictEqual(validated.data.keyClauses.length, 2);
    }
  });

  // 6. Output Validation: Malformed JSON fails gracefully
  await t.test("Output Validation - malformed JSON string throws parse error", () => {
    const malformed = '{"analysisSchemaVersion": "1.0", "unclosed": "literal';
    assert.throws(() => JSON.parse(malformed));
  });

  // 7. Output Validation: Missing required schema fields fails Zod validation
  await t.test("Output Validation - missing executiveSummary fails schema validation", () => {
    const incomplete = {
      analysisSchemaVersion: "1.0",
      metadata: { documentType: "Contract" },
      // executiveSummary missing!
      keyClauses: [],
    };
    const validated = RawAiAnalysisResponseSchema.safeParse(incomplete);
    assert.strictEqual(validated.success, false);
  });

  // 8. Output Validation: Fabricated quotes fail citation verification
  await t.test("Output Validation - fabricated citation quotes fail source verification", () => {
    const parsed = JSON.parse(MOCK_VALID_EMPLOYMENT_RESPONSE);
    const fabricated = {
      ...parsed,
      keyClauses: [
        {
          ...parsed.keyClauses[0],
          source: {
            chunkId: "chk_001",
            quote: "This text does not exist anywhere in the legal document.",
          },
        },
      ],
    };
    const result = validateAnalysisSources(fabricated, employmentDoc, "openai/gpt-oss-120b");
    assert.strictEqual(result.keyClauses[0].verified, false);
  });

  // 9. Recovery: Pass 1 truncated with finish_reason=length triggers Pass 2 recovery with changed strategy
  await t.test("Recovery - Pass 1 truncated by length triggers Pass 2 with dedicated budget and succeeds", async () => {
    let callCount = 0;
    const recordedOptions: ChatCompletionOptions[] = [];

    const mockProvider: AiProvider = {
      async generateChatCompletionDetailed(messages: ChatMessage[], options?: ChatCompletionOptions) {
        callCount++;
        if (options) recordedOptions.push(options);

        if (callCount === 1) {
          // Pass 1: truncated output
          return {
            content: '{"analysisSchemaVersion": "1.0", "metadata": {"documentType": "Employment"}, "keyClauses": [',
            finishReason: "length",
            ttftMs: 10,
            totalDurationMs: 20,
            model: "openai/gpt-oss-120b",
          };
        }

        // Pass 2: valid complete output
        return {
          content: MOCK_VALID_EMPLOYMENT_RESPONSE,
          finishReason: "stop",
          ttftMs: 5,
          totalDurationMs: 15,
          model: "openai/gpt-oss-120b",
        };
      },
      async generateChatCompletion() {
        return MOCK_VALID_EMPLOYMENT_RESPONSE;
      },
    };

    const result = await analyzeDocument(employmentDoc, mockProvider, "test_recovery_req");
    assert.strictEqual(callCount, 2, "Must execute Pass 2 recovery pass");
    assert.strictEqual(result.analysisSchemaVersion, "1.0");
    assert.strictEqual(result.keyClauses.length, 2);

    // Verify recovery changed the output token parameter appropriately
    assert.strictEqual(recordedOptions[0]?.maxTokens, 3000, "Pass 1 uses AI_CONFIG.maxTokens");
    assert.strictEqual(recordedOptions[1]?.maxTokens, 3200, "Pass 2 uses dedicated recovery budget (>=3200)");
  });

  // 10. Recovery: Repeated truncation stops at max 2 passes and throws 422
  await t.test("Recovery - repeated truncation stops at max attempts and throws AI_INVALID_RESPONSE", async () => {
    let callCount = 0;

    const permanentlyTruncatedProvider: AiProvider = {
      async generateChatCompletionDetailed() {
        callCount++;
        return {
          content: '{"analysisSchemaVersion": "1.0", "truncated": true',
          finishReason: "length",
          ttftMs: 10,
          totalDurationMs: 20,
          model: "openai/gpt-oss-120b",
        };
      },
      async generateChatCompletion() {
        return '{"analysisSchemaVersion": "1.0"';
      },
    };

    await assert.rejects(
      async () => {
        await analyzeDocument(employmentDoc, permanentlyTruncatedProvider, "test_stop_req");
      },
      (err: unknown) => {
        assert.ok(err instanceof AiEngineError);
        assert.strictEqual(err.code, "AI_INVALID_RESPONSE");
        assert.strictEqual(err.statusCode, 422);
        return true;
      }
    );

    assert.strictEqual(callCount, 2, "Must stop after 2 passes (Pass 1 + 1 recovery retry)");
  });

  // 11. Recovery: Auth error does NOT retry
  await t.test("Recovery - auth error throws immediately without retrying", async () => {
    let callCount = 0;
    const authFailProvider: AiProvider = {
      async generateChatCompletionDetailed() {
        callCount++;
        throw new AiEngineError("AI_AUTH_ERROR", "Authentication failed", 401);
      },
      async generateChatCompletion() {
        callCount++;
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
        return true;
      }
    );

    assert.strictEqual(callCount, 1, "Must never retry 401 authentication errors");
  });
});
