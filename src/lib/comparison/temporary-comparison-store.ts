import type { NormalizedDocument } from "@/lib/document-engine/types";
import { isLegacyDemoDocument } from "@/lib/document-storage";

export interface TemporaryComparisonEntry {
  comparisonId: string;
  documentId: string;
  document: NormalizedDocument;
  createdAt: number;
  expiresAt: number;
}

interface GlobalWithTempStore {
  __lexiguide_temporary_comparison_store__?: Map<string, TemporaryComparisonEntry>;
}

const g = globalThis as unknown as GlobalWithTempStore;
if (!g.__lexiguide_temporary_comparison_store__) {
  g.__lexiguide_temporary_comparison_store__ = new Map<string, TemporaryComparisonEntry>();
}

const tempStore = g.__lexiguide_temporary_comparison_store__;

const DEFAULT_TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Ephemeral in-memory store for comparison-scoped Document B.
 * Documents stored here are temporary, never persisted to normal user session documents,
 * and automatically expire after their TTL.
 */
export const temporaryComparisonStore = {
  /**
   * Registers a freshly uploaded comparison document.
   * Returns the comparisonId associated with this upload.
   */
  registerTemporaryDocument(
    doc: NormalizedDocument,
    comparisonId?: string,
    ttlMs: number = DEFAULT_TTL_MS
  ): string {
    if (!doc || !doc.id) {
      throw new Error("Invalid document: missing document or document ID.");
    }

    if (isLegacyDemoDocument(doc)) {
      throw new Error("Legacy demo documents cannot be registered for comparison.");
    }

    // Proactively clean up expired entries
    this.cleanupExpired();

    const compId = comparisonId || `cmp_${Math.random().toString(36).substring(2, 9)}_${Date.now().toString(36)}`;
    const now = Date.now();

    const entry: TemporaryComparisonEntry = {
      comparisonId: compId,
      documentId: doc.id,
      document: doc,
      createdAt: now,
      expiresAt: now + ttlMs,
    };

    tempStore.set(doc.id, entry);
    console.log(
      `[TEMP-COMP-STORE] Registered temporary comparison document id=${doc.id}, name="${doc.displayName}", compId=${compId}, ttl=${ttlMs}ms`
    );

    return compId;
  },

  /**
   * Retrieves a temporary comparison document by its documentId.
   * If comparisonId is provided, validates that the document belongs to that comparison context.
   */
  getTemporaryDocument(docId: string, comparisonId?: string): NormalizedDocument | null {
    if (!docId) return null;

    const entry = tempStore.get(docId);
    if (!entry) return null;

    // Check expiration
    if (Date.now() > entry.expiresAt) {
      tempStore.delete(docId);
      console.log(`[TEMP-COMP-STORE] Expired temporary document removed id=${docId}`);
      return null;
    }

    // Validate comparison context if provided
    if (comparisonId && entry.comparisonId !== comparisonId) {
      console.warn(
        `[TEMP-COMP-STORE] Context mismatch: document ${docId} belongs to ${entry.comparisonId}, not ${comparisonId}`
      );
      return null;
    }

    return entry.document;
  },

  /**
   * Removes a temporary comparison document from the store.
   */
  removeTemporaryDocument(docId: string): void {
    if (!docId) return;
    tempStore.delete(docId);
    console.log(`[TEMP-COMP-STORE] Removed temporary document id=${docId}`);
  },

  /**
   * Removes all temporary documents associated with a specific comparisonId.
   */
  clearComparison(comparisonId: string): void {
    if (!comparisonId) return;
    for (const [id, entry] of tempStore.entries()) {
      if (entry.comparisonId === comparisonId) {
        tempStore.delete(id);
      }
    }
  },

  /**
   * Cleans up all expired entries.
   */
  cleanupExpired(): void {
    const now = Date.now();
    for (const [id, entry] of tempStore.entries()) {
      if (now > entry.expiresAt) {
        tempStore.delete(id);
      }
    }
  },

  /**
   * Returns the count of active (non-expired) temporary documents.
   */
  count(): number {
    this.cleanupExpired();
    return tempStore.size;
  },

  /**
   * Clears all temporary comparison documents.
   */
  clear(): void {
    tempStore.clear();
  },
};
