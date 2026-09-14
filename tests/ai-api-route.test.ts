import test from "node:test";
import assert from "node:assert";
import { POST } from "@/app/api/analysis/route";
import { NextRequest } from "next/server";
import employmentDocRaw from "./fixtures/ai/employment-agreement.json";

function createRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost:3000/api/analysis", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

test("API Route /api/analysis - returns 400 when document is missing from payload", async () => {
  const req = createRequest({});
  const res = await POST(req);
  const data = await res.json();

  assert.strictEqual(res.status, 400);
  assert.strictEqual(data.success, false);
  assert.strictEqual(data.error.code, "VALIDATION_ERROR");
});

test("API Route /api/analysis - returns 400 when document has invalid structure", async () => {
  const req = createRequest({ document: { title: "not a valid doc" } });
  const res = await POST(req);
  const data = await res.json();

  assert.strictEqual(res.status, 400);
  assert.strictEqual(data.success, false);
});

test("API Route /api/analysis - returns 422 when document chunks array is empty", async () => {
  const req = createRequest({
    document: {
      id: "doc_empty",
      displayName: "empty.txt",
      chunks: [],
    },
  });
  const res = await POST(req);
  const data = await res.json();

  assert.strictEqual(res.status, 422);
  assert.strictEqual(data.success, false);
  assert.strictEqual(data.error.code, "EMPTY_DOCUMENT");
});

test("API Route /api/analysis - returns 401 with safe message when NVIDIA_API_KEY is missing", async () => {
  // Ensure NVIDIA_API_KEY is unset for this test
  const savedKey = process.env.NVIDIA_API_KEY;
  delete process.env.NVIDIA_API_KEY;

  try {
    const req = createRequest({ document: employmentDocRaw });
    const res = await POST(req);
    const data = await res.json();

    assert.strictEqual(res.status, 401);
    assert.strictEqual(data.success, false);
    assert.strictEqual(data.error.code, "AI_CONFIG_ERROR");
    assert.ok(!data.error.message.includes("NVIDIA_API_KEY")); // Asserts no secret name leaked
  } finally {
    if (savedKey) {
      process.env.NVIDIA_API_KEY = savedKey;
    }
  }
});
