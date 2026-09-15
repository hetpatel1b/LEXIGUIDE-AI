import test from "node:test";
import assert from "node:assert/strict";
import {
  getComparisonWorkspaceState,
  setComparisonWorkspaceState,
  clearComparisonWorkspaceState,
  type ComparisonWorkspaceState,
} from "@/lib/comparison/comparison-storage";
import {
  getActiveDocument,
  setActiveDocument,
  resetDocumentWorkspace,
} from "@/lib/document-storage";
import { temporaryComparisonStore } from "@/lib/comparison/temporary-comparison-store";
import type { NormalizedDocument } from "@/types/document";
import type { ComparisonResult } from "@/types/comparison";

// Setup browser mock environment for Node.js test environment
function setupMockBrowser() {
  const store = new Map<string, string>();
  const listeners = new Map<string, Array<(event: unknown) => void>>();

  const mockStorage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, val: string) => store.set(key, val),
    removeItem: (key: string) => store.delete(key),
    clear: () => store.clear(),
    get length() {
      return store.size;
    },
    key: (index: number) => {
      const keys = Array.from(store.keys());
      return keys[index] || null;
    },
  };

  class MockEvent {
    type: string;
    detail?: unknown;
    constructor(type: string, options?: { detail?: unknown }) {
      this.type = type;
      this.detail = options?.detail;
    }
  }

  (globalThis as unknown as {
    Event: typeof MockEvent;
    CustomEvent: typeof MockEvent;
    window: {
      sessionStorage: typeof mockStorage;
      dispatchEvent: (event: { type: string; detail?: unknown }) => boolean;
      addEventListener: (type: string, cb: (event: unknown) => void) => void;
      removeEventListener: (type: string, cb: (event: unknown) => void) => void;
    };
  }).Event = MockEvent;

  (globalThis as unknown as {
    CustomEvent: typeof MockEvent;
  }).CustomEvent = MockEvent;

  (globalThis as unknown as {
    window: {
      sessionStorage: typeof mockStorage;
      dispatchEvent: (event: { type: string; detail?: unknown }) => boolean;
      addEventListener: (type: string, cb: (event: unknown) => void) => void;
      removeEventListener: (type: string, cb: (event: unknown) => void) => void;
    };
  }).window = {
    sessionStorage: mockStorage,
    dispatchEvent: (event: { type: string; detail?: unknown }) => {
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
        handlers.filter((h) => h !== cb)
      );
    },
  };
}

// Sample document fixtures
const docA: NormalizedDocument = {
  id: "doc_alpha_101",
  displayName: "Master_Services_Agreement_2026.pdf",
  originalFilename: "Master_Services_Agreement_2026.pdf",
  format: "pdf",
  mimeType: "application/pdf",
  sizeBytes: 1024 * 150,
  pageCount: 12,
  characterCount: 56,
  wordCount: 11,
  lineCount: 2,
  paragraphCount: 1,
  uploadedAt: new Date().toISOString(),
  status: "uploaded",
  source: "user-upload",
  extractedMetadata: {},
  pages: [
    {
      pageId: "page_1",
      pageNumber: 1,
      text: "Payment shall be made within 30 days of invoice receipt.",
      startOffset: 0,
      endOffset: 56,
      characterCount: 56,
      wordCount: 11,
    },
  ],
  sections: [
    {
      sectionId: "sec_1",
      sectionNumber: "1",
      title: "Payment Terms",
      startOffset: 0,
      endOffset: 56,
      pageReferences: [1],
      chunkIds: ["chunk_1"],
      characterCount: 56,
    },
  ],
  chunks: [
    {
      chunkId: "chunk_1",
      chunkIndex: 0,
      text: "Payment shall be made within 30 days of invoice receipt.",
      sectionId: "sec_1",
      sectionNumber: "1",
      sectionTitle: "Payment Terms",
      pageNumbers: [1],
      startOffset: 0,
      endOffset: 56,
      characterCount: 56,
      wordCount: 11,
    },
  ],
};

const docB: NormalizedDocument = {
  id: "doc_beta_202",
  displayName: "Master_Services_Agreement_Amendment_v2.txt",
  originalFilename: "Master_Services_Agreement_Amendment_v2.txt",
  format: "txt",
  mimeType: "text/plain",
  sizeBytes: 1024 * 160,
  pageCount: 12,
  characterCount: 56,
  wordCount: 11,
  lineCount: 2,
  paragraphCount: 1,
  uploadedAt: new Date().toISOString(),
  status: "uploaded",
  source: "user-upload",
  extractedMetadata: {},
  pages: [
    {
      pageId: "page_1b",
      pageNumber: 1,
      text: "Payment shall be made within 15 days of invoice receipt.",
      startOffset: 0,
      endOffset: 56,
      characterCount: 56,
      wordCount: 11,
    },
  ],
  sections: [
    {
      sectionId: "sec_1b",
      sectionNumber: "1",
      title: "Payment Terms",
      startOffset: 0,
      endOffset: 56,
      pageReferences: [1],
      chunkIds: ["chunk_1b"],
      characterCount: 56,
    },
  ],
  chunks: [
    {
      chunkId: "chunk_1b",
      chunkIndex: 0,
      text: "Payment shall be made within 15 days of invoice receipt.",
      sectionId: "sec_1b",
      sectionNumber: "1",
      sectionTitle: "Payment Terms",
      pageNumbers: [1],
      startOffset: 0,
      endOffset: 56,
      characterCount: 56,
      wordCount: 11,
    },
  ],
};

const sampleComparisonResult: ComparisonResult = {
  documentA: {
    id: docA.id,
    name: docA.displayName,
    type: "PDF",
    pageCount: 12,
    sizeBytes: 1024 * 150,
    versionLabel: "Document A (Baseline)",
  },
  documentB: {
    id: docB.id,
    name: docB.displayName,
    type: "TXT",
    pageCount: 12,
    sizeBytes: 1024 * 160,
    versionLabel: "Document B (Target)",
  },
  metrics: {
    sectionsCompared: 2,
    changesIdentified: 1,
    majorChanges: 1,
    moderateChanges: 0,
    minorChanges: 0,
    unchangedCount: 0,
    potentialInconsistencies: 1,
  },
  changes: [
    {
      id: "change_1",
      clauseTitle: "Invoice Payment Term",
      category: "Financial",
      changeSeverity: "major",
      sectionA: "Section 4",
      sectionB: "Section 4",
      pageA: 1,
      pageB: 1,
      docAContent: "Payment shall be made within 30 days of invoice receipt.",
      docBContent: "Payment shall be made within 15 days of invoice receipt.",
      summaryChange: "Payment period shortened from 30 days to 15 days.",
      whyItMatters: "Accelerated cash outflow requirement.",
    },
  ],
  inconsistencies: [
    {
      id: "inc_payment_1",
      title: "Conflicting Invoice Payment Timelines",
      inconsistencyType: "internal",
      documentId: docB.id,
      documentName: docB.displayName,
      severity: "major",
      provisionA: {
        sectionTitle: "Section 4",
        pageNumber: 1,
        quote: "Payment shall be made within 30 days of invoice receipt.",
        chunkId: "chunk_1",
      },
      provisionB: {
        sectionTitle: "Schedule B",
        pageNumber: 1,
        quote: "Payment shall be made within 15 days of invoice receipt.",
        chunkId: "chunk_1b",
      },
      explanation: "Provisions specify contradictory payment windows.",
      whyItMatters: "Creates ambiguity regarding vendor default triggers.",
    },
  ],
  unchangedSections: [],
};

test.beforeEach(() => {
  setupMockBrowser();
  clearComparisonWorkspaceState();
  temporaryComparisonStore.clear();
  setActiveDocument(docA);
});

test("TEST 1: Upload B -> compare -> result completed -> switch Compare -> Q&A -> Compare -> result remains", () => {
  const compId = "cmp_test_001";

  // Simulate completion of comparison
  const completedState: ComparisonWorkspaceState = {
    comparisonId: compId,
    documentAId: docA.id,
    tempDocB: docB,
    status: "completed",
    comparisonResult: sampleComparisonResult,
    comparisonError: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  setComparisonWorkspaceState(completedState);

  // User navigates away to Q&A (Component unmounts; no state is cleared)
  // User navigates back to Compare (Component mounts and retrieves state)
  const restored = getComparisonWorkspaceState(docA.id);
  assert.ok(restored, "Comparison state must exist after tab switch");
  assert.equal(restored.status, "completed");
  assert.equal(restored.comparisonId, compId);
  assert.equal(restored.tempDocB.id, docB.id);
  assert.equal(restored.comparisonResult?.changes.length, 1);
  assert.equal(restored.comparisonResult?.inconsistencies.length, 1);
});

test("TEST 2: Upload B -> compare -> Compare -> Analysis -> Compare -> result remains", () => {
  const completedState: ComparisonWorkspaceState = {
    comparisonId: "cmp_test_002",
    documentAId: docA.id,
    tempDocB: docB,
    status: "completed",
    comparisonResult: sampleComparisonResult,
    comparisonError: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  setComparisonWorkspaceState(completedState);

  // Simulate navigate to Analysis, then back to Compare
  const restored = getComparisonWorkspaceState(docA.id);
  assert.ok(restored);
  assert.equal(restored.status, "completed");
  assert.equal(restored.comparisonResult?.metrics.majorChanges, 1);
});

test("TEST 3: Upload B -> compare -> Compare -> Summary -> Compare -> result remains", () => {
  const completedState: ComparisonWorkspaceState = {
    comparisonId: "cmp_test_003",
    documentAId: docA.id,
    tempDocB: docB,
    status: "completed",
    comparisonResult: sampleComparisonResult,
    comparisonError: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  setComparisonWorkspaceState(completedState);

  const restored = getComparisonWorkspaceState(docA.id);
  assert.ok(restored);
  assert.equal(restored.comparisonResult?.documentA.id, docA.id);
  assert.equal(restored.comparisonResult?.documentB.id, docB.id);
});

test("TEST 4: Upload B -> compare -> multiple tab switches -> Compare -> same result", () => {
  const completedState: ComparisonWorkspaceState = {
    comparisonId: "cmp_test_004",
    documentAId: docA.id,
    tempDocB: docB,
    status: "completed",
    comparisonResult: sampleComparisonResult,
    comparisonError: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  setComparisonWorkspaceState(completedState);

  // Compare -> Q&A -> Analysis -> Action Center -> Compare
  for (let i = 0; i < 5; i++) {
    const check = getComparisonWorkspaceState(docA.id);
    assert.ok(check, `Iteration ${i}: Comparison state must survive repeated tab navigation`);
    assert.equal(check.status, "completed");
  }
});

test("TEST 5: Completed comparison -> click New Document to Compare -> result cleared and B removed", () => {
  const completedState: ComparisonWorkspaceState = {
    comparisonId: "cmp_test_005",
    documentAId: docA.id,
    tempDocB: docB,
    status: "completed",
    comparisonResult: sampleComparisonResult,
    comparisonError: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  setComparisonWorkspaceState(completedState);

  // User clicks "New Document to Compare"
  clearComparisonWorkspaceState(docA.id, "cmp_test_005", docB.id);

  const afterClear = getComparisonWorkspaceState(docA.id);
  assert.equal(afterClear, null, "Comparison result must be completely cleared");

  // Document A must still be the active document
  const currentDocA = getActiveDocument();
  assert.ok(currentDocA);
  assert.equal(currentDocA.id, docA.id, "Document A must remain untouched");
});

test("TEST 6: Completed comparison -> upload new B -> new comparison starts cleanly", () => {
  // First comparison completed
  setComparisonWorkspaceState({
    comparisonId: "cmp_test_old",
    documentAId: docA.id,
    tempDocB: docB,
    status: "completed",
    comparisonResult: sampleComparisonResult,
    comparisonError: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });

  // User clicks New Document to Compare
  clearComparisonWorkspaceState(docA.id);

  // User uploads Doc C (new comparison target)
  const docC: NormalizedDocument = {
    ...docB,
    id: "doc_gamma_303",
    displayName: "Master_Services_Agreement_Amendment_v3.docx",
  };

  const newCompId = "cmp_test_new_001";
  setComparisonWorkspaceState({
    comparisonId: newCompId,
    documentAId: docA.id,
    tempDocB: docC,
    status: "document_b_ready",
    comparisonResult: null,
    comparisonError: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });

  const readyState = getComparisonWorkspaceState(docA.id);
  assert.ok(readyState);
  assert.equal(readyState.status, "document_b_ready");
  assert.equal(readyState.tempDocB.id, "doc_gamma_303");
  assert.equal(readyState.comparisonResult, null);
});

test("TEST 7: Completed comparison -> change Document A -> old comparison invalidated", () => {
  setComparisonWorkspaceState({
    comparisonId: "cmp_test_docA_change",
    documentAId: docA.id,
    tempDocB: docB,
    status: "completed",
    comparisonResult: sampleComparisonResult,
    comparisonError: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });

  // Document A is changed to another agreement
  const newDocA: NormalizedDocument = {
    ...docA,
    id: "doc_new_primary_999",
    displayName: "Commercial_Lease_2026.pdf",
  };
  setActiveDocument(newDocA);

  // When requesting comparison state for the new primary document:
  const newState = getComparisonWorkspaceState(newDocA.id);
  assert.equal(newState, null, "New Document A must have empty comparison state");
});

test("TEST 8: Completed comparison -> Exit Workspace -> comparison fully cleared", () => {
  setComparisonWorkspaceState({
    comparisonId: "cmp_test_exit",
    documentAId: docA.id,
    tempDocB: docB,
    status: "completed",
    comparisonResult: sampleComparisonResult,
    comparisonError: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });

  // User clicks Exit Workspace
  resetDocumentWorkspace();

  assert.equal(getComparisonWorkspaceState(docA.id), null, "Comparison state must be purged on Exit");
  assert.equal(getActiveDocument(), null, "Active Document A must be purged on Exit");
});

test("TEST 9 & 10: Completed comparison -> switch tabs -> NO comparison API rerun & NO Nemotron call", () => {
  let apiCallCount = 0;

  // Track API requests
  const mockFetch = async () => {
    apiCallCount++;
    return {
      ok: true,
      json: async () => ({ success: true, data: sampleComparisonResult }),
    };
  };
  (globalThis as unknown as { fetch: typeof mockFetch }).fetch = mockFetch;

  // Comparison is completed and stored
  setComparisonWorkspaceState({
    comparisonId: "cmp_test_no_rerun",
    documentAId: docA.id,
    tempDocB: docB,
    status: "completed",
    comparisonResult: sampleComparisonResult,
    comparisonError: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });

  // Tab navigation: Compare -> Q&A -> Compare
  const state1 = getComparisonWorkspaceState(docA.id);
  assert.ok(state1);
  assert.equal(state1.status, "completed");

  // Zero network API calls should be triggered by tab switching
  assert.equal(apiCallCount, 0, "No comparison API or Nemotron requests must occur on tab switch");
});

test("TEST 11: Completed comparison -> switch tabs -> server-side comparison record still exists", () => {
  const sessionId = "session_user_test_111";
  const compId = temporaryComparisonStore.registerTemporaryDocument(
    docB,
    "cmp_srv_exist",
    3600000,
    sessionId
  );

  // Tab switch simulated (no destructive action)
  const retrievedDoc = temporaryComparisonStore.getTemporaryDocument(docB.id, compId, sessionId);
  assert.ok(retrievedDoc, "Server-side comparison record must persist across ordinary tab switches");
  assert.equal(retrievedDoc.id, docB.id);
});

test("TEST 12: Completed comparison -> New Document to Compare -> server-side old comparison record is deleted", () => {
  const sessionId = "session_user_test_222";
  const compId = temporaryComparisonStore.registerTemporaryDocument(
    docB,
    "cmp_srv_to_delete",
    3600000,
    sessionId
  );

  // Explicit action: New Document to Compare
  const removed = temporaryComparisonStore.clearComparison(compId, sessionId);
  assert.equal(removed, 1, "Server-side temporary comparison record must be deleted");

  const afterDelete = temporaryComparisonStore.getTemporaryDocument(docB.id, compId, sessionId);
  assert.equal(afterDelete, null, "Deleted comparison record must not be retrievable");
});

test("TEST 13: Session A comparison -> Session B attempts same comparisonId -> access denied / no data leakage", () => {
  const sessionA = "11111111-1111-4111-8111-111111111111";
  const sessionB = "22222222-2222-4222-8222-222222222222";

  const compId = temporaryComparisonStore.registerTemporaryDocument(
    docB,
    "cmp_secret_001",
    3600000,
    sessionA
  );

  // Session A accesses: allowed
  const docForA = temporaryComparisonStore.getTemporaryDocument(docB.id, compId, sessionA);
  assert.ok(docForA);

  // Session B attempts to access Document B belonging to Session A: denied
  const docForB = temporaryComparisonStore.getTemporaryDocument(docB.id, compId, sessionB);
  assert.equal(docForB, null, "Cross-session comparison access must be strictly denied");
});

test("TEST 14: Comparison in COMPLETED state -> tab switch -> counts and evidence remain identical", () => {
  setComparisonWorkspaceState({
    comparisonId: "cmp_test_identical",
    documentAId: docA.id,
    tempDocB: docB,
    status: "completed",
    comparisonResult: sampleComparisonResult,
    comparisonError: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });

  const state = getComparisonWorkspaceState(docA.id);
  assert.ok(state?.comparisonResult);
  assert.equal(state.comparisonResult.changes[0].docAContent, "Payment shall be made within 30 days of invoice receipt.");
  assert.equal(state.comparisonResult.changes[0].docBContent, "Payment shall be made within 15 days of invoice receipt.");
  assert.equal(state.comparisonResult.inconsistencies[0].provisionA.quote, "Payment shall be made within 30 days of invoice receipt.");
  assert.equal(state.comparisonResult.inconsistencies[0].provisionB.quote, "Payment shall be made within 15 days of invoice receipt.");
});

test("TEST 15: Comparison error -> tab switch -> return -> error/retry state preserved", () => {
  const errorMsg = "Comparison engine timeout connecting to Nemotron.";
  setComparisonWorkspaceState({
    comparisonId: "cmp_test_err",
    documentAId: docA.id,
    tempDocB: docB,
    status: "error",
    comparisonResult: null,
    comparisonError: errorMsg,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });

  // Switch tabs and return
  const restored = getComparisonWorkspaceState(docA.id);
  assert.ok(restored);
  assert.equal(restored.status, "error");
  assert.equal(restored.comparisonError, errorMsg);
  assert.equal(restored.tempDocB.id, docB.id, "Document B is preserved for retry");
});

test("TEST 16: Comparison loading -> tab switch -> return -> operation is not incorrectly reset/cancelled", () => {
  setComparisonWorkspaceState({
    comparisonId: "cmp_test_loading",
    documentAId: docA.id,
    tempDocB: docB,
    status: "comparing",
    comparisonResult: null,
    comparisonError: null,
    loadingStage: "Reviewing significant differences…",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });

  // User navigates away while comparison is in-flight and returns
  const inFlightState = getComparisonWorkspaceState(docA.id);
  assert.ok(inFlightState);
  assert.equal(inFlightState.status, "comparing");
  assert.equal(inFlightState.loadingStage, "Reviewing significant differences…");
});
