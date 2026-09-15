import { SESSION_CONFIG } from "./quota-config";

interface LockEntry {
  acquiredAt: number;
}

interface GlobalWithConcurrencyGuard {
  __lexiguide_concurrency_guard__?: ConcurrencyGuard;
}

const g = globalThis as unknown as GlobalWithConcurrencyGuard;

export class ConcurrencyGuard {
  private readonly activeLocks = new Map<string, LockEntry>();

  private buildKey(sessionId: string, action: string, resourceId?: string): string {
    return `${sessionId}:${action}:${resourceId || "default"}`;
  }

  /**
   * Attempts to acquire an in-flight lock for an operation.
   * Returns true if lock was successfully acquired.
   * Returns false if an identical operation is already running.
   */
  public acquire(sessionId: string, action: string, resourceId?: string): boolean {
    const key = this.buildKey(sessionId, action, resourceId);
    const now = Date.now();
    const existing = this.activeLocks.get(key);

    if (existing) {
      // Check if lock has timed out (auto-recovery from crashes)
      if (now - existing.acquiredAt < SESSION_CONFIG.inFlightLockTtlMs) {
        return false; // Still actively running
      }
    }

    this.activeLocks.set(key, { acquiredAt: now });
    return true;
  }

  /**
   * Releases the in-flight lock upon operation completion (or failure).
   */
  public release(sessionId: string, action: string, resourceId?: string): void {
    const key = this.buildKey(sessionId, action, resourceId);
    this.activeLocks.delete(key);
  }

  /**
   * Checks if an operation is currently locked.
   */
  public isLocked(sessionId: string, action: string, resourceId?: string): boolean {
    const key = this.buildKey(sessionId, action, resourceId);
    const existing = this.activeLocks.get(key);
    if (!existing) return false;
    return Date.now() - existing.acquiredAt < SESSION_CONFIG.inFlightLockTtlMs;
  }

  /**
   * Resets all locks.
   */
  public reset(): void {
    this.activeLocks.clear();
  }
}

if (!g.__lexiguide_concurrency_guard__) {
  g.__lexiguide_concurrency_guard__ = new ConcurrencyGuard();
}

export const concurrencyGuard = g.__lexiguide_concurrency_guard__;
