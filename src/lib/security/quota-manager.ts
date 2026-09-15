import { QUOTA_CONFIG } from "./quota-config";

export type QuotaAction = "analysis" | "upload" | "comparison" | "qa";

export interface QuotaCheckResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetTimeMs: number;
  retryAfterSeconds: number;
}

export interface IQuotaStore {
  checkQuota(sessionId: string, action: QuotaAction, contextId?: string): QuotaCheckResult;
  consumeQuota(sessionId: string, action: QuotaAction, contextId?: string): void;
  reset(sessionId?: string): void;
}

interface SessionDailyUsage {
  dayKey: string;
  analyses: number;
  uploads: number;
  comparisons: number;
  qaByDocument: Map<string, number>;
}

interface GlobalWithQuotaStore {
  __lexiguide_quota_store__?: IQuotaStore;
}

const g = globalThis as unknown as GlobalWithQuotaStore;

function getTodayUtcKey(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-${String(now.getUTCDate()).padStart(2, "0")}`;
}

function getMsUntilUtcMidnight(): number {
  const now = new Date();
  const tomorrow = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  return Math.max(1000, tomorrow.getTime() - now.getTime());
}

export class MemoryQuotaStore implements IQuotaStore {
  private readonly usageMap = new Map<string, SessionDailyUsage>();

  private getOrInitUsage(sessionId: string): SessionDailyUsage {
    const today = getTodayUtcKey();
    let usage = this.usageMap.get(sessionId);

    if (!usage || usage.dayKey !== today) {
      usage = {
        dayKey: today,
        analyses: 0,
        uploads: 0,
        comparisons: 0,
        qaByDocument: new Map<string, number>(),
      };
      this.usageMap.set(sessionId, usage);
    }

    return usage;
  }

  private getLimit(action: QuotaAction): number {
    switch (action) {
      case "analysis":
        return QUOTA_CONFIG.analysesPerDay;
      case "upload":
        return QUOTA_CONFIG.uploadsPerDay;
      case "comparison":
        return QUOTA_CONFIG.comparisonsPerDay;
      case "qa":
        return QUOTA_CONFIG.questionsPerDocumentPerDay;
      default:
        return 10;
    }
  }

  public checkQuota(
    sessionId: string,
    action: QuotaAction,
    contextId?: string
  ): QuotaCheckResult {
    const usage = this.getOrInitUsage(sessionId);
    const limit = this.getLimit(action);
    const resetTimeMs = getMsUntilUtcMidnight();
    const retryAfterSeconds = Math.ceil(resetTimeMs / 1000);

    let currentCount = 0;
    if (action === "analysis") currentCount = usage.analyses;
    else if (action === "upload") currentCount = usage.uploads;
    else if (action === "comparison") currentCount = usage.comparisons;
    else if (action === "qa") {
      const docKey = contextId || "global";
      currentCount = usage.qaByDocument.get(docKey) || 0;
    }

    const remaining = Math.max(0, limit - currentCount);
    const allowed = currentCount < limit;

    return {
      allowed,
      remaining,
      limit,
      resetTimeMs,
      retryAfterSeconds,
    };
  }

  public consumeQuota(
    sessionId: string,
    action: QuotaAction,
    contextId?: string
  ): void {
    const usage = this.getOrInitUsage(sessionId);

    if (action === "analysis") usage.analyses += 1;
    else if (action === "upload") usage.uploads += 1;
    else if (action === "comparison") usage.comparisons += 1;
    else if (action === "qa") {
      const docKey = contextId || "global";
      const count = usage.qaByDocument.get(docKey) || 0;
      usage.qaByDocument.set(docKey, count + 1);
    }
  }

  public reset(sessionId?: string): void {
    if (sessionId) {
      this.usageMap.delete(sessionId);
    } else {
      this.usageMap.clear();
    }
  }
}

if (!g.__lexiguide_quota_store__) {
  g.__lexiguide_quota_store__ = new MemoryQuotaStore();
}

export const quotaStore = g.__lexiguide_quota_store__;

/**
 * Returns a user-friendly, non-technical quota error message and remediation suggestion.
 * Never leaks internal keys, counts, or server implementation details.
 */
export function getQuotaErrorMessage(
  action: QuotaAction,
  limit: number
): { code: string; message: string; suggestion: string } {
  switch (action) {
    case "analysis":
      return {
        code: "DAILY_QUOTA_EXCEEDED",
        message: `Daily document analysis limit reached (${limit}/day).`,
        suggestion: "You can continue using LexiGuide AI when your daily allowance resets at UTC midnight.",
      };
    case "upload":
      return {
        code: "DAILY_QUOTA_EXCEEDED",
        message: `Daily document upload limit reached (${limit}/day).`,
        suggestion: "You can continue uploading documents when your daily allowance resets at UTC midnight.",
      };
    case "comparison":
      return {
        code: "DAILY_QUOTA_EXCEEDED",
        message: `Daily document comparison limit reached (${limit}/day).`,
        suggestion: "You can continue comparing documents when your daily allowance resets at UTC midnight.",
      };
    case "qa":
      return {
        code: "DAILY_QUOTA_EXCEEDED",
        message: `Daily question limit reached for this document (${limit} questions/day).`,
        suggestion: "You can ask more questions about this document when your daily allowance resets at UTC midnight.",
      };
  }
}
