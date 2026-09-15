import test from "node:test";
import assert from "node:assert";
import {
  AnalysisRequestSchema,
  QaRequestSchema,
  ComparisonRequestSchema,
} from "@/schemas/api-requests";

test("API Validation - AnalysisRequestSchema validates valid payloads and rejects empty/malformed structures", () => {
  // 1. Valid by documentId
  const validId = AnalysisRequestSchema.safeParse({ documentId: "doc_valid_123" });
  assert.strictEqual(validId.success, true);

  // 2. Empty payload fails
  const empty = AnalysisRequestSchema.safeParse({});
  assert.strictEqual(empty.success, false);

  // 3. Invalid characters in documentId
  const badId = AnalysisRequestSchema.safeParse({ documentId: "doc/../../evil" });
  assert.strictEqual(badId.success, false);

  // 4. Valid document object with chunks
  const validDoc = AnalysisRequestSchema.safeParse({
    document: {
      id: "doc_test_1",
      displayName: "agreement.pdf",
      chunks: [{ chunkId: "chk_1", text: "Some legal clause text." }],
    },
  });
  assert.strictEqual(validDoc.success, true);
});

test("API Validation - QaRequestSchema enforces question bounds and non-empty documentId", () => {
  // 1. Valid question
  const valid = QaRequestSchema.safeParse({
    documentId: "doc_valid_456",
    question: "What is the termination notice period?",
  });
  assert.strictEqual(valid.success, true);

  // 2. Empty question rejected
  const emptyQ = QaRequestSchema.safeParse({
    documentId: "doc_valid_456",
    question: "   ",
  });
  assert.strictEqual(emptyQ.success, false);

  // 3. Oversized question (> 1000 chars) rejected
  const hugeQ = QaRequestSchema.safeParse({
    documentId: "doc_valid_456",
    question: "a".repeat(1001),
  });
  assert.strictEqual(hugeQ.success, false);

  // 4. Missing documentId rejected
  const missingDoc = QaRequestSchema.safeParse({
    question: "What is the penalty?",
  });
  assert.strictEqual(missingDoc.success, false);
});

test("API Validation - ComparisonRequestSchema rejects self-comparison (docA === docB)", () => {
  // 1. Valid distinct documents
  const valid = ComparisonRequestSchema.safeParse({
    documentAId: "doc_version_1",
    documentBId: "doc_version_2",
    comparisonId: "cmp_123",
  });
  assert.strictEqual(valid.success, true);

  // 2. Self-comparison rejected (same-document protection)
  const selfComp = ComparisonRequestSchema.safeParse({
    documentAId: "doc_version_1",
    documentBId: "doc_version_1",
  });
  assert.strictEqual(selfComp.success, false);
  if (!selfComp.success) {
    const msg = selfComp.error.issues[0].message;
    assert.ok(msg.includes("Cannot compare a document to itself"));
  }
});
