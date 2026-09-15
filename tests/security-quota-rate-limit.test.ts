import test from "node:test";
import assert from "node:assert";
import { MemoryQuotaStore, getQuotaErrorMessage } from "@/lib/security/quota-manager";
import { MemoryRateLimiter } from "@/lib/security/rate-limiter";
import { QUOTA_CONFIG, RATE_LIMIT_CONFIG } from "@/lib/security/quota-config";

test("Daily Quotas - tracks usage and enforces quota boundaries for analysis (10/day)", () => {
  const store = new MemoryQuotaStore();
  const sessionId = "session_quota_test_01";

  // 1. Initial state (0 usage)
  const initial = store.checkQuota(sessionId, "analysis");
  assert.strictEqual(initial.allowed, true);
  assert.strictEqual(initial.remaining, QUOTA_CONFIG.analysesPerDay);
  assert.strictEqual(initial.limit, 10);

  // 2. Consume up to limit (10 items)
  for (let i = 0; i < 10; i++) {
    const check = store.checkQuota(sessionId, "analysis");
    assert.strictEqual(check.allowed, true, `Analysis ${i + 1} should be allowed`);
    assert.strictEqual(check.remaining, 10 - i);
    store.consumeQuota(sessionId, "analysis");
  }

  // 3. Exact boundary (10th consumed -> 11th rejected)
  const boundary = store.checkQuota(sessionId, "analysis");
  assert.strictEqual(boundary.allowed, false, "11th analysis must be rejected");
  assert.strictEqual(boundary.remaining, 0);
  assert.ok(boundary.retryAfterSeconds > 0);

  // 4. Friendly error message
  const err = getQuotaErrorMessage("analysis", boundary.limit);
  assert.strictEqual(err.code, "DAILY_QUOTA_EXCEEDED");
  assert.ok(err.message.includes("10/day"));
  assert.ok(err.suggestion.includes("UTC midnight"));
});

test("Daily Quotas - tracks upload quota (5/day) independently per session", () => {
  const store = new MemoryQuotaStore();
  const sessionA = "session_user_a";
  const sessionB = "session_user_b";

  // Exhaust user A's uploads
  for (let i = 0; i < 5; i++) {
    store.consumeQuota(sessionA, "upload");
  }

  assert.strictEqual(store.checkQuota(sessionA, "upload").allowed, false);

  // User B must remain at 5 remaining uploads
  const checkB = store.checkQuota(sessionB, "upload");
  assert.strictEqual(checkB.allowed, true);
  assert.strictEqual(checkB.remaining, 5);
});

test("Daily Quotas - tracks Q&A question quota (20/day) scoped per document", () => {
  const store = new MemoryQuotaStore();
  const sessionId = "session_qa_user";
  const docA = "doc_alpha_123";
  const docB = "doc_beta_456";

  // Exhaust doc A (20 questions)
  for (let i = 0; i < 20; i++) {
    store.consumeQuota(sessionId, "qa", docA);
  }

  // Doc A is over quota
  assert.strictEqual(store.checkQuota(sessionId, "qa", docA).allowed, false);

  // Doc B still has full allowance
  const checkDocB = store.checkQuota(sessionId, "qa", docB);
  assert.strictEqual(checkDocB.allowed, true);
  assert.strictEqual(checkDocB.remaining, 20);
});

test("Rate Limiting - enforces sliding-window burst limits and calculates retryAfter", () => {
  const limiter = new MemoryRateLimiter();
  const sessionId = "session_burst_test";

  // Comparison limit is 3 requests per minute
  assert.strictEqual(RATE_LIMIT_CONFIG.comparisonPerMinute, 3);

  // 3 rapid requests allowed
  for (let i = 0; i < 3; i++) {
    const res = limiter.checkRateLimit(sessionId, "comparison");
    assert.strictEqual(res.allowed, true, `Hit ${i + 1} should be permitted`);
  }

  // 4th burst request must be blocked
  const blocked = limiter.checkRateLimit(sessionId, "comparison");
  assert.strictEqual(blocked.allowed, false, "4th burst request in window must be blocked");
  assert.strictEqual(blocked.remaining, 0);
  assert.ok(blocked.retryAfterSeconds > 0, "Must provide retry hint in seconds");
  assert.ok(blocked.retryAfterSeconds <= 60);
});
