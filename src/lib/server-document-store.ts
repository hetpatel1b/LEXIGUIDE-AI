import type { NormalizedDocument } from "@/lib/document-engine/types";
import { isLegacyDemoDocument } from "./document-storage";

interface GlobalWithDocStore {
  __lexiguide_server_doc_store__?: Map<string, NormalizedDocument>;
}

const g = globalThis as unknown as GlobalWithDocStore;
if (!g.__lexiguide_server_doc_store__) {
  g.__lexiguide_server_doc_store__ = new Map<string, NormalizedDocument>();
}

const store = g.__lexiguide_server_doc_store__;

/**
 * Server-side in-memory registry of authoritative NormalizedDocuments.
 * Populated automatically when documents are uploaded and processed through
 * /api/documents/process.
 */
export const serverDocumentStore = {
  /**
   * Registers a processed NormalizedDocument in the server store.
   */
  registerDocument(doc: NormalizedDocument): void {
    if (!doc || !doc.id) return;
    if (isLegacyDemoDocument(doc)) {
      console.warn(`[DOC-STORE] Rejected legacy/fixture document registration: ${doc.id}`);
      return;
    }
    store.set(doc.id, doc);
    console.log(`[DOC-STORE] Registered document id=${doc.id}, name="${doc.displayName}", chunks=${doc.chunks?.length}`);
  },

  /**
   * Retrieves a document by its authoritative documentId.
   */
  getDocument(docId: string): NormalizedDocument | null {
    if (!docId) return null;
    const doc = store.get(docId) || null;
    if (doc && isLegacyDemoDocument(doc)) {
      store.delete(docId);
      return null;
    }
    return doc;
  },

  /**
   * Checks if a document exists in the server store.
   */
  hasDocument(docId: string): boolean {
    if (!docId) return false;
    return store.has(docId);
  },

  /**
   * Removes a document from the server store.
   */
  removeDocument(docId: string): void {
    store.delete(docId);
  },

  /**
   * Clears all documents from the store.
   */
  clear(): void {
    store.clear();
  },

  /**
   * Returns total count of registered documents.
   */
  count(): number {
    return store.size;
  },
};
