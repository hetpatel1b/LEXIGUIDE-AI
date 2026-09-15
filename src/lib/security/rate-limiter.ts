import { RATE_LIMIT_CONFIG } from "./quota-config";

export type RateLimitAction = "analysis" | "upload" | "qa" | "comparison";

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
  limit: number;
}

export interface IRateLimiter {
  checkRateLimit(sessionId: string, action: RateLimitAction): RateLimitResult;
  reset(sessionId?: string): void;
}

interface WindowRecord {
  timestamps: number[];
}

interface GlobalWithRateLimiter {
  __lexiguide_rate_limiter__?: IRateLimiter;
}

const g = globalThis as unknown as GlobalWithRateLimiter;

export class MemoryRateLimiter implements IRateLimiter {
  private readonly store = new Map<string, WindowRecord>();

  private getLimitForAction(action: RateLimitAction): number {
    switch (action) {
      case "analysis":
        return RATE_LIMIT_CONFIG.analysisPerMinute;
      case "upload":
        return RATE_LIMIT_CONFIG.uploadPerMinute;
      case "qa":
        return RATE_LIMIT_CONFIG.qaPerMinute;
      case "comparison":
        return RATE_LIMIT_CONFIG.comparisonPerMinute;
      default:
        return 10;
    }
  }

  public checkRateLimit(sessionId: string, action: RateLimitAction): RateLimitResult {
    const now = Date.now();
    const windowMs = RATE_LIMIT_CONFIG.windowMs;
    const limit = this.getLimitForAction(action);
    const key = `${sessionId}:${action}`;

    let record = this.store.get(key);
    if (!record) {
      record = { timestamps: [] };
      this.store.set(key, record);
    }

    // Filter out timestamps outside the sliding window
    record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);

    if (record.timestamps.length >= limit) {
      const oldestInWindow = record.timestamps[0];
      const retryAfterMs = Math.max(1000, windowMs - (now - oldestInWindow));
      const retryAfterSeconds = Math.ceil(retryAfterMs / 1000);

      return {
        allowed: false,
        remaining: 0,
        retryAfterSeconds,
        limit,
      };
    }

    // Record this hit
    record.timestamps.push(now);

    return {
      allowed: true,
      remaining: Math.max(0, limit - record.timestamps.length),
      retryAfterSeconds: 0,
      limit,
    };
  }

  public reset(sessionId?: string): void {
    if (sessionId) {
      for (const key of this.store.keys()) {
        if (key.startsWith(`${sessionId}:`)) {
          this.store.delete(key);
        }
      }
    } else {
      this.store.clear();
    }
  }
}

if (!g.__lexiguide_rate_limiter__) {
  g.__lexiguide_rate_limiter__ = new MemoryRateLimiter();
}

export const rateLimiter = g.__lexiguide_rate_limiter__;
