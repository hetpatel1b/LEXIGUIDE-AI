import test from "node:test";
import assert from "node:assert";
import { detectSections } from "@/lib/document-engine/section-detector/detector";
import type { DocumentPage } from "@/lib/document-engine/types";

test("Section Detector - detects numbered sections and maps page citations", () => {
  const text = `
1. Definitions and Interpretation
In this Agreement, terms shall have their standard meaning.

2. Confidentiality and Non-Disclosure
Both parties agree to hold confidential information in trust.

3. Term and Termination
This agreement shall terminate on December 31, 2026.
`.trim();

  const pages: DocumentPage[] = [
    {
      pageId: "page_doc1_1",
      pageNumber: 1,
      text,
      startOffset: 0,
      endOffset: text.length,
      characterCount: text.length,
      wordCount: 40,
    },
  ];

  const sections = detectSections(text, pages, "doc1");

  assert.strictEqual(sections.length, 3);
  assert.strictEqual(sections[0].sectionNumber, "1");
  assert.strictEqual(sections[0].title, "Definitions and Interpretation");
  assert.deepStrictEqual(sections[0].pageReferences, [1]);

  assert.strictEqual(sections[1].sectionNumber, "2");
  assert.strictEqual(sections[1].title, "Confidentiality and Non-Disclosure");

  assert.strictEqual(sections[2].sectionNumber, "3");
  assert.strictEqual(sections[2].title, "Term and Termination");
});

test("Section Detector - detects ARTICLE and SECTION patterns", () => {
  const text = `
ARTICLE I. PARTIES
This agreement is between Alpha and Beta.

ARTICLE II. OBLIGATIONS
The contractor shall complete the deliverables.

SECTION 3.1 - INDEMNIFICATION
The parties shall indemnify each other.
`.trim();

  const pages: DocumentPage[] = [
    {
      pageId: "page_doc2_1",
      pageNumber: 1,
      text: text.slice(0, 100),
      startOffset: 0,
      endOffset: 100,
      characterCount: 100,
      wordCount: 15,
    },
    {
      pageId: "page_doc2_2",
      pageNumber: 2,
      text: text.slice(100),
      startOffset: 100,
      endOffset: text.length,
      characterCount: text.length - 100,
      wordCount: 15,
    },
  ];

  const sections = detectSections(text, pages, "doc2");

  assert.strictEqual(sections.length, 3);
  assert.strictEqual(sections[0].sectionNumber, "ARTICLE I");
  assert.strictEqual(sections[0].title, "PARTIES");

  assert.strictEqual(sections[1].sectionNumber, "ARTICLE II");
  assert.strictEqual(sections[1].title, "OBLIGATIONS");

  assert.strictEqual(sections[2].sectionNumber, "SECTION 3.1");
  assert.strictEqual(sections[2].title, "INDEMNIFICATION");
});

test("Section Detector - falls back to 'Document Content' when no headings exist", () => {
  const plainNarrative =
    "This is a continuous narrative legal memorandum without any formal section headings or article labels. It discusses various liability considerations.";

  const pages: DocumentPage[] = [
    {
      pageId: "page_doc3_1",
      pageNumber: 1,
      text: plainNarrative,
      startOffset: 0,
      endOffset: plainNarrative.length,
      characterCount: plainNarrative.length,
      wordCount: 20,
    },
  ];

  const sections = detectSections(plainNarrative, pages, "doc3");

  assert.strictEqual(sections.length, 1);
  assert.strictEqual(sections[0].sectionNumber, null);
  assert.strictEqual(sections[0].title, "Document Content");
  assert.strictEqual(sections[0].startOffset, 0);
  assert.strictEqual(sections[0].endOffset, plainNarrative.length);
});
