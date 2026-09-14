import test from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { sanitizeFilename } from "@/lib/document-engine/validators/filename-sanitizer";
import { detectDocumentFormat } from "@/lib/document-engine/validators/format-detector";
import { validateDocumentFile } from "@/lib/document-engine/validators/file-validator";
import { FILE_CONSTRAINTS } from "@/lib/constants";

test("Filename Sanitizer - prevents path traversal and control characters", () => {
  const traversal = sanitizeFilename("../../../etc/passwd");
  assert.strictEqual(traversal.displayName, "passwd");
  assert.ok(traversal.internalId.startsWith("doc_"));

  const winTraversal = sanitizeFilename("..\\..\\Windows\\System32\\cmd.exe");
  assert.strictEqual(winTraversal.displayName, "cmd.exe");

  const nullByte = sanitizeFilename("contract\0.pdf");
  assert.strictEqual(nullByte.displayName, "contract.pdf");
  assert.strictEqual(nullByte.extension, ".pdf");

  const longName = "a".repeat(300) + ".docx";
  const sanitizedLong = sanitizeFilename(longName);
  assert.ok(sanitizedLong.displayName.length <= 255);
  assert.ok(sanitizedLong.displayName.endsWith(".docx"));
});

test("Format Detector - detects PDF, DOCX, and TXT from magic bytes", () => {
  const fixturesDir = path.resolve(process.cwd(), "tests/fixtures");

  // PDF
  const pdfBuffer = fs.readFileSync(path.join(fixturesDir, "sample-agreement.pdf"));
  const pdfRes = detectDocumentFormat(pdfBuffer);
  assert.strictEqual(pdfRes.detectedFormat, "pdf");
  assert.strictEqual(pdfRes.mimeType, "application/pdf");

  // DOCX
  const docxBuffer = fs.readFileSync(path.join(fixturesDir, "sample-agreement.docx"));
  const docxRes = detectDocumentFormat(docxBuffer);
  assert.strictEqual(docxRes.detectedFormat, "docx");
  assert.strictEqual(
    docxRes.mimeType,
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  );

  // Generic ZIP (fake docx) - rejected
  const fakeDocx = fs.readFileSync(path.join(fixturesDir, "fake-docx.docx"));
  const fakeDocxRes = detectDocumentFormat(fakeDocx);
  assert.strictEqual(fakeDocxRes.isRecognized, false);
  assert.strictEqual(fakeDocxRes.detectedFormat, null);

  // Plain text
  const txtBuffer = fs.readFileSync(path.join(fixturesDir, "simple.txt"));
  const txtRes = detectDocumentFormat(txtBuffer);
  assert.strictEqual(txtRes.detectedFormat, "txt");
  assert.strictEqual(txtRes.mimeType, "text/plain");

  // Binary data with null bytes - rejected
  const binaryBuffer = Buffer.from([0x00, 0x01, 0x02, 0xff, 0xfe]);
  const binaryRes = detectDocumentFormat(binaryBuffer);
  assert.strictEqual(binaryRes.isRecognized, false);
  assert.strictEqual(binaryRes.detectedFormat, null);
});

test("File Validator - enforces authoritative limits and consistency", () => {
  const fixturesDir = path.resolve(process.cwd(), "tests/fixtures");
  const txtBuffer = fs.readFileSync(path.join(fixturesDir, "simple.txt"));

  // Valid file passes
  const valid = validateDocumentFile(txtBuffer, "agreement.txt", "text/plain");
  assert.strictEqual(valid.format, "txt");
  assert.strictEqual(valid.filenameInfo.displayName, "agreement.txt");

  // Empty file rejected (422)
  assert.throws(
    () => validateDocumentFile(Buffer.alloc(0), "empty.txt"),
    (err: any) => err.code === "EMPTY_DOCUMENT" && err.statusCode === 422
  );

  // Oversized file rejected (413)
  const hugeBuffer = Buffer.alloc(FILE_CONSTRAINTS.maxFileSizeBytes + 10);
  assert.throws(
    () => validateDocumentFile(hugeBuffer, "huge.txt"),
    (err: any) => err.code === "FILE_TOO_LARGE" && err.statusCode === 413
  );

  // Extension mismatch with content rejected (415)
  assert.throws(
    () => validateDocumentFile(txtBuffer, "fake.pdf"),
    (err: any) => err.code === "UNSUPPORTED_FILE_TYPE" && err.statusCode === 415
  );
});
