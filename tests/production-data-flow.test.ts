import test from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import {
  getActiveDocument,
  setActiveDocument,
  clearActiveDocument,
  getSessionDocuments,
  saveSessionDocument,
  switchActiveDocument,
  removeSessionDocument,
  clearAllDocuments,
  getCachedAnalysis,
  setCachedAnalysis,
} from "@/lib/document-storage";
import type { NormalizedDocument } from "@/types/document";
import type { AnalysisResult } from "@/lib/ai/types";

// Mock minimal window and sessionStorage for Node.js test environment
function setupMockSessionStorage() {
  const store = new Map<string, string>();
  const mockStorage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, val: string) => store.set(key, val),
    removeItem: (key: string) => store.delete(key),
    clear: () => store.clear(),
  };

  (globalThis as unknown as { window: { sessionStorage: typeof mockStorage; dispatchEvent: () => boolean } }).window = {
    sessionStorage: mockStorage,
    dispatchEvent: () => true,
  };

  return store;
}

function cleanupMockSessionStorage() {
  delete (globalThis as unknown as { window?: unknown }).window;
}

function createDummyDoc(id: string, name: string): NormalizedDocument {
  return {
    id,
    originalFilename: name,
    displayName: name,
    format: "pdf",
    mimeType: "application/pdf",
    sizeBytes: 1024,
    pageCount: 2,
    characterCount: 500,
    wordCount: 100,
    lineCount: 20,
    paragraphCount: 5,
    uploadedAt: new Date().toISOString(),
    status: "analyzed",
    source: "user-upload",
    extractedMetadata: { title: name },
    pages: [
      {
        pageId: `p-${id}-1`,
        pageNumber: 1,
        text: "Sample page text",
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
        title: "Terms and Scope",
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
        text: "Sample chunk text for contract scope and terms.",
        sectionId: `sec-${id}-1`,
        sectionNumber: "1",
        sectionTitle: "Terms and Scope",
        pageNumbers: [1],
        startOffset: 0,
        endOffset: 500,
        characterCount: 500,
        wordCount: 100,
      },
    ],
  };
}

test("Static Guard: Zero fixture or demo imports in production source tree (src/)", () => {
  const srcRoot = path.resolve(process.cwd(), "src");

  function getFiles(dir: string): string[] {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const files: string[] = [];
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...getFiles(fullPath));
      } else if (/\.(ts|tsx)$/.test(entry.name)) {
        files.push(fullPath);
      }
    }
    return files;
  }

  const allSrcFiles = getFiles(srcRoot);
  assert.ok(allSrcFiles.length > 20, "Expected at least 20 source files in src/");

  const forbiddenPatterns = [
    /from\s+['"][^'"]*tests\/fixtures[^'"]*['"]/,
    /from\s+['"][^'"]*analysis-fixture[^'"]*['"]/,
    /from\s+['"][^'"]*sample-agreement[^'"]*['"]/,
    /import\s+.*from\s+['"].*fixture.*['"]/,
  ];

  const violations: { file: string; line: string }[] = [];

  for (const filePath of allSrcFiles) {
    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split("\n");

    lines.forEach((line, index) => {
      for (const pattern of forbiddenPatterns) {
        if (pattern.test(line)) {
          violations.push({
            file: path.relative(process.cwd(), filePath),
            line: `Line ${index + 1}: ${line.trim()}`,
          });
        }
      }
    });
  }

  assert.strictEqual(
    violations.length,
    0,
    `Found forbidden fixture imports in production source files:\n${violations
      .map((v) => `${v.file} -> ${v.line}`)
      .join("\n")}`
  );
});

test("Static Guard: No hardcoded demo contract references in workspace headers or navigation", () => {
  const navFile = path.resolve(process.cwd(), "src/components/shared/workspace-nav.tsx");
  const headerFile = path.resolve(process.cwd(), "src/features/analysis/components/workspace-header.tsx");

  const navContent = fs.readFileSync(navFile, "utf-8");
  const headerContent = fs.readFileSync(headerFile, "utf-8");

  assert.ok(
    !navContent.includes('"Employment_Agreement_2026.pdf"'),
    "workspace-nav.tsx must not contain hardcoded Employment_Agreement_2026.pdf"
  );
  assert.ok(
    !headerContent.includes('"Employment_Agreement_2026.pdf"'),
    "workspace-header.tsx must not contain hardcoded Employment_Agreement_2026.pdf"
  );
});

test("Session Storage: Sanitizes and purges legacy demo document if stored", () => {
  const store = setupMockSessionStorage();
  try {
    // Inject legacy demo document into active document storage
    const legacyDoc = {
      id: "doc-ea-2026",
      displayName: "Employment_Agreement_2026.pdf",
      format: "pdf",
      source: "test-fixture",
    };
    store.set("lexiguide_active_document", JSON.stringify(legacyDoc));

    // getActiveDocument must detect and purge it
    const active = getActiveDocument();
    assert.strictEqual(active, null, "Expected legacy demo document to be rejected and return null");
    assert.strictEqual(store.get("lexiguide_active_document"), undefined, "Expected storage key to be deleted");

    // Also verify LexiGuide_AI_Comprehensive_Legal_Test_Contract.pdf is purged
    const testContractDoc = {
      id: "doc_test_comprehensive_001",
      displayName: "LexiGuide_AI_Comprehensive_Legal_Test_Contract.pdf",
      format: "pdf",
    };
    store.set("lexiguide_active_document", JSON.stringify(testContractDoc));
    const testActive = getActiveDocument();
    assert.strictEqual(testActive, null, "Expected LexiGuide_AI_Comprehensive_Legal_Test_Contract.pdf to be purged");
    assert.strictEqual(store.get("lexiguide_active_document"), undefined);

    // Inject legacy demo into session document list alongside real document
    const realDoc = createDummyDoc("doc-user-real-001", "Master_Services_Agreement.pdf");
    store.set(
      "lexiguide_session_documents",
      JSON.stringify([legacyDoc, testContractDoc, realDoc])
    );

    const sessionDocs = getSessionDocuments();
    assert.strictEqual(sessionDocs.length, 1, "Expected only the 1 valid user document");
    assert.strictEqual(sessionDocs[0].id, "doc-user-real-001");
  } finally {
    cleanupMockSessionStorage();
  }
});

test("Session Storage: Authentic user-uploaded documents survive sanitation even with test-like filenames", () => {
  setupMockSessionStorage();
  try {
    clearAllDocuments();

    // 1. User legitimately uploads file named LexiGuide_AI_Comprehensive_Legal_Test_Contract.pdf
    const realUploadDoc = createDummyDoc(
      "doc_8fa012bc44de",
      "LexiGuide_AI_Comprehensive_Legal_Test_Contract.pdf"
    );
    realUploadDoc.source = "user-upload";

    setActiveDocument(realUploadDoc);

    const active = getActiveDocument();
    assert.ok(active !== null, "Authentic user-uploaded document must not be purged");
    assert.strictEqual(active?.id, "doc_8fa012bc44de");
    assert.strictEqual(active?.displayName, "LexiGuide_AI_Comprehensive_Legal_Test_Contract.pdf");

    // 2. User legitimately uploads file named Employment_Agreement_2026.pdf
    const realEA = createDummyDoc("doc_9123abcd4567", "Employment_Agreement_2026.pdf");
    realEA.source = "user-upload";

    setActiveDocument(realEA);

    const activeEA = getActiveDocument();
    assert.ok(activeEA !== null, "User-uploaded Employment_Agreement_2026.pdf must not be purged");
    assert.strictEqual(activeEA?.id, "doc_9123abcd4567");

    const sessionDocs = getSessionDocuments();
    assert.strictEqual(sessionDocs.length, 2);
  } finally {
    cleanupMockSessionStorage();
  }
});

test("Session Storage: Manages multi-document lifecycle, switching, and deletion", () => {
  setupMockSessionStorage();
  try {
    clearAllDocuments();
    assert.strictEqual(getActiveDocument(), null);
    assert.deepStrictEqual(getSessionDocuments(), []);

    // 1. Add Document A
    const docA = createDummyDoc("doc-1", "Vendor_Agreement.pdf");
    setActiveDocument(docA);

    assert.strictEqual(getActiveDocument()?.id, "doc-1");
    assert.strictEqual(getSessionDocuments().length, 1);

    // 2. Add Document B
    const docB = createDummyDoc("doc-2", "Amendment_v2.pdf");
    saveSessionDocument(docB);

    assert.strictEqual(getSessionDocuments().length, 2);
    assert.strictEqual(getActiveDocument()?.id, "doc-1"); // Active is still docA

    // 3. Switch active document to Document B
    const switched = switchActiveDocument("doc-2");
    assert.strictEqual(switched?.id, "doc-2");
    assert.strictEqual(getActiveDocument()?.id, "doc-2");

    // 4. Analysis Cache
    const mockAnalysis: AnalysisResult = {
      analysisSchemaVersion: "1.0",
      documentId: "doc-2",
      documentName: "Amendment_v2.pdf",
      analyzedAt: new Date().toISOString(),
      modelUsed: "nvidia/nemotron-3-super-120b-a12b",
      metadata: {
        documentType: "Vendor Agreement",
        parties: [{ role: "Vendor", name: "Vendor Inc" }],
        effectiveDate: "2026-01-01",
        terminationDate: "2027-01-01",
        jurisdiction: "California",
        governingLaw: "California",
        financialTerms: "Annual payment",
      },
      executiveSummary: {
        overview: "Overview summary",
        keyThemes: ["Renewal"],
        majorObligationsSummary: ["Deliver goods"],
        reviewPriorities: ["Review renewal term"],
      },
      keyClauses: [],
      potentialConcerns: [],
      obligations: [],
      importantDates: [],
      analysisNotes: [],
    };

    setCachedAnalysis("doc-2", mockAnalysis);
    assert.deepStrictEqual(getCachedAnalysis("doc-2"), mockAnalysis);
    assert.strictEqual(getCachedAnalysis("doc-unknown"), null);

    // 5. Remove active document
    removeSessionDocument("doc-2");
    assert.strictEqual(getSessionDocuments().length, 1);
    // Active document automatically falls back to remaining document (doc-1)
    assert.strictEqual(getActiveDocument()?.id, "doc-1");

    // 6. Clear all documents
    clearAllDocuments();
    assert.strictEqual(getActiveDocument(), null);
    assert.strictEqual(getSessionDocuments().length, 0);
  } finally {
    cleanupMockSessionStorage();
  }
});
