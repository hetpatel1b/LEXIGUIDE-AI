import test from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { processDocument } from "@/lib/document-engine/pipeline";

const fixturesDir = path.resolve(process.cwd(), "tests/fixtures");

test("Pipeline Integration - processes PDF end-to-end with page mapping and chunks", async () => {
  const pdfBuffer = fs.readFileSync(path.join(fixturesDir, "sample-agreement.pdf"));
  const doc = await processDocument(pdfBuffer, "employment_agreement.pdf", "application/pdf");

  assert.ok(doc.id.startsWith("doc_"));
  assert.strictEqual(doc.displayName, "employment_agreement.pdf");
  assert.strictEqual(doc.format, "pdf");
  assert.strictEqual(doc.pageCount, 2);
  assert.strictEqual(doc.pages.length, 2);
  assert.strictEqual(doc.pages[0].pageNumber, 1);
  assert.strictEqual(doc.pages[1].pageNumber, 2);

  // Sections detected
  assert.ok(doc.sections.length >= 2);
  assert.ok(doc.chunks.length >= 2);

  // Source mapping: every chunk has a valid sectionId and overlapping page number
  for (const chunk of doc.chunks) {
    assert.ok(chunk.chunkId.startsWith("chk_"));
    assert.ok(chunk.sectionId.startsWith("sec_"));
    assert.ok(chunk.pageNumbers.length > 0);
    assert.ok(chunk.characterCount > 0);
    assert.ok(chunk.wordCount > 0);
  }
});

test("Pipeline Integration - processes DOCX end-to-end preserving semantic headings", async () => {
  const docxBuffer = fs.readFileSync(path.join(fixturesDir, "sample-agreement.docx"));
  const doc = await processDocument(
    docxBuffer,
    "services_agreement.docx",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  );

  assert.ok(doc.id.startsWith("doc_"));
  assert.strictEqual(doc.displayName, "services_agreement.docx");
  assert.strictEqual(doc.format, "docx");
  assert.strictEqual(doc.pageCount, null); // Physical pages null for DOCX
  assert.strictEqual(doc.pages.length, 1);
  assert.strictEqual(doc.pages[0].pageNumber, null);

  // Headings detected
  assert.ok(doc.sections.length >= 3);
  const titles = doc.sections.map((s) => s.title);
  assert.ok(titles.some((t) => t.includes("DEFINITIONS")));
  assert.ok(titles.some((t) => t.includes("CONFIDENTIALITY")));

  // Chunks produced
  assert.ok(doc.chunks.length >= 3);
});

test("Pipeline Integration - processes multi-section TXT end-to-end", async () => {
  const txtBuffer = fs.readFileSync(path.join(fixturesDir, "multi-section.txt"));
  const doc = await processDocument(txtBuffer, "master_services.txt", "text/plain");

  assert.ok(doc.id.startsWith("doc_"));
  assert.strictEqual(doc.displayName, "master_services.txt");
  assert.strictEqual(doc.format, "txt");
  assert.strictEqual(doc.pageCount, null);

  assert.ok(doc.sections.length >= 4);
  assert.ok(doc.chunks.length >= 4);
  assert.ok(doc.wordCount > 50);
});

test("Pipeline Integration - rejects empty files and scanned PDFs with safe error codes", async () => {
  const emptyBuffer = fs.readFileSync(path.join(fixturesDir, "empty.txt"));
  await assert.rejects(
    async () => processDocument(emptyBuffer, "empty.txt"),
    (err: any) => err.code === "EMPTY_DOCUMENT" && err.statusCode === 422
  );

  const scannedBuffer = fs.readFileSync(path.join(fixturesDir, "scanned-mock.pdf"));
  await assert.rejects(
    async () => processDocument(scannedBuffer, "scanned.pdf"),
    (err: any) => err.code === "NO_READABLE_TEXT" && err.statusCode === 422
  );
});
