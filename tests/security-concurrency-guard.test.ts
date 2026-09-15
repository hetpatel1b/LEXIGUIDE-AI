import test from "node:test";
import assert from "node:assert";
import { ConcurrencyGuard } from "@/lib/security/concurrency-guard";

test("Concurrency Guard - prevents simultaneous identical operations for the same session", () => {
  const guard = new ConcurrencyGuard();
  const sessionId = "session_concurrency_01";

  // First operation acquires lock
  const firstAcquire = guard.acquire(sessionId, "analysis", "doc_101");
  assert.strictEqual(firstAcquire, true, "First request must acquire lock");
  assert.strictEqual(guard.isLocked(sessionId, "analysis", "doc_101"), true);

  // Simultaneous second click/call for same doc is rejected
  const duplicateAcquire = guard.acquire(sessionId, "analysis", "doc_101");
  assert.strictEqual(
    duplicateAcquire,
    false,
    "Simultaneous duplicate request must be rejected"
  );

  // Different doc for same session is permitted
  const diffDocAcquire = guard.acquire(sessionId, "analysis", "doc_102");
  assert.strictEqual(
    diffDocAcquire,
    true,
    "Independent document operation should be permitted"
  );

  // Release first lock
  guard.release(sessionId, "analysis", "doc_101");
  assert.strictEqual(guard.isLocked(sessionId, "analysis", "doc_101"), false);

  // After release, new operation can acquire lock
  const afterReleaseAcquire = guard.acquire(sessionId, "analysis", "doc_101");
  assert.strictEqual(
    afterReleaseAcquire,
    true,
    "Operation should be able to acquire lock after previous one completes"
  );
});
