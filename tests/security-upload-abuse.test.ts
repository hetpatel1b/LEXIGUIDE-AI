import test from "node:test";
import assert from "node:assert";
import { validateDocumentFile } from "@/lib/document-engine/validators/file-validator";
import { sanitizeFilename } from "@/lib/document-engine/validators/filename-sanitizer";
import { DocumentEngineError } from "@/lib/document-engine/errors";
import { FILE_CONSTRAINTS } from "@/lib/constants";

test("Upload Security - rejects empty file (0 bytes) with EMPTY_DOCUMENT error", () => {
  const emptyBuffer = Buffer.alloc(0);

  assert.throws(
    () => validateDocumentFile(emptyBuffer, "test.pdf", "application/pdf"),
    (err: unknown) => {
      assert.ok(err instanceof DocumentEngineError);
      assert.strictEqual(err.code, "EMPTY_DOCUMENT");
      assert.strictEqual(err.statusCode, 422);
      return true;
    }
  );
});

test("Upload Security - rejects file exceeding 25MB with FILE_TOO_LARGE error", () => {
  // 25MB + 1024 bytes
  const oversizedBuffer = Buffer.alloc(FILE_CONSTRAINTS.maxFileSizeBytes + 1024);

  assert.throws(
    () => validateDocumentFile(oversizedBuffer, "large.pdf", "application/pdf"),
    (err: unknown) => {
      assert.ok(err instanceof DocumentEngineError);
      assert.strictEqual(err.code, "FILE_TOO_LARGE");
      assert.strictEqual(err.statusCode, 413);
      return true;
    }
  );
});

test("Upload Security - rejects fake PDF with invalid magic numbers", () => {
  // ASCII text pretending to be a PDF with .pdf extension
  const fakePdfBuffer = Buffer.from("<html><body>Not a PDF</body></html>");

  assert.throws(
    () => validateDocumentFile(fakePdfBuffer, "fake.pdf", "application/pdf"),
    (err: unknown) => {
      assert.ok(err instanceof DocumentEngineError);
      assert.strictEqual(err.code, "UNSUPPORTED_FILE_TYPE");
      return true;
    }
  );
});

test("Upload Security - sanitizes path traversal attempts in raw filenames", () => {
  const attacks = [
    "../../../../etc/passwd.pdf",
    "..\\..\\windows\\system32\\cmd.exe.docx",
    "/root/.ssh/id_rsa.txt",
    "C:\\secret\\confidential.pdf",
    "....//....//document.pdf",
  ];

  for (const attack of attacks) {
    const info = sanitizeFilename(attack);
    assert.ok(
      !info.displayName.includes(".."),
      `Sanitized name "${info.displayName}" must not contain '..'`
    );
    assert.ok(
      !info.displayName.includes("/"),
      `Sanitized name "${info.displayName}" must not contain '/'`
    );
    assert.ok(
      !info.displayName.includes("\\"),
      `Sanitized name "${info.displayName}" must not contain '\\'`
    );
    assert.match(info.internalId, /^doc_[a-f0-9]{32}$/);
  }
});

test("Upload Security - strips control characters and null bytes from filenames", () => {
  const dirtyFilename = "malicious\x00contract\x1f\x7f.pdf";
  const info = sanitizeFilename(dirtyFilename);

  assert.ok(!info.displayName.includes("\x00"), "Null bytes must be stripped");
  assert.ok(!info.displayName.includes("\x1f"), "Control chars must be stripped");
  assert.strictEqual(info.extension, ".pdf");
});
