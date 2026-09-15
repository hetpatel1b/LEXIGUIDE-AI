import type { NormalizedDocument } from "@/lib/document-engine/types";
import { isLegacyDemoDocument } from "./document-storage";

export interface StoredServerDocument {
  document: NormalizedDocument;
  ownerSessionId?: string;
  registeredAt: number;
  lastAccessedAt: number;
}

interface GlobalWithDocStore {
  __lexiguide_server_doc_store__?: Map<string, StoredServerDocument>;
  __lexiguide_server_active_doc_map__?: Map<string, string>;
}

const g = globalThis as unknown as GlobalWithDocStore;
if (!g.__lexiguide_server_doc_store__) {
  g.__lexiguide_server_doc_store__ = new Map<string, StoredServerDocument>();
}
if (!g.__lexiguide_server_active_doc_map__) {
  g.__lexiguide_server_active_doc_map__ = new Map<string, string>();
}

const store = g.__lexiguide_server_doc_store__;
const activeSessionMap = g.__lexiguide_server_active_doc_map__;

const DEFAULT_SERVER_DOC_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours of inactivity

/**
 * Server-side in-memory registry of authoritative NormalizedDocuments.
 * Populated automatically when documents are uploaded and processed through
 * /api/documents/process.
 *
 * Enforces strict session ownership: documents belonging to session A cannot
 * be retrieved or operated on by session B.
 */
export const serverDocumentStore = {
  /**
   * Registers a processed NormalizedDocument in the server store associated with an owner session.
   * Automatically sets this document as the active workspace document for the owner session.
   */
  registerDocument(doc: NormalizedDocument, ownerSessionId?: string): void {
    if (!doc || !doc.id) return;
    if (isLegacyDemoDocument(doc)) {
      console.warn(`[DOC-STORE] Rejected legacy/fixture document registration: ${doc.id}`);
      return;
    }

    this.cleanupExpired();

    const now = Date.now();
    const normalizedOwner = ownerSessionId ? ownerSessionId.toLowerCase() : undefined;
    store.set(doc.id, {
      document: doc,
      ownerSessionId: normalizedOwner,
      registeredAt: now,
      lastAccessedAt: now,
    });

    if (normalizedOwner) {
      activeSessionMap.set(normalizedOwner, doc.id);
    }

    console.log(
      `[DOC-STORE] Registered document id=${doc.id}, name="${doc.displayName}", chunks=${doc.chunks?.length}, owner=${normalizedOwner || "unscoped"}`
    );
  },

  /**
   * Retrieves a document by its authoritative documentId with session ownership verification.
   * If requestingSessionId is provided and the document has an owner, verifies that they match.
   * Cross-session unauthorized access is rejected (returns null).
   */
  getDocument(docId: string, requestingSessionId?: string): NormalizedDocument | null {
    if (!docId) return null;
    const entry = store.get(docId) || null;
    if (!entry) return null;

    if (entry.document && isLegacyDemoDocument(entry.document)) {
      store.delete(docId);
      return null;
    }

    // Check expiration (24h of inactivity)
    if (Date.now() - entry.lastAccessedAt > DEFAULT_SERVER_DOC_TTL_MS) {
      store.delete(docId);
      console.log(`[DOC-STORE] Expired document removed due to inactivity: ${docId}`);
      return null;
    }

    // Verify session authorization
    if (requestingSessionId && entry.ownerSessionId) {
      const normalizedReqSession = requestingSessionId.toLowerCase();
      if (entry.ownerSessionId !== normalizedReqSession) {
        console.warn(
          `[DOC-STORE-SECURITY] Cross-session document access REJECTED: docId=${docId}, requestedBy=${normalizedReqSession}, owner=${entry.ownerSessionId}`
        );
        return null;
      }
    }

    // Update last accessed time
    entry.lastAccessedAt = Date.now();
    return entry.document;
  },

  /**
   * Checks if a document exists and is authorized for the requesting session.
   */
  hasDocument(docId: string, requestingSessionId?: string): boolean {
    return this.getDocument(docId, requestingSessionId) !== null;
  },

  /**
   * Returns the owner session ID of a document.
   */
  getOwnerSessionId(docId: string): string | undefined {
    return store.get(docId)?.ownerSessionId;
  },

  /**
   * Sets the active document ID for a given session.
   */
  setActiveDocumentId(ownerSessionId: string, docId: string): void {
    if (!ownerSessionId || !docId) return;
    activeSessionMap.set(ownerSessionId.toLowerCase(), docId);
  },

  /**
   * Gets the active document ID for a given session.
   */
  getActiveDocumentId(ownerSessionId: string): string | null {
    if (!ownerSessionId) return null;
    return activeSessionMap.get(ownerSessionId.toLowerCase()) || null;
  },

  /**
   * Retrieves the currently active NormalizedDocument for a given session.
   */
  getActiveDocument(ownerSessionId: string): NormalizedDocument | null {
    const docId = this.getActiveDocumentId(ownerSessionId);
    if (!docId) return null;
    return this.getDocument(docId, ownerSessionId);
  },

  /**
   * Clears the active document pointer for a given session.
   */
  clearActiveDocument(ownerSessionId: string): void {
    if (!ownerSessionId) return;
    activeSessionMap.delete(ownerSessionId.toLowerCase());
  },

  /**
   * Completely clears all documents and active workspace pointers for a given session.
   * Leaves anonymous session identity and quotas untouched.
   */
  clearSession(ownerSessionId: string): number {
    if (!ownerSessionId) return 0;
    const normalizedOwner = ownerSessionId.toLowerCase();
    activeSessionMap.delete(normalizedOwner);

    let removedCount = 0;
    for (const [id, entry] of store.entries()) {
      if (entry.ownerSessionId === normalizedOwner) {
        store.delete(id);
        removedCount++;
      }
    }

    console.log(
      `[DOC-STORE] Cleared workspace session ${normalizedOwner}, removed ${removedCount} documents`
    );
    return removedCount;
  },

  /**
   * Removes a document from the server store.
   */
  removeDocument(docId: string): void {
    store.delete(docId);
  },

  /**
   * Cleans up all inactive entries older than 24h.
   */
  cleanupExpired(): void {
    const now = Date.now();
    for (const [id, entry] of store.entries()) {
      if (now - entry.lastAccessedAt > DEFAULT_SERVER_DOC_TTL_MS) {
        store.delete(id);
      }
    }
  },

  /**
   * Clears all documents and active workspace maps from the store.
   */
  clear(): void {
    store.clear();
    activeSessionMap.clear();
  },

  /**
   * Returns total count of registered documents.
   */
  count(): number {
    this.cleanupExpired();
    return store.size;
  },
};

