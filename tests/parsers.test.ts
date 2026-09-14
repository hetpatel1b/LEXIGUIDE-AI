import test from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { PdfParser } from "@/lib/document-engine/parsers/pdf-parser";
import { DocxParser } from "@/lib/document-engine/parsers/docx-parser";
import { TxtParser } from "@/lib/document-engine/parsers/txt-parser";

const fixturesDir = path.resolve(process.cwd(), "tests/fixtures");

test("PDF Parser - extracts page-by-page text and preserves true page numbers", async () => {
  const parser = new PdfParser();
  const pdfBuffer = fs.readFileSync(path.join(fixturesDir, "sample-agreement.pdf"));
  const parsed = await parser.parse(pdfBuffer);

  assert.strictEqual(parsed.format, "pdf");
  assert.strictEqual(parsed.pages.length, 2);
  assert.strictEqual(parsed.pages[0].pageNumber, 1);
  assert.strictEqual(parsed.pages[1].pageNumber, 2);

  assert.ok(parsed.pages[0].rawText.includes("1. Appointment and Term"));
  assert.ok(parsed.pages[1].rawText.includes("3. Non-Disclosure"));
});

test("PDF Parser - detects image-only / scanned PDF without readable text", async () => {
  const parser = new PdfParser();
  const scannedBuffer = fs.readFileSync(path.join(fixturesDir, "scanned-mock.pdf"));

  await assert.rejects(
    async () => parser.parse(scannedBuffer),
    (err: any) => {
      assert.strictEqual(err.code, "NO_READABLE_TEXT");
      assert.strictEqual(err.statusCode, 422);
      return true;
    }
  );
});

test("PDF Parser - handles corrupted PDF gracefully without crashing", async () => {
  const parser = new PdfParser();
  const corruptBuffer = fs.readFileSync(path.join(fixturesDir, "corrupt.pdf"));

  await assert.rejects(
    async () => parser.parse(corruptBuffer),
    (err: any) => {
      assert.strictEqual(err.code, "CORRUPTED_DOCUMENT");
      assert.strictEqual(err.statusCode, 422);
      return true;
    }
  );
});

test("DOCX Parser - extracts headings and paragraphs without fabricating page numbers", async () => {
  const parser = new DocxParser();
  const docxBuffer = fs.readFileSync(path.join(fixturesDir, "sample-agreement.docx"));
  const parsed = await parser.parse(docxBuffer);

  assert.strictEqual(parsed.format, "docx");
  assert.strictEqual(parsed.pages.length, 1);
  // Physical page number is null for DOCX
  assert.strictEqual(parsed.pages[0].pageNumber, null);

  const text = parsed.pages[0].rawText;
  assert.ok(text.includes("ARTICLE 1. DEFINITIONS"));
  assert.ok(text.includes("ARTICLE 2. CONFIDENTIALITY"));
  assert.ok(text.includes("ARTICLE 3. TERMINATION"));
});

test("DOCX Parser - handles corrupt DOCX file safely", async () => {
  const parser = new DocxParser();
  const corruptBuffer = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x00, 0x00]);

  await assert.rejects(
    async () => parser.parse(corruptBuffer),
    (err: any) => {
      assert.strictEqual(err.code, "CORRUPTED_DOCUMENT");
      assert.strictEqual(err.statusCode, 422);
      return true;
    }
  );
});

test("TXT Parser - decodes UTF-8 text and handles empty documents safely", async () => {
  const parser = new TxtParser();
  const txtBuffer = fs.readFileSync(path.join(fixturesDir, "simple.txt"));
  const parsed = await parser.parse(txtBuffer);

  assert.strictEqual(parsed.format, "txt");
  assert.strictEqual(parsed.pages.length, 1);
  assert.strictEqual(parsed.pages[0].pageNumber, null);
  assert.ok(parsed.pages[0].rawText.includes("Non-Disclosure Agreement"));

  // Empty buffer
  await assert.rejects(
    async () => parser.parse(Buffer.alloc(0)),
    (err: any) => err.code === "EMPTY_DOCUMENT"
  );

  // Whitespace only
  await assert.rejects(
    async () => parser.parse(Buffer.from("   \n\t  \r\n  ")),
    (err: any) => err.code === "EMPTY_DOCUMENT"
  );
});
