import test from "node:test";
import assert from "node:assert";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/comparison/route";
import { serverDocumentStore } from "@/lib/server-document-store";
import type { NormalizedDocument, DocumentSection, DocumentChunk } from "@/lib/document-engine/types";

function createMockDocForApi(id: string, name: string): NormalizedDocument {
  const section: DocumentSection = {
    sectionId: `sec_${id}`,
    sectionNumber: "1",
    title: "1. Term and Termination",
    startOffset: 0,
    endOffset: 100,
    pageReferences: [1],
    chunkIds: [`chk_${id}`],
    characterCount: 100,
  };

  const chunk: DocumentChunk = {
    chunkId: `chk_${id}`,
    chunkIndex: 0,
    text: `This agreement shall terminate upon 30 days notice in document ${id}.`,
    sectionId: section.sectionId,
    sectionNumber: "1",
    sectionTitle: section.title,
    pageNumbers: [1],
    startOffset: 0,
    endOffset: 100,
    characterCount: 100,
    wordCount: 10,
  };

  return {
    id,
    originalFilename: name,
    displayName: name,
    format: "pdf",
    mimeType: "application/pdf",
    sizeBytes: 1024,
    pageCount: 1,
    characterCount: 100,
    wordCount: 15,
    lineCount: 2,
    paragraphCount: 1,
    uploadedAt: new Date().toISOString(),
    status: "analyzed",
    extractedMetadata: {
      title: name,
      author: undefined,
      creationDate: undefined,
      modificationDate: undefined,
      producer: undefined,
    },
    sections: [section],
    chunks: [chunk],
    pages: [],
    source: "user-upload",
  };
}

test("API Route /api/comparison: Missing Request Payload returns 400", async () => {
  const req = new NextRequest("http://localhost:3000/api/comparison", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });

  const res = await POST(req);
  const data = await res.json();

  assert.strictEqual(res.status, 400);
  assert.strictEqual(data.success, false);
  assert.strictEqual(data.error.code, "VALIDATION_ERROR");
});

test("API Route /api/comparison: Same Document Comparison returns 409", async () => {
  const req = new NextRequest("http://localhost:3000/api/comparison", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      documentAId: "doc_123",
      documentBId: "doc_123",
    }),
  });

  const res = await POST(req);
  const data = await res.json();

  assert.strictEqual(res.status, 409);
  assert.strictEqual(data.success, false);
  assert.strictEqual(data.error.code, "COMPARISON_CONFLICT");
});

test("API Route /api/comparison: Document Not Found returns 404", async () => {
  const req = new NextRequest("http://localhost:3000/api/comparison", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      documentAId: "non_existent_a",
      documentBId: "non_existent_b",
    }),
  });

  const res = await POST(req);
  const data = await res.json();

  assert.strictEqual(res.status, 404);
  assert.strictEqual(data.success, false);
  assert.strictEqual(data.error.code, "DOCUMENT_NOT_FOUND");
});

test("API Route /api/comparison: Successful Comparison between registered documents", async () => {
  const docA = createMockDocForApi("doc_api_a", "Contract_A.pdf");
  const docB = createMockDocForApi("doc_api_b", "Contract_B.pdf");
  docB.chunks[0].text = "This agreement shall terminate upon 90 days notice in document B.";

  serverDocumentStore.registerDocument(docA);
  serverDocumentStore.registerDocument(docB);

  const req = new NextRequest("http://localhost:3000/api/comparison", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      documentAId: docA.id,
      documentBId: docB.id,
      skipAi: true, // test deterministic execution via API
    }),
  });

  const res = await POST(req);
  const data = await res.json();

  assert.strictEqual(res.status, 200);
  assert.strictEqual(data.success, true);
  assert.ok(data.data.changes.length >= 1);
  assert.strictEqual(data.data.changes[0].changeSeverity, "major");
  assert.strictEqual(data.data.documentA.id, docA.id);
  assert.strictEqual(data.data.documentB.id, docB.id);
});
