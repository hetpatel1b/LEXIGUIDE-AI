import test from "node:test";
import assert from "node:assert";
import {
  normalizeText,
  calculateTextStats,
} from "@/lib/document-engine/normalizer/normalizer";

test("Normalizer - normalizes line endings without modifying legal terminology", () => {
  const rawWithCrlf =
    "ARTICLE 1.\r\nIn this Agreement, 'Indemnified Party' shall mean XYZ Corp.\r\n\r\n\r\n\r\nARTICLE 2.\r\nSeverability clause: 100% enforceable.";

  const normalized = normalizeText(rawWithCrlf);

  // Line breaks normalized
  assert.ok(!normalized.includes("\r"));
  assert.ok(!normalized.includes("\n\n\n")); // collapsed to max 2 newlines

  // Strict Source Fidelity checks
  assert.ok(normalized.includes("'Indemnified Party'"));
  assert.ok(normalized.includes("XYZ Corp."));
  assert.ok(normalized.includes("100% enforceable."));
  assert.ok(normalized.includes("ARTICLE 1."));
  assert.ok(normalized.includes("ARTICLE 2."));
});

test("Normalizer - calculates accurate text statistics without mutating text", () => {
  const sample = "First paragraph here.\n\nSecond paragraph has five words.";
  const stats = calculateTextStats(sample);

  assert.strictEqual(stats.paragraphCount, 2);
  assert.strictEqual(stats.lineCount, 3);
  assert.strictEqual(stats.wordCount, 8);
  assert.strictEqual(stats.characterCount, sample.length);
});
