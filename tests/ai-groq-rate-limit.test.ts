import test from "node:test";
import assert from "node:assert";
import { GroqClient } from "@/lib/ai/client/groq-client";
import { AiEngineError, toSafeUserMessage } from "@/lib/ai/errors";
import { ServerResultCache } from "@/lib/cache/server-result-cache";
import { withApiSecurity } from "@/lib/security/api-handler";
import { NextRequest } from "next/server";

// Fallback test credentials for testing environment
if (!process.env.GROQ_API_KEY) {
  process.env.GROQ_API_KEY = "mock_test_key_for_ci_environment";
}

test("Groq Rate Limit & Error Handling Suite", async (t) => {
  const originalFetch = globalThis.fetch;

  // 1. HTTP 429 with a valid Retry-After
  await t.test("HTTP 429 with valid Retry-After retries and succeeds", async () => {
    let callCount = 0;
    globalThis.fetch = async () => {
      callCount++;
      if (callCount === 1) {
        return new Response(
          JSON.stringify({ error: { message: "Rate limit reached. Try again in 1s." } }),
          {
            status: 429,
            headers: {
              "content-type": "application/json",
              "retry-after": "1",
              "x-ratelimit-reset-tokens": "1s",
            },
          }
        );
      }
      return new Response(
        'data: {"choices":[{"delta":{"content":"{\\"status\\":\\"success\\"}"},"finish_reason":"stop"}]}\n\ndata: [DONE]\n\n',
        { status: 200, headers: { "content-type": "text/event-stream" } }
      );
    };

    try {
      const client = new GroqClient({ apiKey: "gsk_dummy_test_key" });
      const res = await client.generateChatCompletionDetailed([{ role: "user", content: "hello" }]);
      assert.strictEqual(callCount, 2, "Should have retried once after 429");
      assert.strictEqual(res.content, '{"status":"success"}');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  // 2. HTTP 429 with reset headers but no Retry-After
  await t.test("HTTP 429 with x-ratelimit-reset-tokens but no Retry-After retries and succeeds", async () => {
    let callCount = 0;
    globalThis.fetch = async () => {
      callCount++;
      if (callCount === 1) {
        return new Response(
          JSON.stringify({ error: { message: "Rate limit tokens reached." } }),
          {
            status: 429,
            headers: {
              "content-type": "application/json",
              "x-ratelimit-reset-tokens": "0.5s",
            },
          }
        );
      }
      return new Response(
        'data: {"choices":[{"delta":{"content":"{\\"recovered\\":true}"},"finish_reason":"stop"}]}\n\ndata: [DONE]\n\n',
        { status: 200, headers: { "content-type": "text/event-stream" } }
      );
    };

    try {
      const client = new GroqClient({ apiKey: "gsk_dummy_test_key" });
      const res = await client.generateChatCompletionDetailed([{ role: "user", content: "hello" }]);
      assert.strictEqual(callCount, 2, "Should have retried once using reset header");
      assert.strictEqual(res.content, '{"recovered":true}');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  // 3. HTTP 429 without usable timing metadata
  await t.test("HTTP 429 without timing metadata uses bounded backoff and succeeds", async () => {
    let callCount = 0;
    globalThis.fetch = async () => {
      callCount++;
      if (callCount === 1) {
        return new Response("Too Many Requests", {
          status: 429,
          headers: {},
        });
      }
      return new Response(
        'data: {"choices":[{"delta":{"content":"{\\"fallback\\":true}"},"finish_reason":"stop"}]}\n\ndata: [DONE]\n\n',
        { status: 200, headers: { "content-type": "text/event-stream" } }
      );
    };

    try {
      const client = new GroqClient({ apiKey: "gsk_dummy_test_key" });
      const res = await client.generateChatCompletionDetailed([{ role: "user", content: "hello" }]);
      assert.strictEqual(callCount, 2, "Should have retried once with fallback backoff");
      assert.strictEqual(res.content, '{"fallback":true}');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  // 4. Exhausted daily quota does NOT retry
  await t.test("Exhausted daily quota aborts immediately without retrying", async () => {
    let callCount = 0;
    globalThis.fetch = async () => {
      callCount++;
      return new Response(
        JSON.stringify({
          error: {
            message: "Daily request limit reached. Limit: 1000 requests per day.",
          },
        }),
        {
          status: 429,
          headers: {
            "content-type": "application/json",
            "retry-after": "3600",
          },
        }
      );
    };

    try {
      const client = new GroqClient({ apiKey: "gsk_dummy_test_key" });
      await assert.rejects(
        async () => {
          await client.generateChatCompletionDetailed([{ role: "user", content: "hello" }]);
        },
        (err: unknown) => {
          assert.ok(err instanceof AiEngineError);
          assert.strictEqual(err.code, "AI_RATE_LIMITED");
          assert.strictEqual((err.details as any)?.isDailyQuota, true);
          const safeMessage = toSafeUserMessage(err);
          assert.ok(safeMessage.includes("usage limit has been reached"));
          return true;
        }
      );
      assert.strictEqual(callCount, 1, "Must NOT retry when daily quota is exhausted");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  // 5. HTTP 429 with large reset wait (>15s) aborts immediately
  await t.test("HTTP 429 with reset > 15s aborts immediately to avoid hanging serverless request", async () => {
    let callCount = 0;
    globalThis.fetch = async () => {
      callCount++;
      return new Response(
        JSON.stringify({
          error: {
            message: "Rate limit reached on tokens per minute (TPM). Please try again in 28.5s.",
          },
        }),
        {
          status: 429,
          headers: {
            "content-type": "application/json",
            "retry-after": "29",
            "x-ratelimit-reset-tokens": "28.5s",
          },
        }
      );
    };

    try {
      const client = new GroqClient({ apiKey: "gsk_dummy_test_key" });
      await assert.rejects(
        async () => {
          await client.generateChatCompletionDetailed([{ role: "user", content: "hello" }]);
        },
        (err: unknown) => {
          assert.ok(err instanceof AiEngineError);
          assert.strictEqual(err.code, "AI_RATE_LIMITED");
          assert.strictEqual((err.details as any)?.retryAfterSeconds, 29);
          return true;
        }
      );
      assert.strictEqual(callCount, 1, "Must NOT retry when wait exceeds serverless budget");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  // 6. Repeated 429 responses exhaust retry budget and fail safely
  await t.test("Repeated 429 responses stop after maxRetries and do not loop infinitely", async () => {
    let callCount = 0;
    globalThis.fetch = async () => {
      callCount++;
      return new Response(
        JSON.stringify({
          error: {
            message: "Rate limit reached. Try again in 1s.",
          },
        }),
        {
          status: 429,
          headers: {
            "content-type": "application/json",
            "retry-after": "1",
          },
        }
      );
    };

    try {
      const client = new GroqClient({ apiKey: "gsk_dummy_test_key" });
      await assert.rejects(
        async () => {
          await client.generateChatCompletionDetailed([{ role: "user", content: "hello" }]);
        },
        (err: unknown) => {
          assert.ok(err instanceof AiEngineError);
          assert.strictEqual(err.code, "AI_RATE_LIMITED");
          return true;
        }
      );
      // 1 initial attempt + 2 retries = 3 calls total
      assert.strictEqual(callCount, 3, "Must stop after maxRetries (2 retries)");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  // 7. HTTP 401 invalid credentials is NOT retried
  await t.test("HTTP 401 invalid credentials is not retried", async () => {
    let callCount = 0;
    globalThis.fetch = async () => {
      callCount++;
      return new Response(
        JSON.stringify({ error: { message: "Invalid API Key" } }),
        { status: 401, headers: { "content-type": "application/json" } }
      );
    };

    try {
      const client = new GroqClient({ apiKey: "invalid-key" });
      await assert.rejects(
        async () => {
          await client.generateChatCompletionDetailed([{ role: "user", content: "hello" }]);
        },
        (err: unknown) => {
          assert.ok(err instanceof AiEngineError);
          assert.strictEqual(err.code, "AI_AUTH_ERROR");
          return true;
        }
      );
      assert.strictEqual(callCount, 1, "Must never retry 401");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  // 8. HTTP 5xx transient failure retries and recovers
  await t.test("HTTP 503 transient provider failure retries and succeeds", async () => {
    let callCount = 0;
    globalThis.fetch = async () => {
      callCount++;
      if (callCount === 1) {
        return new Response("Service Unavailable", { status: 503 });
      }
      return new Response(
        'data: {"choices":[{"delta":{"content":"{\\"ok\\":true}"},"finish_reason":"stop"}]}\n\ndata: [DONE]\n\n',
        { status: 200, headers: { "content-type": "text/event-stream" } }
      );
    };

    try {
      const client = new GroqClient({ apiKey: "gsk_dummy_test_key" });
      const res = await client.generateChatCompletionDetailed([{ role: "user", content: "hello" }]);
      assert.strictEqual(callCount, 2, "Must retry once on 503");
      assert.strictEqual(res.content, '{"ok":true}');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  // 9. Abort / Network Timeout is not retried indefinitely
  await t.test("Abort/timeout does not loop and throws AI_TIMEOUT", async () => {
    let callCount = 0;
    globalThis.fetch = async () => {
      callCount++;
      const err = new Error("The operation was aborted");
      err.name = "AbortError";
      throw err;
    };

    try {
      const client = new GroqClient({ apiKey: "gsk_dummy_test_key", timeoutMs: 50 });
      await assert.rejects(
        async () => {
          await client.generateChatCompletionDetailed([{ role: "user", content: "hello" }]);
        },
        (err: unknown) => {
          assert.ok(err instanceof AiEngineError);
          assert.strictEqual(err.code, "AI_TIMEOUT");
          return true;
        }
      );
      assert.strictEqual(callCount, 1, "Must not retry timeouts");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  // 10. API Handler preserves Retry-After header on 429
  await t.test("withApiSecurity sets HTTP 429 and Retry-After header on AI_RATE_LIMITED", async () => {
    const handler = withApiSecurity("analysis", async () => {
      const err = new AiEngineError(
        "AI_RATE_LIMITED",
        "Groq rate limit reached.",
        429,
        { retryAfterSeconds: 12 }
      );
      throw err;
    });

    const req = new NextRequest("http://localhost:3000/api/analysis", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "http://localhost:3000",
        host: "localhost:3000",
      },
      body: JSON.stringify({ documentId: "doc_test" }),
    });

    const res = await handler(req);
    assert.strictEqual(res.status, 429);
    assert.strictEqual(res.headers.get("Retry-After"), "12");

    const json = await res.json();
    assert.strictEqual(json.success, false);
    assert.strictEqual(json.error.code, "AI_RATE_LIMITED");
    assert.strictEqual(json.error.retryAfter, 12);
  });

  // 11. Sensitive API Key is never leaked in errors or messages
  await t.test("Sensitive credentials are not leaked in error messages", () => {
    const errorWithSecret = new AiEngineError(
      "AI_AUTH_ERROR",
      "Authentication failed with key gsk_super_secret_production_key_xyz",
      401
    );
    const safeUserMsg = toSafeUserMessage(errorWithSecret);
    assert.ok(!safeUserMsg.includes("gsk_"));
    assert.ok(!safeUserMsg.includes("super_secret"));
  });

  // 12. In-flight request deduplication and session isolation
  await t.test("Concurrent identical requests share one compute; separate sessions are isolated", async () => {
    const cache = new ServerResultCache();
    let computeCountSessionA = 0;
    let computeCountSessionB = 0;

    const opA = () =>
      cache.getOrCompute("analysis:doc_1", "session_A", async () => {
        computeCountSessionA++;
        await new Promise((r) => setTimeout(r, 20));
        return { docId: "doc_1", session: "A" };
      });

    const opB = () =>
      cache.getOrCompute("analysis:doc_1", "session_B", async () => {
        computeCountSessionB++;
        await new Promise((r) => setTimeout(r, 20));
        return { docId: "doc_1", session: "B" };
      });

    // 3 concurrent requests from session A
    const [resA1, resA2, resA3] = await Promise.all([opA(), opA(), opA()]);
    assert.strictEqual(computeCountSessionA, 1, "Concurrent requests must deduplicate to 1 execution");
    assert.deepStrictEqual(resA1, resA2);
    assert.deepStrictEqual(resA2, resA3);

    // Request from session B for the same document must execute separately
    const resB = await opB();
    assert.strictEqual(computeCountSessionB, 1, "Session B must execute its own request");
    assert.notDeepStrictEqual(resA1, resB, "Session A and B results must remain isolated");
  });
});
