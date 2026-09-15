import { SESSION_CONFIG } from "@/lib/security/quota-config";
import { AiEngineError } from "@/lib/ai/errors";

interface CacheEntry<T> {
  value: T;
  timestamp: number;
}

interface GlobalWithResultCache {
  __lexiguide_server_result_cache__?: ServerResultCache;
}

const g = globalThis as unknown as GlobalWithResultCache;

/**
 * A Promise-aware server-side cache for expensive AI results.
 * Solves two efficiency gaps simultaneously:
 * 1. In-flight Deduplication: If Request B arrives while Request A is computing
 *    for the exact same inputs, B awaits A's promise instead of firing a second AI call.
 * 2. Persistent Reuse: Once resolved, the value is cached securely (isolated by session)
 *    to prevent duplicate AI calls across navigation or re-clicks.
 */
export class ServerResultCache {
  // Stores pending promises for in-flight deduplication
  private pendingPromises = new Map<string, Promise<any>>();

  // Stores resolved results for lifecycle caching
  private resolvedCache = new Map<string, CacheEntry<any>>();

  // 1 hour TTL for AI results (prevents infinite memory growth)
  private readonly TTL_MS = 60 * 60 * 1000;
  private readonly MAX_ENTRIES = 500;

  /**
   * Retrieves a cached result, joins an in-flight computation, or executes a new one.
   */
  public async getOrCompute<T>(
    key: string,
    ownerSessionId: string,
    computeFn: () => Promise<T>
  ): Promise<T> {
    const secureKey = this.buildSecureKey(ownerSessionId, key);

    // 1. Check Resolved Cache
    const existing = this.resolvedCache.get(secureKey);
    if (existing) {
      if (Date.now() - existing.timestamp < this.TTL_MS) {
        console.log(`[SERVER-CACHE] 🟢 HIT (Resolved): ${secureKey}`);
        return existing.value as T;
      } else {
        console.log(`[SERVER-CACHE] 🟡 EXPIRED: ${secureKey}`);
        this.resolvedCache.delete(secureKey);
      }
    }

    // 2. Check In-Flight Promises (Promise Deduplication)
    const pending = this.pendingPromises.get(secureKey);
    if (pending) {
      console.log(`[SERVER-CACHE] 🔵 HIT (In-Flight Join): ${secureKey}`);
      return pending as Promise<T>;
    }

    // 3. Compute (Cache Miss)
    console.log(`[SERVER-CACHE] 🔴 MISS (Computing): ${secureKey}`);
    
    // Enforce size limits before adding
    this.enforceSizeLimit();

    const promise = computeFn()
      .then((result) => {
        // Cache success
        this.resolvedCache.set(secureKey, {
          value: result,
          timestamp: Date.now(),
        });
        return result;
      })
      .finally(() => {
        // Always remove the pending promise once settled (whether success or error)
        this.pendingPromises.delete(secureKey);
      });

    this.pendingPromises.set(secureKey, promise);
    return promise;
  }

  /**
   * Clears cached entries for a specific session to enforce complete isolation.
   */
  public clearSession(ownerSessionId: string): void {
    const prefix = `${ownerSessionId}:`;
    const toDelete: string[] = [];
    
    for (const key of this.resolvedCache.keys()) {
      if (key.startsWith(prefix)) toDelete.push(key);
    }
    for (const key of toDelete) {
      this.resolvedCache.delete(key);
    }
    
    console.log(`[SERVER-CACHE] Cleared ${toDelete.length} resolved entries for session ${ownerSessionId}`);
  }

  /**
   * Invalidate a specific document's cache (e.g., when replaced).
   */
  public invalidateDocument(ownerSessionId: string, documentId: string): void {
    const prefix = `${ownerSessionId}:`;
    const docIdentifier = `:${documentId}`;
    const toDelete: string[] = [];

    for (const key of this.resolvedCache.keys()) {
      if (key.startsWith(prefix) && key.includes(docIdentifier)) {
        toDelete.push(key);
      }
    }
    for (const key of toDelete) {
      this.resolvedCache.delete(key);
    }
    
    console.log(`[SERVER-CACHE] Invalidated ${toDelete.length} entries for doc ${documentId}`);
  }

  /**
   * Exposes raw stats for diagnostics.
   */
  public getStats() {
    this.cleanupExpired();
    return {
      resolvedCount: this.resolvedCache.size,
      inFlightCount: this.pendingPromises.size,
    };
  }

  // --- Private Helpers ---

  private buildSecureKey(sessionId: string, actionKey: string): string {
    return `${sessionId}:${actionKey}`;
  }

  private enforceSizeLimit() {
    if (this.resolvedCache.size >= this.MAX_ENTRIES) {
      this.cleanupExpired();
      
      // If still too large, LRU eviction (Maps iterate in insertion order)
      if (this.resolvedCache.size >= this.MAX_ENTRIES) {
        const oldestKey = this.resolvedCache.keys().next().value;
        if (oldestKey) {
          this.resolvedCache.delete(oldestKey);
        }
      }
    }
  }

  private cleanupExpired() {
    const now = Date.now();
    const toDelete: string[] = [];
    for (const [key, entry] of this.resolvedCache.entries()) {
      if (now - entry.timestamp > this.TTL_MS) {
        toDelete.push(key);
      }
    }
    for (const key of toDelete) {
      this.resolvedCache.delete(key);
    }
  }
}

// Preserve across hot reloads in development
if (!g.__lexiguide_server_result_cache__) {
  g.__lexiguide_server_result_cache__ = new ServerResultCache();
}

export const serverResultCache = g.__lexiguide_server_result_cache__;
