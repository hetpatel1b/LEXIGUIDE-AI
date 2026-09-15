import test from "node:test";
import assert from "node:assert";
import { ServerResultCache } from "../src/lib/cache/server-result-cache";

// Minimal mock AiEngineError if needed
class MockAiError extends Error {
  code: string;
  constructor(message: string, code: string) {
    super(message);
    this.code = code;
  }
}

test("Efficiency - Server-Side Deduplication & Caching", async (t) => {
  await t.test("Simultaneous identical requests should trigger exactly one computation (In-flight Dedup)", async () => {
    const cache = new ServerResultCache();
    const sessionId = "session_A";
    const key = "analysis:doc_123";

    let computeCount = 0;
    const computeFn = async () => {
      computeCount++;
      // Simulate 50ms async work
      await new Promise((resolve) => setTimeout(resolve, 50));
      return { data: "success" };
    };

    // Fire 5 concurrent requests
    const promises = Array.from({ length: 5 }).map(() =>
      cache.getOrCompute(key, sessionId, computeFn)
    );

    const results = await Promise.all(promises);

    // Assert only one computation happened
    assert.strictEqual(computeCount, 1, "Should only compute once for concurrent identical requests");
    
    // Assert all returned the same exact data
    for (const res of results) {
      assert.deepStrictEqual(res, { data: "success" });
    }
  });

  await t.test("Sequential identical requests should use cached value (Lifecycle Caching)", async () => {
    const cache = new ServerResultCache();
    const sessionId = "session_A";
    const key = "analysis:doc_123";

    let computeCount = 0;
    const computeFn = async () => {
      computeCount++;
      return { data: "cached_data" };
    };

    const firstResult = await cache.getOrCompute(key, sessionId, computeFn);
    assert.strictEqual(computeCount, 1);
    assert.deepStrictEqual(firstResult, { data: "cached_data" });

    // Next request sequentially
    const secondResult = await cache.getOrCompute(key, sessionId, computeFn);
    
    // Should NOT have incremented
    assert.strictEqual(computeCount, 1, "Should not recompute sequential request");
    assert.deepStrictEqual(secondResult, { data: "cached_data" });
  });

  await t.test("Different sessions should not share the cache (Security Isolation)", async () => {
    const cache = new ServerResultCache();
    const key = "analysis:doc_123";

    let computeCount = 0;
    const computeFn = async () => {
      computeCount++;
      return { data: `session_data_${computeCount}` };
    };

    const resA = await cache.getOrCompute(key, "session_A", computeFn);
    assert.strictEqual(computeCount, 1);
    
    // Request from a DIFFERENT session for the same document
    const resB = await cache.getOrCompute(key, "session_B", computeFn);
    
    assert.strictEqual(computeCount, 2, "Should recompute for a different session");
    assert.notDeepStrictEqual(resA, resB);
  });

  await t.test("Failed computations should not be cached permanently", async () => {
    const cache = new ServerResultCache();
    const sessionId = "session_A";
    const key = "qa:doc_123:failed";

    let computeCount = 0;
    const computeFn = async () => {
      computeCount++;
      throw new MockAiError("AI failed", "AI_ERROR");
    };

    // First attempt fails
    await assert.rejects(
      cache.getOrCompute(key, sessionId, computeFn),
      /AI failed/
    );

    // Second attempt should recompute, not just instantly fail from cache
    await assert.rejects(
      cache.getOrCompute(key, sessionId, computeFn),
      /AI failed/
    );

    assert.strictEqual(computeCount, 2, "Should have attempted computation twice because first failed");
  });

  await t.test("Cache invalidation and session clearing", async () => {
    const cache = new ServerResultCache();
    const sessionId = "session_A";
    const key = "analysis:doc_123";

    let computeCount = 0;
    const computeFn = async () => {
      computeCount++;
      return { data: "data" };
    };

    await cache.getOrCompute(key, sessionId, computeFn);
    assert.strictEqual(computeCount, 1);

    // Clear session
    cache.clearSession(sessionId);

    await cache.getOrCompute(key, sessionId, computeFn);
    assert.strictEqual(computeCount, 2, "Should recompute after session clear");
  });
  await t.test("TTL Expiration should remove stale entries", async () => {
    const cache = new ServerResultCache();
    // Use a small TTL via mocking or by intercepting Date.now
    // Since we cannot mock Date.now easily here without side effects, we can access private properties using `any` to set fake timestamps.
    const sessionId = "session_ttl";
    const key = "analysis:doc_ttl";

    let computeCount = 0;
    const computeFn = async () => {
      computeCount++;
      return { data: "ttl_data" };
    };

    await cache.getOrCompute(key, sessionId, computeFn);
    assert.strictEqual(computeCount, 1);

    // Force expiration by modifying the internal timestamp
    const secureKey = `${sessionId}:${key}`;
    const internalCache = (cache as any).resolvedCache;
    const entry = internalCache.get(secureKey);
    entry.timestamp = Date.now() - (60 * 60 * 1000) - 1000; // 1 hour and 1 second ago

    // Try again, it should recompute because it's expired
    await cache.getOrCompute(key, sessionId, computeFn);
    assert.strictEqual(computeCount, 2, "Should recompute after TTL expires");
  });

  await t.test("Maximum 500-entry bound and eviction behavior", async () => {
    const cache = new ServerResultCache();
    const sessionId = "session_max";

    const computeFn = async (id: number) => {
      return { data: `data_${id}` };
    };

    // Fill the cache up to 505 entries
    for (let i = 0; i < 505; i++) {
      await cache.getOrCompute(`key_${i}`, sessionId, () => computeFn(i));
    }

    const stats = cache.getStats();
    assert.ok(stats.resolvedCount <= 500, `Cache should not exceed 500 entries (was ${stats.resolvedCount})`);

    // Verify the very first entries were evicted (LRU / insertion order eviction)
    const internalCache = (cache as any).resolvedCache;
    assert.ok(!internalCache.has(`${sessionId}:key_0`), "First entry should be evicted");
    assert.ok(internalCache.has(`${sessionId}:key_504`), "Latest entry should exist");
  });
});
