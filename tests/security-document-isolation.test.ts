import test from "node:test";
import assert from "node:assert";
import { serverDocumentStore } from "@/lib/server-document-store";
import { temporaryComparisonStore } from "@/lib/comparison/temporary-comparison-store";
import type { NormalizedDocument } from "@/lib/document-engine/types";

function createMockDoc(id: string, name: string): NormalizedDocument {
  return {
    id,
    originalFilename: name,
    displayName: name,
    format: "pdf",
    mimeType: "application/pdf",
    sizeBytes: 2048,
    pageCount: 2,
    characterCount: 400,
    wordCount: 80,
    lineCount: 15,
    paragraphCount: 4,
    uploadedAt: new Date().toISOString(),
    status: "uploaded",
    source: "user-upload",
    extractedMetadata: {},
    pages: [],
    sections: [],
    chunks: [
      {
        chunkId: `chk_${id}_1`,
        chunkIndex: 0,
        sectionId: "sec_1",
        sectionTitle: "General Provisions",
        sectionNumber: "1.0",
        pageNumbers: [1],
        startOffset: 0,
        endOffset: 200,
        characterCount: 200,
        wordCount: 40,
        text: "This agreement is strictly confidential between the authorized parties.",
      },
    ],
  };
}

test("Document Isolation - Session A cannot access Document registered by Session B in server store", () => {
  const sessionA = "11111111-1111-4111-8111-111111111111";
  const sessionB = "22222222-2222-4222-8222-222222222222";

  const docA = createMockDoc("doc_session_a_101", "Confidential_Contract_A.pdf");
  const docB = createMockDoc("doc_session_b_202", "Confidential_Contract_B.pdf");

  // Session A registers docA, Session B registers docB
  serverDocumentStore.registerDocument(docA, sessionA);
  serverDocumentStore.registerDocument(docB, sessionB);

  // Session A can retrieve docA
  const retrievedA = serverDocumentStore.getDocument("doc_session_a_101", sessionA);
  assert.ok(retrievedA, "Session A must be able to retrieve its own document");
  assert.strictEqual(retrievedA?.id, "doc_session_a_101");

  // Session A attempts to retrieve Session B's document
  const leakedDoc = serverDocumentStore.getDocument("doc_session_b_202", sessionA);
  assert.strictEqual(
    leakedDoc,
    null,
    "Cross-session access must return null (zero document leakage)"
  );

  // Session B attempts to retrieve Session A's document
  const leakedDocFromB = serverDocumentStore.getDocument("doc_session_a_101", sessionB);
  assert.strictEqual(
    leakedDocFromB,
    null,
    "Session B must not be able to retrieve Session A's document"
  );
});

test("Comparison Isolation - Temporary Document B registered by Session A is inaccessible to Session B", () => {
  const sessionA = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
  const sessionB = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

  const tempDocB = createMockDoc("doc_temp_compare_b", "Vendor_Amendment_v2.pdf");

  // Register in temporaryComparisonStore with ownerSessionId = sessionA
  const compId = temporaryComparisonStore.registerTemporaryDocument(
    tempDocB,
    "cmp_ctx_001",
    3600000,
    sessionA
  );

  // Session A can retrieve it
  const retrievedByA = temporaryComparisonStore.getTemporaryDocument(
    "doc_temp_compare_b",
    compId,
    sessionA
  );
  assert.ok(retrievedByA, "Owner session can retrieve its temporary comparison doc");

  // Session B attempts to retrieve it using known doc ID and compId
  const retrievedByB = temporaryComparisonStore.getTemporaryDocument(
    "doc_temp_compare_b",
    compId,
    sessionB
  );
  assert.strictEqual(
    retrievedByB,
    null,
    "Non-owner session must be blocked from accessing temporary comparison Document B"
  );
});
