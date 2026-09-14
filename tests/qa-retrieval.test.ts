import test from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { processDocument } from "@/lib/document-engine/pipeline";
import {
  processQuery,
  normalizeQueryString,
  detectSectionTarget,
  classifyQuestionQuality,
} from "@/lib/retrieval/query-processor";
import { scoreChunk } from "@/lib/retrieval/retrieval-scorer";
import { LexicalDocumentRetriever } from "@/lib/retrieval/document-retriever";
import { QA_EVALUATION_DATASET } from "./fixtures/qa-evaluation";
import type { DocumentChunk, NormalizedDocument } from "@/lib/document-engine/types";

const fixturesDir = path.resolve(process.cwd(), "tests/fixtures");

test("QA Retrieval: Question Quality Classification", () => {
  // Specific inquiries
  assert.strictEqual(classifyQuestionQuality("What is the employee's base salary?"), "specific");
  assert.strictEqual(classifyQuestionQuality("What is the effective date?"), "specific");
  assert.strictEqual(classifyQuestionQuality("What is the arbitration seat?"), "specific");
  assert.strictEqual(classifyQuestionQuality("Tell me about Section 8."), "specific");
  assert.strictEqual(
    classifyQuestionQuality("Does this agreement provide a signing bonus of INR 1,000,000?"),
    "specific"
  );

  // Vague inquiries
  assert.strictEqual(classifyQuestionQuality("what about this document"), "vague");
  assert.strictEqual(classifyQuestionQuality("What about this document?"), "vague");
  assert.strictEqual(classifyQuestionQuality("Explain."), "vague");
  assert.strictEqual(classifyQuestionQuality("tell me about this"), "vague");
  assert.strictEqual(classifyQuestionQuality("overview"), "vague");

  // Empty inquiries
  assert.strictEqual(classifyQuestionQuality(""), "empty");
  assert.strictEqual(classifyQuestionQuality("   "), "empty");
});

test("QA Retrieval: Query Normalization & Preprocessing", () => {
  const norm1 = normalizeQueryString('What is the "notice period" for termination?');
  assert.strictEqual(norm1, "what is the notice period for termination");

  const norm2 = normalizeQueryString("Does the contract contain a non-compete clause?");
  assert.strictEqual(norm2, "does the contract contain a non-compete clause");

  const processed = processQuery("When must a security incident within twenty-four hours be reported?");
  assert.ok(processed.tokens.includes("security"));
  assert.ok(processed.tokens.includes("incident"));
  // Twenty-four converted to 24
  assert.ok(processed.expandedTerms.includes("24"));
});

test("QA Retrieval: Section Target Detection", () => {
  assert.strictEqual(detectSectionTarget("What does Section 8 say about termination?"), "Section 8");
  assert.strictEqual(detectSectionTarget("According to Section 8.2, what happens?"), "Section 8.2");
  assert.strictEqual(detectSectionTarget("What is outlined in Schedule B?"), "Schedule B");
  assert.strictEqual(detectSectionTarget("Explain the termination clause."), "termination");
  assert.strictEqual(detectSectionTarget("How is the base salary calculated?"), null);
});

test("QA Retrieval: Legal Synonym Expansion", () => {
  const qTermination = processQuery("What is the notice period?");
  assert.ok(qTermination.expandedTerms.includes("termination"));
  assert.ok(qTermination.expandedTerms.includes("terminate"));

  const qSalary = processQuery("What is the base salary?");
  assert.ok(qSalary.expandedTerms.includes("compensation"));
  assert.ok(qSalary.expandedTerms.includes("remuneration"));

  const qNonCompete = processQuery("Is there a non-compete?");
  assert.ok(qNonCompete.expandedTerms.includes("competitive restriction"));
  assert.ok(qNonCompete.expandedTerms.includes("restrictive covenant"));

  const qArbitration = processQuery("Where is the arbitration seat?");
  assert.ok(qArbitration.expandedTerms.includes("dispute resolution"));
  assert.ok(qArbitration.expandedTerms.includes("mumbai"));
});

test("QA Retrieval: Strict Document Isolation Guard", () => {
  const mockChunk: DocumentChunk = {
    chunkId: "chk_other_1",
    chunkIndex: 0,
    text: "The notice period is thirty (30) days.",
    sectionId: "sec_term",
    sectionNumber: "8",
    sectionTitle: "Termination",
    pageNumbers: [8],
    startOffset: 0,
    endOffset: 50,
    characterCount: 50,
    wordCount: 8,
  };

  // Stamp a foreign documentId on chunk
  (mockChunk as unknown as Record<string, unknown>).documentId = "doc_other_company";

  const processed = processQuery("What is the notice period?");
  const result = scoreChunk(mockChunk, processed, "doc_active_user");

  assert.strictEqual(result.score, 0, "Chunk from foreign document must be scored 0");
  assert.ok(result.matchReasons.includes("rejected_cross_document"));
});

test("QA Retrieval: Benchmark Evaluation on Comprehensive Legal PDF", async () => {
  const pdfBuffer = fs.readFileSync(
    path.join(fixturesDir, "LexiGuide_AI_Comprehensive_Legal_Test_Contract.pdf")
  );
  const doc: NormalizedDocument = await processDocument(
    pdfBuffer,
    "LexiGuide_AI_Comprehensive_Legal_Test_Contract.pdf",
    "application/pdf"
  );

  assert.ok(doc.chunks.length > 50, `Expected >50 chunks, got ${doc.chunks.length}`);

  const retriever = new LexicalDocumentRetriever();

  // Test Negative / Not-Found Queries
  const negativeCases = QA_EVALUATION_DATASET.filter((c) => c.isNegative);
  for (const negCase of negativeCases) {
    const res = await retriever.retrieve(
      {
        documentId: doc.id,
        query: negCase.question,
        topK: 6,
        threshold: 3.0,
      },
      doc
    );

    // Negative questions must not find strong evidence
    const hasHighConfidenceMatch = res.retrievedChunks.some((c) => {
      const lower = c.text.toLowerCase();
      return negCase.expectedTerms.some((t) => lower.includes(t.toLowerCase()));
    });

    assert.strictEqual(
      hasHighConfidenceMatch,
      false,
      `Negative query "${negCase.question}" should not match absent terms`
    );
  }

  // Benchmark Recall@K on positive questions
  const positiveCases = QA_EVALUATION_DATASET.filter((c) => !c.isNegative);
  let hitsAt1 = 0;
  let hitsAt3 = 0;
  let hitsAt5 = 0;
  let hitsAt8 = 0;

  for (const posCase of positiveCases) {
    const res = await retriever.retrieve(
      {
        documentId: doc.id,
        query: posCase.question,
        topK: 8,
        threshold: 1.0,
      },
      doc
    );

    assert.ok(res.retrievedChunks.length > 0, `Expected retrieved chunks for "${posCase.question}"`);

    // Check rank of first hit matching expected terms or section keywords
    const hitIndex = res.retrievedChunks.findIndex((c) => {
      const chunkTextLower = c.text.toLowerCase();
      const secTitleLower = (c.sectionTitle || "").toLowerCase();

      const termMatch = posCase.expectedTerms.some((term) =>
        chunkTextLower.includes(term.toLowerCase())
      );
      const sectionMatch = posCase.expectedSectionKeywords.some((sec) =>
        secTitleLower.includes(sec.toLowerCase())
      );

      return termMatch || sectionMatch;
    });

    if (hitIndex === 0) hitsAt1++;
    if (hitIndex >= 0 && hitIndex < 3) hitsAt3++;
    if (hitIndex >= 0 && hitIndex < 5) hitsAt5++;
    if (hitIndex >= 0 && hitIndex < 8) hitsAt8++;

    assert.ok(
      hitIndex >= 0 && hitIndex < 8,
      `Expected relevant evidence in top 8 for question "${posCase.question}", got index ${hitIndex}`
    );
  }

  const recall1 = (hitsAt1 / positiveCases.length) * 100;
  const recall3 = (hitsAt3 / positiveCases.length) * 100;
  const recall5 = (hitsAt5 / positiveCases.length) * 100;
  const recall8 = (hitsAt8 / positiveCases.length) * 100;

  console.log(`\n================ RETRIEVAL BENCHMARK METRICS ================`);
  console.log(`Evaluated ${positiveCases.length} Grounded Legal Questions`);
  console.log(`Recall@1: ${recall1.toFixed(1)}% (${hitsAt1}/${positiveCases.length})`);
  console.log(`Recall@3: ${recall3.toFixed(1)}% (${hitsAt3}/${positiveCases.length})`);
  console.log(`Recall@5: ${recall5.toFixed(1)}% (${hitsAt5}/${positiveCases.length})`);
  console.log(`Recall@8: ${recall8.toFixed(1)}% (${hitsAt8}/${positiveCases.length})`);
  console.log(`=============================================================\n`);

  assert.ok(recall1 >= 60, `Expected Recall@1 >= 60%, got ${recall1}%`);
  assert.ok(recall5 >= 90, `Expected Recall@5 >= 90%, got ${recall5}%`);
  assert.ok(recall8 >= 95, `Expected Recall@8 >= 95%, got ${recall8}%`);
});
