import test from "node:test";
import assert from "node:assert";
import { chunkDocument } from "@/lib/document-engine/chunker/chunker";
import type { DocumentPage, DocumentSection } from "@/lib/document-engine/types";

test("Chunker - produces deterministic chunk IDs and respects boundaries", () => {
  const text =
    "1. Confidentiality\n\nThe receiving party agrees not to disclose any proprietary algorithms, customer lists, or source code to third parties without prior written consent. This obligation shall continue for a period of five years following the termination of this agreement. Each party shall use the same degree of care as it uses for its own confidential information.";

  const sections: DocumentSection[] = [
    {
      sectionId: "sec_docA_1",
      sectionNumber: "1",
      title: "Confidentiality",
      startOffset: 0,
      endOffset: text.length,
      pageReferences: [1],
      chunkIds: [],
      characterCount: text.length,
    },
  ];

  const pages: DocumentPage[] = [
    {
      pageId: "page_docA_1",
      pageNumber: 1,
      text,
      startOffset: 0,
      endOffset: text.length,
      characterCount: text.length,
      wordCount: 50,
    },
  ];

  const { chunks, updatedSections } = chunkDocument(
    text,
    sections,
    pages,
    "docA",
    { targetChunkChars: 150, overlapChars: 30 }
  );

  // Verify stable chunk IDs
  assert.ok(chunks.length > 1);
  assert.strictEqual(chunks[0].chunkId, "chk_docA_1");
  assert.strictEqual(chunks[1].chunkId, "chk_docA_2");

  // Verify section association
  assert.strictEqual(chunks[0].sectionId, "sec_docA_1");
  assert.strictEqual(chunks[0].sectionTitle, "Confidentiality");
  assert.deepStrictEqual(chunks[0].pageNumbers, [1]);

  // Verify section's chunkIds list was updated
  assert.deepStrictEqual(updatedSections[0].chunkIds, chunks.map((c) => c.chunkId));
});

test("Chunker - keeps small sections intact without unnecessary fragmentation", () => {
  const text = "2. Governing Law\n\nThis Agreement is governed by the laws of India.";

  const sections: DocumentSection[] = [
    {
      sectionId: "sec_docB_1",
      sectionNumber: "2",
      title: "Governing Law",
      startOffset: 0,
      endOffset: text.length,
      pageReferences: [1],
      chunkIds: [],
      characterCount: text.length,
    },
  ];

  const pages: DocumentPage[] = [
    {
      pageId: "page_docB_1",
      pageNumber: 1,
      text,
      startOffset: 0,
      endOffset: text.length,
      characterCount: text.length,
      wordCount: 10,
    },
  ];

  const { chunks } = chunkDocument(text, sections, pages, "docB");

  assert.strictEqual(chunks.length, 1);
  assert.strictEqual(chunks[0].chunkId, "chk_docB_1");
  assert.strictEqual(chunks[0].text, text);
});
