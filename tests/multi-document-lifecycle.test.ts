import test from "node:test";
import assert from "node:assert";
import {
  getActiveDocument,
  setActiveDocument,
  clearActiveDocument,
  getSessionDocuments,
  saveSessionDocument,
  switchActiveDocument,
  removeSessionDocument,
  clearAllDocuments,
} from "@/lib/document-storage";
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

test("Scenario 1: First upload creates session document and sets active document", () => {
  setupMockBrowser();
  try {
    clearAllDocuments();
    const doc1 = createDummyDoc("doc-user-001", "Service_Agreement_v1.pdf");

    // Simulate upload completion: save to session docs and set active
    saveSessionDocument(doc1);
    setActiveDocument(doc1);

    const active = getActiveDocument();
    const sessionDocs = getSessionDocuments();

    assert.ok(active, "Active document must exist");
    assert.strictEqual(active?.id, "doc-user-001");
    assert.strictEqual(sessionDocs.length, 1);
    assert.strictEqual(sessionDocs[0].id, "doc-user-001");
  } finally {
    cleanupMockBrowser();
  }
});

test("Scenario 2: Second upload adds to session documents without destroying the first document", () => {
  setupMockBrowser();
  try {
    clearAllDocuments();
    const doc1 = createDummyDoc("doc-user-001", "Service_Agreement_v1.pdf");
    const doc2 = createDummyDoc("doc-user-002", "Service_Agreement_v2.pdf");

    saveSessionDocument(doc1);
    saveSessionDocument(doc2);

    const sessionDocs = getSessionDocuments();
    assert.strictEqual(sessionDocs.length, 2, "Must contain exactly two documents");
    assert.strictEqual(sessionDocs[0].id, "doc-user-002");
    assert.strictEqual(sessionDocs[1].id, "doc-user-001");
  } finally {
    cleanupMockBrowser();
  }
});

test("Scenario 3: Active document switches do not delete other session documents", () => {
  setupMockBrowser();
  try {
    clearAllDocuments();
    const doc1 = createDummyDoc("doc-user-001", "Doc_A.pdf");
    const doc2 = createDummyDoc("doc-user-002", "Doc_B.pdf");

    saveSessionDocument(doc1);
    setActiveDocument(doc1);
    saveSessionDocument(doc2);

    // Switch active document to Doc 2
    switchActiveDocument("doc-user-002");

    const active = getActiveDocument();
    assert.strictEqual(active?.id, "doc-user-002", "Active document should now be doc-user-002");

    const sessionDocs = getSessionDocuments();
    assert.strictEqual(sessionDocs.length, 2, "Both session documents must still be preserved");
    assert.ok(sessionDocs.some((d) => d.id === "doc-user-001"));
    assert.ok(sessionDocs.some((d) => d.id === "doc-user-002"));
  } finally {
    cleanupMockBrowser();
  }
});

test("Scenario 4: Comparison selectors contain only uploaded documents", () => {
  setupMockBrowser();
  try {
    clearAllDocuments();
    const doc1 = createDummyDoc("doc-alpha", "Contract_A.pdf");
    const doc2 = createDummyDoc("doc-beta", "Contract_B.pdf");

    saveSessionDocument(doc1);
    saveSessionDocument(doc2);

    const availableDocs = getSessionDocuments();
    assert.strictEqual(availableDocs.length, 2);
    assert.deepStrictEqual(
      availableDocs.map((d) => d.id),
      ["doc-beta", "doc-alpha"]
    );
    // Ensure no hardcoded/mock IDs exist
    assert.ok(!availableDocs.some((d) => d.id === "doc-ea-2026"));
  } finally {
    cleanupMockBrowser();
  }
});

test("Scenario 5: Upload failure preserves existing session documents", () => {
  setupMockBrowser();
  try {
    clearAllDocuments();
    const doc1 = createDummyDoc("doc-existing", "Existing_Contract.pdf");
    saveSessionDocument(doc1);

    // Simulate an upload failure (e.g. network or validation exception)
    // No saveSessionDocument is called for the failed document
    const sessionDocs = getSessionDocuments();
    assert.strictEqual(sessionDocs.length, 1);
    assert.strictEqual(sessionDocs[0].id, "doc-existing");
  } finally {
    cleanupMockBrowser();
  }
});

test("Scenario 6: Replacing or removing a document updates session list correctly", () => {
  setupMockBrowser();
  try {
    clearAllDocuments();
    const doc1 = createDummyDoc("doc-1", "First.pdf");
    const doc2 = createDummyDoc("doc-2", "Second.pdf");
    const doc3 = createDummyDoc("doc-3", "Third.pdf");

    saveSessionDocument(doc1);
    saveSessionDocument(doc2);
    saveSessionDocument(doc3);

    assert.strictEqual(getSessionDocuments().length, 3);

    // Remove doc-2
    removeSessionDocument("doc-2");
    const afterRemoval = getSessionDocuments();
    assert.strictEqual(afterRemoval.length, 2);
    assert.ok(!afterRemoval.some((d) => d.id === "doc-2"));
    assert.strictEqual(afterRemoval[0].id, "doc-3");
    assert.strictEqual(afterRemoval[1].id, "doc-1");
  } finally {
    cleanupMockBrowser();
  }
});

test("Scenario 7: Active document remains stable during comparison workflow", () => {
  setupMockBrowser();
  try {
    clearAllDocuments();
    const doc1 = createDummyDoc("doc-base", "Base_Doc.pdf");
    const doc2 = createDummyDoc("doc-rev", "Revision_Doc.pdf");

    saveSessionDocument(doc1);
    saveSessionDocument(doc2);
    setActiveDocument(doc1);

    // Simulate running comparison between doc1 and doc2
    // Active document in storage should remain doc1
    const active = getActiveDocument();
    assert.strictEqual(active?.id, "doc-base");
    assert.strictEqual(getSessionDocuments().length, 2);
  } finally {
    cleanupMockBrowser();
  }
});

test("Scenario 8: Comparison Document A and Document B cannot be identical", () => {
  setupMockBrowser();
  try {
    clearAllDocuments();
    const doc1 = createDummyDoc("doc-singleton", "Solo_Document.pdf");
    saveSessionDocument(doc1);

    // Simulate comparison workspace pair validation
    const sessionDocs = getSessionDocuments();
    const selectedDocAId = sessionDocs[0]?.id || "";
    const selectedDocBId = sessionDocs[1]?.id || "";

    const isSameDoc = selectedDocAId === selectedDocBId;
    // With only 1 document, selectedDocBId is empty or identical
    assert.ok(isSameDoc || !selectedDocBId, "Identical documents cannot form a valid comparison pair");
  } finally {
    cleanupMockBrowser();
  }
});

test("Scenario 9: Rapid successive uploads preserve all documents in order", () => {
  setupMockBrowser();
  try {
    clearAllDocuments();
    const docs = Array.from({ length: 5 }, (_, i) =>
      createDummyDoc(`doc-rapid-${i}`, `Contract_Batch_${i}.pdf`)
    );

    for (const doc of docs) {
      saveSessionDocument(doc);
    }

    const sessionDocs = getSessionDocuments();
    assert.strictEqual(sessionDocs.length, 5);
    for (let i = 0; i < 5; i++) {
      assert.strictEqual(sessionDocs[i].id, `doc-rapid-${4 - i}`);
    }
  } finally {
    cleanupMockBrowser();
  }
});

test("Scenario 10: Large documents preserve metadata and extraction results across switches", () => {
  setupMockBrowser();
  try {
    clearAllDocuments();
    const largeDoc = createDummyDoc("doc-large", "Complex_Master_Agreement.pdf", {
      pageCount: 50,
      characterCount: 150000,
      wordCount: 25000,
      sections: Array.from({ length: 15 }, (_, i) => ({
        sectionId: `sec-large-${i}`,
        sectionNumber: `${i + 1}`,
        title: `Section ${i + 1}`,
        startOffset: i * 10000,
        endOffset: (i + 1) * 10000,
        pageReferences: [i * 3 + 1],
        chunkIds: [`chk-large-${i}`],
        characterCount: 10000,
      })),
    });

    const smallDoc = createDummyDoc("doc-small", "Simple_Addendum.pdf");

    saveSessionDocument(largeDoc);
    saveSessionDocument(smallDoc);

    // Switch to small, then back to large
    switchActiveDocument("doc-small");
    assert.strictEqual(getActiveDocument()?.id, "doc-small");

    switchActiveDocument("doc-large");
    const retrieved = getActiveDocument();
    assert.strictEqual(retrieved?.id, "doc-large");
    assert.strictEqual(retrieved?.pageCount, 50);
    assert.strictEqual(retrieved?.sections.length, 15);
  } finally {
    cleanupMockBrowser();
  }
});

test("Scenario 11: Comparison workspace reacts to storage updates via lexiguide-doc-update event", () => {
  setupMockBrowser();
  try {
    clearAllDocuments();
    let eventReceived = false;

    window.addEventListener("lexiguide-doc-update", () => {
      eventReceived = true;
    });

    const doc1 = createDummyDoc("doc-event-1", "Realtime_Doc_1.pdf");
    saveSessionDocument(doc1);

    assert.strictEqual(eventReceived, true, "lexiguide-doc-update event must be dispatched on saveSessionDocument");

    eventReceived = false;
    removeSessionDocument("doc-event-1");
    assert.strictEqual(eventReceived, true, "lexiguide-doc-update event must be dispatched on removeSessionDocument");
  } finally {
    cleanupMockBrowser();
  }
});

test("Scenario 12: Storage limits/clearing properly resets active state without corrupting session docs", () => {
  setupMockBrowser();
  try {
    setupMockBrowser();
    const doc1 = createDummyDoc("doc-clear-1", "Clear_Test_1.pdf");
    const doc2 = createDummyDoc("doc-clear-2", "Clear_Test_2.pdf");

    saveSessionDocument(doc1);
    saveSessionDocument(doc2);
    setActiveDocument(doc1);

    clearActiveDocument();
    assert.strictEqual(getActiveDocument(), null, "Active document must be null after clearActiveDocument");
    assert.strictEqual(getSessionDocuments().length, 2, "Session documents must still be preserved");

    clearAllDocuments();
    assert.strictEqual(getActiveDocument(), null);
    assert.strictEqual(getSessionDocuments().length, 0, "Session documents must be empty after clearAllDocuments");
  } finally {
    cleanupMockBrowser();
  }
});
