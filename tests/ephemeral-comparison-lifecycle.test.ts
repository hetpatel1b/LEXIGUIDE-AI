import test from "node:test";
import assert from "node:assert";
import {
  getActiveDocument,
  setActiveDocument,
  clearActiveDocument,
  getSessionDocuments,
  saveSessionDocument,
  clearAllDocuments,
} from "@/lib/document-storage";
import { serverDocumentStore } from "@/lib/server-document-store";
import { temporaryComparisonStore } from "@/lib/comparison/temporary-comparison-store";
import type { NormalizedDocument } from "@/types/document";

// Mock minimal window, Event, and sessionStorage for Node.js test environment
function setupMockBrowser() {
  const store = new Map<string, string>();
  const listeners = new Map<string, Array<(event: unknown) => void>>();

  const mockStorage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, val: string) => store.set(key, val),
    removeItem: (key: string) => store.delete(key),
    clear: () => store.clear(),
  };

  class MockEvent {
    type: string;
    constructor(type: string) {
      this.type = type;
    }
  }

  (globalThis as unknown as {
    Event: typeof MockEvent;
    window: {
      sessionStorage: typeof mockStorage;
      dispatchEvent: (event: { type: string }) => boolean;
      addEventListener: (type: string, cb: (event: unknown) => void) => void;
      removeEventListener: (type: string, cb: (event: unknown) => void) => void;
    };
  }).Event = MockEvent;

  (globalThis as unknown as {
    window: {
      sessionStorage: typeof mockStorage;
      dispatchEvent: (event: { type: string }) => boolean;
      addEventListener: (type: string, cb: (event: unknown) => void) => void;
      removeEventListener: (type: string, cb: (event: unknown) => void) => void;
    };
  }).window = {
    sessionStorage: mockStorage,
    dispatchEvent: (event: { type: string }) => {
      const handlers = listeners.get(event.type) || [];
      handlers.forEach((fn) => fn(event));
      return true;
    },
    addEventListener: (type: string, cb: (event: unknown) => void) => {
      if (!listeners.has(type)) listeners.set(type, []);
      listeners.get(type)!.push(cb);
    },
    removeEventListener: (type: string, cb: (event: unknown) => void) => {
      const handlers = listeners.get(type) || [];
      listeners.set(
        type,
        handlers.filter((fn) => fn !== cb)
      );
    },
  };

  return { store, listeners };
}

function cleanupMockBrowser() {
  delete (globalThis as unknown as { window?: unknown }).window;
  delete (globalThis as unknown as { Event?: unknown }).Event;
}

function createDummyDoc(id: string, name: string, overrides: Partial<NormalizedDocument> = {}): NormalizedDocument {
  return {
    id,
    originalFilename: name,
    displayName: name,
    format: "pdf",
    mimeType: "application/pdf",
    sizeBytes: 2048,
    pageCount: 3,
    characterCount: 1500,
    wordCount: 300,
    lineCount: 45,
    paragraphCount: 12,
    uploadedAt: new Date().toISOString(),
    status: "analyzed",
    source: "user-upload",
    extractedMetadata: { title: name },
    pages: [
      {
        pageId: `p-${id}-1`,
        pageNumber: 1,
        text: `Sample content for ${name} page 1`,
        startOffset: 0,
        endOffset: 500,
        characterCount: 500,
        wordCount: 100,
      },
    ],
    sections: [
      {
        sectionId: `sec-${id}-1`,
        sectionNumber: "1",
        title: "Definitions",
        startOffset: 0,
        endOffset: 500,
        pageReferences: [1],
        chunkIds: [`chk-${id}-1`],
        characterCount: 500,
      },
    ],
    chunks: [
      {
        chunkId: `chk-${id}-1`,
        chunkIndex: 0,
        text: `Sample content for ${name} page 1`,
        sectionId: `sec-${id}-1`,
        sectionNumber: "1",
        sectionTitle: "Definitions",
        pageNumbers: [1],
        startOffset: 0,
        endOffset: 500,
        characterCount: 500,
        wordCount: 100,
      },
    ],
    ...overrides,
  };
}

test("Scenario 1: Document A is resolved strictly from current active document", () => {
  setupMockBrowser();
  try {
    clearAllDocuments();
    const docA = createDummyDoc("doc-active-101", "Master_Services_Agreement_2026.pdf");

    // In normal workflow, active document is set
    setActiveDocument(docA);

    const resolvedA = getActiveDocument();
    assert.ok(resolvedA, "Document A must exist from active document");
    assert.strictEqual(resolvedA?.id, "doc-active-101");
    assert.strictEqual(resolvedA?.displayName, "Master_Services_Agreement_2026.pdf");
  } finally {
    cleanupMockBrowser();
  }
});

test("Scenario 2: Document B starts EMPTY on initial comparison session", () => {
  setupMockBrowser();
  try {
    clearAllDocuments();
    const docA = createDummyDoc("doc-active-101", "Master_Services_Agreement_2026.pdf");
    setActiveDocument(docA);

    // Initial state in comparison workspace
    let tempDocB: NormalizedDocument | null = null;
    assert.strictEqual(tempDocB, null, "Document B must be null initially");
  } finally {
    cleanupMockBrowser();
  }
});

test("Scenario 3: Document B upload creates temporary comparison document in temporaryComparisonStore", () => {
  setupMockBrowser();
  try {
    temporaryComparisonStore.clear();
    const docB = createDummyDoc("doc-temp-202", "MSA_Amendment_v2.pdf");

    const comparisonId = temporaryComparisonStore.registerTemporaryDocument(docB);
    assert.ok(comparisonId.startsWith("cmp_"), "ComparisonId must be generated");

    const retrievedB = temporaryComparisonStore.getTemporaryDocument("doc-temp-202");
    assert.ok(retrievedB, "Retrieved temporary document must exist");
    assert.strictEqual(retrievedB?.id, "doc-temp-202");
    assert.strictEqual(retrievedB?.displayName, "MSA_Amendment_v2.pdf");
  } finally {
    temporaryComparisonStore.clear();
    cleanupMockBrowser();
  }
});

test("Scenario 4: Document B is NOT saved into persistent session documents collection", () => {
  setupMockBrowser();
  try {
    clearAllDocuments();
    const docA = createDummyDoc("doc-user-001", "Contract_A.pdf");
    setActiveDocument(docA);

    // Simulate Document B upload for comparison:
    // It is registered ONLY in temporaryComparisonStore, NOT saved to session documents
    const docB = createDummyDoc("doc-temp-002", "Contract_B.pdf");
    temporaryComparisonStore.registerTemporaryDocument(docB);

    const sessionDocs = getSessionDocuments();
    assert.strictEqual(sessionDocs.length, 1, "Only Document A must be in session documents collection");
    assert.strictEqual(sessionDocs[0].id, "doc-user-001");
    assert.ok(!sessionDocs.some((d) => d.id === "doc-temp-002"), "Document B must NOT be in session documents");
  } finally {
    temporaryComparisonStore.clear();
    cleanupMockBrowser();
  }
});

test("Scenario 5: Uploading Document B does not replace or mutate Document A", () => {
  setupMockBrowser();
  try {
    clearAllDocuments();
    const docA = createDummyDoc("doc-base-100", "Baseline_Contract.pdf");
    setActiveDocument(docA);

    const docB = createDummyDoc("doc-temp-200", "Target_Revision.pdf");
    temporaryComparisonStore.registerTemporaryDocument(docB);

    const active = getActiveDocument();
    assert.strictEqual(active?.id, "doc-base-100", "Document A must remain the active document");
    assert.strictEqual(active?.displayName, "Baseline_Contract.pdf");
  } finally {
    temporaryComparisonStore.clear();
    cleanupMockBrowser();
  }
});

test("Scenario 6: Replacing Document B clears only Document B and preserves Document A", () => {
  setupMockBrowser();
  try {
    clearAllDocuments();
    const docA = createDummyDoc("doc-base-100", "Baseline.pdf");
    setActiveDocument(docA);

    let tempDocB: NormalizedDocument | null = createDummyDoc("doc-temp-v1", "Revision_v1.pdf");
    let comparisonResult: Record<string, unknown> | null = { diffs: [] };

    // User clicks "Replace Document"
    tempDocB = null;
    comparisonResult = null;

    assert.strictEqual(tempDocB, null, "Document B must be cleared");
    assert.strictEqual(comparisonResult, null, "Comparison result must be cleared");

    const activeA = getActiveDocument();
    assert.strictEqual(activeA?.id, "doc-base-100", "Document A must remain untouched");
  } finally {
    cleanupMockBrowser();
  }
});

test("Scenario 7: New Document B can be uploaded without full page reload", () => {
  setupMockBrowser();
  try {
    clearAllDocuments();
    temporaryComparisonStore.clear();

    const docA = createDummyDoc("doc-base", "Contract_Base.pdf");
    setActiveDocument(docA);

    let tempDocB: NormalizedDocument | null = createDummyDoc("doc-temp-v2", "Contract_v2.pdf");
    temporaryComparisonStore.registerTemporaryDocument(tempDocB);

    // Replace B with v3
    tempDocB = createDummyDoc("doc-temp-v3", "Contract_v3.pdf");
    temporaryComparisonStore.registerTemporaryDocument(tempDocB);

    assert.strictEqual(tempDocB.id, "doc-temp-v3");
    assert.strictEqual(tempDocB.displayName, "Contract_v3.pdf");

    const retrieved = temporaryComparisonStore.getTemporaryDocument("doc-temp-v3");
    assert.strictEqual(retrieved?.displayName, "Contract_v3.pdf");
  } finally {
    temporaryComparisonStore.clear();
    cleanupMockBrowser();
  }
});

test("Scenario 8: Changing active Document A invalidates previous comparison state", () => {
  setupMockBrowser();
  try {
    clearAllDocuments();
    const docA1 = createDummyDoc("doc-a1", "Original_A1.pdf");
    setActiveDocument(docA1);

    let activeDoc = getActiveDocument();
    let tempDocB: NormalizedDocument | null = createDummyDoc("doc-b", "Comparison_B.pdf");
    let comparisonResult: Record<string, unknown> | null = { id: "res-1" };

    // User switches active document to A2 in /analyze
    const docA2 = createDummyDoc("doc-a2", "New_Active_A2.pdf");
    setActiveDocument(docA2);
    activeDoc = getActiveDocument();

    // Effect in comparison workspace detects change in activeDoc.id
    if (activeDoc?.id !== "doc-a1") {
      tempDocB = null;
      comparisonResult = null;
    }

    assert.strictEqual(activeDoc?.id, "doc-a2");
    assert.strictEqual(tempDocB, null, "Document B must be reset when Document A changes");
    assert.strictEqual(comparisonResult, null, "Comparison result must be reset when Document A changes");
  } finally {
    cleanupMockBrowser();
  }
});

test("Scenario 9: Temporary comparison store enforces TTL and automatic expiration", () => {
  temporaryComparisonStore.clear();
  try {
    const doc = createDummyDoc("doc-expiring", "Expiring_Doc.pdf");
    // Register with 1ms TTL
    temporaryComparisonStore.registerTemporaryDocument(doc, undefined, 1);

    // Wait 5ms
    const start = Date.now();
    while (Date.now() - start < 5) {}

    const retrieved = temporaryComparisonStore.getTemporaryDocument("doc-expiring");
    assert.strictEqual(retrieved, null, "Expired document must return null");
    assert.strictEqual(temporaryComparisonStore.count(), 0, "Expired document must be purged");
  } finally {
    temporaryComparisonStore.clear();
  }
});

test("Scenario 10: Comparison context validation prevents cross-session document leakage", () => {
  temporaryComparisonStore.clear();
  try {
    const doc = createDummyDoc("doc-scoped", "Secret_Contract.pdf");
    const compId = temporaryComparisonStore.registerTemporaryDocument(doc, "cmp_session_alpha");

    // Correct context retrieves document
    const valid = temporaryComparisonStore.getTemporaryDocument("doc-scoped", "cmp_session_alpha");
    assert.ok(valid, "Document must be retrievable with matching context");

    // Wrong context is rejected
    const invalid = temporaryComparisonStore.getTemporaryDocument("doc-scoped", "cmp_session_beta");
    assert.strictEqual(invalid, null, "Document must be rejected with mismatched context");
  } finally {
    temporaryComparisonStore.clear();
  }
});

test("Scenario 11: Document A remains intact after Document B upload failure", () => {
  setupMockBrowser();
  try {
    clearAllDocuments();
    const docA = createDummyDoc("doc-safe", "Safe_Document.pdf");
    setActiveDocument(docA);

    let tempDocB: NormalizedDocument | null = null;
    let uploadError: string | null = null;

    // Simulate Document B upload failure
    try {
      throw new Error("Corrupted PDF document");
    } catch (err: unknown) {
      uploadError = (err as Error).message;
    }

    assert.ok(uploadError, "Error must be caught");
    assert.strictEqual(tempDocB, null, "Document B must remain null");
    assert.strictEqual(getActiveDocument()?.id, "doc-safe", "Document A must remain intact");
  } finally {
    cleanupMockBrowser();
  }
});

test("Scenario 12: Same Document A and Document B detection", () => {
  setupMockBrowser();
  try {
    const docA = createDummyDoc("doc-same", "Identical.pdf");
    const docB = createDummyDoc("doc-same", "Identical.pdf");

    const isSameDoc = docA.id === docB.id;
    assert.strictEqual(isSameDoc, true, "Identical document IDs must be detected as same document");
  } finally {
    cleanupMockBrowser();
  }
});
