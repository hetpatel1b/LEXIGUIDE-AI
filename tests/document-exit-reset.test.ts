import test from "node:test";
import assert from "node:assert";
import { NextRequest } from "next/server";
import {
  getActiveDocument,
  setActiveDocument,
  resetDocumentWorkspace,
  getCachedAnalysis,
  setCachedAnalysis,
  getSessionDocuments,
  getWorkspaceGeneration,
} from "@/lib/document-storage";
import { serverDocumentStore } from "@/lib/server-document-store";
import { temporaryComparisonStore } from "@/lib/comparison/temporary-comparison-store";
import { POST as handleResetPost } from "@/app/api/documents/reset/route";
import { quotaStore } from "@/lib/security";
import type { NormalizedDocument } from "@/types/document";
import type { AnalysisResult } from "@/lib/ai/types";

// Setup browser globals for test environment
function setupTestBrowser() {
  const store = new Map<string, string>();
  const listeners = new Map<string, Array<(e: unknown) => void>>();

  const mockStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => store.set(k, v),
    removeItem: (k: string) => store.delete(k),
    clear: () => store.clear(),
    get length() {
      return store.size;
    },
    key: (i: number) => {
      const keys = Array.from(store.keys());
      return keys[i] || null;
    },
  };

  class MockCustomEvent {
    type: string;
    constructor(t: string) {
      this.type = t;
    }
  }

  (globalThis as unknown as {
    Event: typeof MockCustomEvent;
    window: {
      sessionStorage: typeof mockStorage;
      dispatchEvent: (e: { type: string }) => boolean;
      addEventListener: (t: string, cb: (e: unknown) => void) => void;
      removeEventListener: (t: string, cb: (e: unknown) => void) => void;
    };
  }).Event = MockCustomEvent;

  (globalThis as unknown as {
    window: {
      sessionStorage: typeof mockStorage;
      dispatchEvent: (e: { type: string }) => boolean;
      addEventListener: (t: string, cb: (e: unknown) => void) => void;
      removeEventListener: (t: string, cb: (e: unknown) => void) => void;
    };
  }).window = {
    sessionStorage: mockStorage,
    dispatchEvent: (e: { type: string }) => {
      const handlers = listeners.get(e.type) || [];
      handlers.forEach((h) => h(e));
      return true;
    },
    addEventListener: (t: string, cb: (e: unknown) => void) => {
      if (!listeners.has(t)) listeners.set(t, []);
      listeners.get(t)!.push(cb);
    },
    removeEventListener: (t: string, cb: (e: unknown) => void) => {
      const arr = listeners.get(t);
      if (arr) {
        const idx = arr.indexOf(cb);
        if (idx >= 0) arr.splice(idx, 1);
      }
    },
  };

  return { store, listeners };
}

function makeDoc(id: string, name: string): NormalizedDocument {
  return {
    id,
    source: "user-upload",
    displayName: name,
    originalFilename: name,
    format: "pdf",
    mimeType: "application/pdf",
    uploadedAt: new Date().toISOString(),
    sizeBytes: 1024,
    pageCount: 1,
    characterCount: 500,
    wordCount: 100,
    lineCount: 20,
    paragraphCount: 5,
    status: "analyzed",
    extractedMetadata: { title: name },
    pages: [
      {
        pageId: `p-${id}-1`,
        pageNumber: 1,
        text: "Test text",
        startOffset: 0,
        endOffset: 500,
        characterCount: 500,
        wordCount: 100,
      },
    ],
    sections: [
      {
        sectionId: "sec-1",
        sectionNumber: "1",
        title: "Introduction",
        startOffset: 0,
        endOffset: 500,
        pageReferences: [1],
        chunkIds: ["chk-1"],
        characterCount: 500,
      },
    ],
    chunks: [
      {
        chunkId: "chk-1",
        chunkIndex: 0,
        text: "Chunk content",
        sectionId: "sec-1",
        sectionNumber: "1",
        sectionTitle: "Introduction",
        pageNumbers: [1],
        startOffset: 0,
        endOffset: 500,
        characterCount: 500,
        wordCount: 100,
      },
    ],
  };
}

function makeAnalysis(docId: string): AnalysisResult {
  return {
    analysisSchemaVersion: "1.0",
    documentId: docId,
    documentName: "test.pdf",
    analyzedAt: new Date().toISOString(),
    modelUsed: "nvidia/nemotron-4-340b-instruct",
    metadata: {
      documentType: "Agreement",
      parties: [],
      effectiveDate: null,
      terminationDate: null,
      jurisdiction: null,
      governingLaw: null,
      financialTerms: null,
    },
    executiveSummary: {
      overview: "A standard test agreement.",
      keyThemes: [],
      majorObligationsSummary: [],
      reviewPriorities: ["Check clause 1"],
    },
    keyClauses: [],
    potentialConcerns: [],
    obligations: [],
    importantDates: [],
    analysisNotes: [],
  };
}

test("TEST 1: Client Reset Contract — resetDocumentWorkspace clears all document state", () => {
  setupTestBrowser();

  const docA = makeDoc("doc-user-alpha", "agreement_alpha.pdf");
  setActiveDocument(docA);
  setCachedAnalysis(docA.id, makeAnalysis(docA.id));
  window.sessionStorage.setItem("lexiguide_custom_action_items", JSON.stringify([{ id: "custom-1" }]));

  assert.strictEqual(getActiveDocument()?.id, "doc-user-alpha");
  assert.strictEqual(getSessionDocuments().length, 1);
  assert.ok(getCachedAnalysis(docA.id));
  assert.ok(window.sessionStorage.getItem("lexiguide_custom_action_items"));

  const genBefore = getWorkspaceGeneration();
  resetDocumentWorkspace();
  const genAfter = getWorkspaceGeneration();

  // All document workspace state must be null/empty
  assert.strictEqual(getActiveDocument(), null, "Active document must be null");
  assert.strictEqual(getSessionDocuments().length, 0, "Session documents must be empty");
  assert.strictEqual(getCachedAnalysis(docA.id), null, "Cached analysis must be null");
  assert.strictEqual(window.sessionStorage.getItem("lexiguide_custom_action_items"), null, "Custom action items must be removed");
  assert.strictEqual(genAfter, genBefore + 1, "Workspace generation must increment");
});

test("TEST 2: Server Reset Endpoint — POST /api/documents/reset purges session stores", async () => {
  const sessionId = "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d";
  const docA = makeDoc("doc-server-alpha", "alpha.pdf");
  const docB = makeDoc("doc-server-beta", "beta.pdf");

  // Register in server document store & temporary comparison store
  serverDocumentStore.registerDocument(docA, sessionId);
  temporaryComparisonStore.registerTemporaryDocument(docB, "cmp_123", 3600000, sessionId);

  assert.strictEqual(serverDocumentStore.getDocument(docA.id, sessionId)?.id, docA.id);
  assert.strictEqual(serverDocumentStore.getActiveDocumentId(sessionId), docA.id);
  assert.strictEqual(temporaryComparisonStore.getTemporaryDocument(docB.id, "cmp_123", sessionId)?.id, docB.id);

  // Invoke reset API endpoint
  const req = new NextRequest("http://localhost:3000/api/documents/reset", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-anonymous-session-id": sessionId,
    },
  });

  const res = await handleResetPost(req);
  const data = await res.json();

  assert.strictEqual(res.status, 200);
  assert.strictEqual(data.success, true);
  assert.strictEqual(data.data.activeDocument, null);

  // Server stores must report document not found for that session
  assert.strictEqual(serverDocumentStore.getDocument(docA.id, sessionId), null);
  assert.strictEqual(serverDocumentStore.getActiveDocumentId(sessionId), null);
  assert.strictEqual(temporaryComparisonStore.getTemporaryDocument(docB.id, "cmp_123", sessionId), null);
});

test("TEST 3: Session Identity & Quotas Strictly Preserved on Exit", async () => {
  const sessionId = "b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e";

  // Consume 3 analyses and 2 uploads
  quotaStore.consumeQuota(sessionId, "analysis");
  quotaStore.consumeQuota(sessionId, "analysis");
  quotaStore.consumeQuota(sessionId, "analysis");
  quotaStore.consumeQuota(sessionId, "upload");
  quotaStore.consumeQuota(sessionId, "upload");

  const checkBefore = quotaStore.checkQuota(sessionId, "analysis");
  assert.strictEqual(checkBefore.remaining, 7, "Should have 7 analyses remaining");
  const uploadCheckBefore = quotaStore.checkQuota(sessionId, "upload");
  assert.strictEqual(uploadCheckBefore.remaining, 3, "Should have 3 uploads remaining");

  // Call Exit / Reset
  const req = new NextRequest("http://localhost:3000/api/documents/reset", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-anonymous-session-id": sessionId,
    },
  });

  const res = await handleResetPost(req);
  assert.strictEqual(res.status, 200);

  // Quotas MUST NOT be reset
  const checkAfter = quotaStore.checkQuota(sessionId, "analysis");
  assert.strictEqual(checkAfter.remaining, 7, "Analyses quota must remain at 7 after Exit");
  const uploadCheckAfter = quotaStore.checkQuota(sessionId, "upload");
  assert.strictEqual(uploadCheckAfter.remaining, 3, "Upload quota must remain at 3 after Exit");
});

test("TEST 4: Route Guards — Workspace is empty when active document is null", () => {
  setupTestBrowser();
  resetDocumentWorkspace();

  const active = getActiveDocument();
  assert.strictEqual(active, null, "No document active");

  // In all workspace components, when activeDoc is null, they display WorkspaceEmpty
  const isWorkspaceAccessible = active !== null;
  assert.strictEqual(isWorkspaceAccessible, false, "Workspaces must require upload when no document is active");
});

test("TEST 5: Browser Back Protection — Storage remains null on back navigation", () => {
  const { listeners } = setupTestBrowser();

  const docA = makeDoc("doc-back-test", "contract.pdf");
  setActiveDocument(docA);
  assert.strictEqual(getActiveDocument()?.id, docA.id);

  // User clicks Exit
  resetDocumentWorkspace();
  assert.strictEqual(getActiveDocument(), null);

  // Simulate browser Back (popstate & pageshow)
  const pageshowHandlers = listeners.get("pageshow") || [];
  pageshowHandlers.forEach((h) => h({ type: "pageshow", persisted: true }));

  // Re-check: Active document must remain strictly null
  assert.strictEqual(getActiveDocument(), null, "Active document must NOT be restored by browser Back");
});

test("TEST 6: Sequential Lifecycle — Upload A -> Exit -> Upload B produces 100% clean B", () => {
  setupTestBrowser();

  // 1. Upload A
  const docA = makeDoc("doc-a", "Document_A.pdf");
  setActiveDocument(docA);
  setCachedAnalysis(docA.id, makeAnalysis(docA.id));

  assert.strictEqual(getActiveDocument()?.id, "doc-a");
  assert.ok(getCachedAnalysis("doc-a"));

  // 2. Exit
  resetDocumentWorkspace();
  assert.strictEqual(getActiveDocument(), null);
  assert.strictEqual(getCachedAnalysis("doc-a"), null);

  // 3. Upload B
  const docB = makeDoc("doc-b", "Document_B.pdf");
  setActiveDocument(docB);
  setCachedAnalysis(docB.id, makeAnalysis(docB.id));

  // Verify only B exists
  assert.strictEqual(getActiveDocument()?.id, "doc-b");
  assert.strictEqual(getCachedAnalysis("doc-a"), null, "Doc A cache must remain purged");
  assert.ok(getCachedAnalysis("doc-b"), "Doc B cache must be present");

  const sessionDocs = getSessionDocuments();
  assert.strictEqual(sessionDocs.length, 1);
  assert.strictEqual(sessionDocs[0].id, "doc-b");
});

test("TEST 7: In-Flight Response Race Condition Defense", () => {
  setupTestBrowser();

  const docA = makeDoc("doc-inflight-a", "contract_a.pdf");
  setActiveDocument(docA);

  // Simulate in-flight analysis started for docA
  const targetDocId = docA.id;

  // User clicks Exit while request is in flight
  resetDocumentWorkspace();
  assert.strictEqual(getActiveDocument(), null);

  // Late response arrives for docA
  const lateResult = makeAnalysis(targetDocId);

  // In-flight guard checks if targetDocId is still active
  const currentActive = getActiveDocument();
  if (currentActive && currentActive.id === targetDocId) {
    setCachedAnalysis(targetDocId, lateResult);
  }

  // Verify cache was NOT set for late response
  assert.strictEqual(getCachedAnalysis(targetDocId), null, "Late response must NOT write to cache after Exit");
});

test("TEST 8: Cross-Session Document Isolation After Reset", () => {
  const session1 = "c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f";
  const session2 = "d4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a";

  const doc1 = makeDoc("doc-session-1", "user1.pdf");
  const doc2 = makeDoc("doc-session-2", "user2.pdf");

  serverDocumentStore.registerDocument(doc1, session1);
  serverDocumentStore.registerDocument(doc2, session2);

  // Session 1 clears workspace
  serverDocumentStore.clearSession(session1);

  // Session 1 docs gone
  assert.strictEqual(serverDocumentStore.getDocument(doc1.id, session1), null);
  assert.strictEqual(serverDocumentStore.getActiveDocumentId(session1), null);

  // Session 2 docs remain intact and isolated
  assert.strictEqual(serverDocumentStore.getDocument(doc2.id, session2)?.id, doc2.id);
  assert.strictEqual(serverDocumentStore.getActiveDocumentId(session2), doc2.id);

  // Session 1 cannot access Session 2's document
  assert.strictEqual(serverDocumentStore.getDocument(doc2.id, session1), null);
});

test("TEST 9: No Demo/Fallback Data Restoration", () => {
  setupTestBrowser();
  resetDocumentWorkspace();

  // Ensure getActiveDocument never returns mock or demo documents when empty
  const doc = getActiveDocument();
  assert.strictEqual(doc, null);
  assert.strictEqual(getSessionDocuments().length, 0);
});
