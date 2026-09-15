import test from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { processDocument } from "@/lib/document-engine/pipeline";
import { compareDocuments } from "@/lib/comparison/comparison-service";
import {
  normalizeHeadingForComparison,
  extractSectionNumber,
  mapDocumentSections,
  classifyLegalCategory,
} from "@/lib/comparison/section-mapper";
import {
  normalizeTextForDiff,
  isSubstantivelyIdentical,
  extractNumericTokens,
  detectNegationShift,
  determineChangeSeverity,
  extractDiffHighlights,
} from "@/lib/comparison/diff-engine";
import {
  detectInternalInconsistencies,
  detectAllInconsistencies,
} from "@/lib/comparison/inconsistency-detector";
import { ComparisonEngineError } from "@/lib/comparison/errors";
import type { NormalizedDocument, DocumentSection, DocumentChunk } from "@/lib/document-engine/types";
import type { AiProvider, ChatMessage } from "@/lib/ai/client/types";

// Mock AI Provider
class MockComparisonAiProvider implements AiProvider {
  constructor(private readonly mockOutput: string) {}

  async generateChatCompletion(messages: ChatMessage[]): Promise<string> {
    assert.ok(messages.length >= 2);
    assert.strictEqual(messages[0].role, "system");
    assert.strictEqual(messages[1].role, "user");
    return this.mockOutput;
  }
}

// Helper to create mock NormalizedDocument
function createMockDoc(
  id: string,
  name: string,
  sectionsData: Array<{
    id: string;
    number: string;
    title: string;
    text: string;
    page?: number;
  }>
): NormalizedDocument {
  const sections: DocumentSection[] = [];
  const chunks: DocumentChunk[] = [];

  sectionsData.forEach((sd, idx) => {
    const chunkId = `chk_${id}_${sd.id}`;
    const page = sd.page || idx + 1;

    sections.push({
      sectionId: sd.id,
      sectionNumber: sd.number,
      title: sd.title,
      startOffset: idx * 500,
      endOffset: idx * 500 + sd.text.length,
      pageReferences: [page],
      chunkIds: [chunkId],
      characterCount: sd.text.length,
    });

    chunks.push({
      chunkId,
      chunkIndex: idx,
      text: sd.text,
      sectionId: sd.id,
      sectionNumber: sd.number,
      sectionTitle: sd.title,
      pageNumbers: [page],
      startOffset: idx * 500,
      endOffset: idx * 500 + sd.text.length,
      characterCount: sd.text.length,
      wordCount: sd.text.split(/\s+/).length,
    });
  });

  return {
    id,
    originalFilename: name,
    displayName: name,
    format: "pdf",
    mimeType: "application/pdf",
    sizeBytes: 1024 * 50,
    pageCount: sectionsData.length,
    characterCount: sectionsData.reduce((acc, s) => acc + s.text.length, 0),
    wordCount: sectionsData.reduce((acc, s) => acc + s.text.split(/\s+/).length, 0),
    lineCount: sectionsData.length * 5,
    paragraphCount: sectionsData.length,
    uploadedAt: new Date().toISOString(),
    status: "analyzed",
    extractedMetadata: {
      title: name,
      author: undefined,
      creationDate: undefined,
      modificationDate: undefined,
      producer: undefined,
    },
    sections,
    chunks,
    pages: [],
    source: "user-upload",
  };
}

// 1. Heading Normalization & Section Number Matching
test("Heading Normalizer & Section Number Matcher", () => {
  assert.strictEqual(normalizeHeadingForComparison("8. Termination"), "termination");
  assert.strictEqual(normalizeHeadingForComparison("Section 8: Termination and Notice"), "termination and notice");
  assert.strictEqual(normalizeHeadingForComparison("Clause 8 (Termination & Notice)"), "termination and notice");
  assert.strictEqual(normalizeHeadingForComparison("ARTICLE VIII — TERMINATION"), "termination");

  const sec8: DocumentSection = {
    sectionId: "s8",
    sectionNumber: "8.1",
    title: "8.1 Termination for Convenience",
    startOffset: 0,
    endOffset: 50,
    pageReferences: [1],
    chunkIds: ["c1"],
    characterCount: 50,
  };
  assert.strictEqual(extractSectionNumber(sec8), "8.1");
});

// 2. Deterministic Diff & Numeric Token Extraction
test("Deterministic Diff: Numeric tokens, negations, and qualifiers", () => {
  const textA = "Employee shall receive base salary of ₹2,400,000 per annum with 30 days' written notice.";
  const textB = "Employee shall receive base salary of ₹2,800,000 per annum with 90 days' written notice.";

  const numsA = extractNumericTokens(textA);
  const numsB = extractNumericTokens(textB);
  assert.ok(numsA.includes("₹2,400,000"));
  assert.ok(numsA.includes("30 days"));
  assert.ok(numsB.includes("₹2,800,000"));
  assert.ok(numsB.includes("90 days"));

  const highlights = extractDiffHighlights(textA, textB);
  assert.strictEqual(highlights.highlightA, "₹2,400,000");
  assert.strictEqual(highlights.highlightB, "₹2,800,000");

  assert.strictEqual(detectNegationShift("Employee shall work", "Employee shall not work"), true);
  assert.strictEqual(detectNegationShift("with consent", "without consent"), true);
  assert.strictEqual(detectNegationShift("permitted activities", "prohibited activities"), true);
  assert.strictEqual(detectNegationShift("standard salary", "standard salary"), false);
});

// 3. Substantive Identity Test (Unchanged Clause)
test("Deterministic Diff: Identical clause text is identified as UNCHANGED", () => {
  const textA = "Each party agrees to maintain confidentiality for five (5) years following termination.";
  const textB = "Each party agrees to maintain confidentiality for five (5) years following termination.";
  assert.strictEqual(isSubstantivelyIdentical(textA, textB), true);
});

// 4. Severity Classification
test("Severity Classification assigns major to high-stakes changes", () => {
  const sevTermination = determineChangeSeverity(
    "Termination",
    "30 days notice",
    "90 days notice",
    "modified"
  );
  assert.strictEqual(sevTermination, "major");

  const sevSalary = determineChangeSeverity(
    "Compensation",
    "₹2,400,000",
    "₹2,800,000",
    "modified"
  );
  assert.strictEqual(sevSalary, "major");

  const sevMinor = determineChangeSeverity(
    "General",
    "Notices may be sent by courier.",
    "Notices may be sent by courier or registered post.",
    "modified"
  );
  assert.strictEqual(sevMinor, "minor");
});

// 5. Internal Inconsistency Detection
test("Inconsistency Detector: Flags conflicting terms within a single document", () => {
  const docWithConflict = createMockDoc("doc_conf", "Agreement_With_Conflict.pdf", [
    {
      id: "sec4",
      number: "4",
      title: "Section 4: Payment Terms",
      text: "All undisputed invoices shall be paid within thirty (30) days of receipt.",
      page: 3,
    },
    {
      id: "sched_b",
      number: "Schedule B",
      title: "Schedule B: Invoicing & Disbursement",
      text: "Payment of all vendor invoices shall be executed within fifteen (15) days of receipt.",
      page: 12,
    },
  ]);

  const inconsistencies = detectInternalInconsistencies(docWithConflict);
  assert.strictEqual(inconsistencies.length, 1);
  assert.strictEqual(inconsistencies[0].title, "Potential Inconsistency in Payment Deadline");
  assert.strictEqual(inconsistencies[0].inconsistencyType, "internal");
  assert.strictEqual(inconsistencies[0].provisionA.pageNumber, 3);
  assert.strictEqual(inconsistencies[0].provisionB.pageNumber, 12);
  assert.ok(inconsistencies[0].explanation.includes("30 days"));
  assert.ok(inconsistencies[0].explanation.includes("15 days"));
});

// 6. False Positive Prevention for Inconsistencies
test("Inconsistency Detector: Does not flag clauses with explicit carve-outs", () => {
  const docCarveout = createMockDoc("doc_safe", "Agreement_Carveout.pdf", [
    {
      id: "sec4",
      number: "4",
      title: "Section 4: Payment Terms",
      text: "All invoices shall be payable within 30 days, except as otherwise provided in Schedule B for expedited services.",
      page: 3,
    },
    {
      id: "sched_b",
      number: "Schedule B",
      title: "Schedule B: Expedited Services",
      text: "Notwithstanding standard payment terms, expedited service fees shall be payable within 15 days.",
      page: 12,
    },
  ]);

  const inconsistencies = detectInternalInconsistencies(docCarveout);
  assert.strictEqual(inconsistencies.length, 0);
});

// 7. Full End-to-End Comparison Pipeline with Mock AI
test("Full Comparison: Added, Removed, Modified, and Unchanged clauses with AI explanation", async () => {
  const docA = createMockDoc("doc_a", "Contract_A_Original.pdf", [
    {
      id: "s1",
      number: "1",
      title: "1. Term and Duration",
      text: "This agreement shall commence on January 1, 2026 and continue for a term of 2 years.",
      page: 1,
    },
    {
      id: "s2",
      number: "2",
      title: "2. Base Compensation",
      text: "Employee shall be paid an annual base salary of ₹2,400,000 payable monthly.",
      page: 2,
    },
    {
      id: "s3",
      number: "3",
      title: "3. Termination Notice",
      text: "Either party may terminate this agreement by providing thirty (30) days' written notice.",
      page: 3,
    },
    {
      id: "s4",
      number: "4",
      title: "4. Confidentiality",
      text: "Both parties agree to preserve confidential information for five (5) years post-termination.",
      page: 4,
    },
    {
      id: "s5",
      number: "5",
      title: "5. Non-Solicitation",
      text: "Employee shall not solicit company clients for twelve (12) months following termination.",
      page: 5,
    },
  ]);

  const docB = createMockDoc("doc_b", "Contract_B_Revised.pdf", [
    {
      id: "s1",
      number: "1",
      title: "1. Term and Duration",
      text: "This agreement shall commence on January 1, 2026 and continue for a term of 2 years.", // UNCHANGED
      page: 1,
    },
    {
      id: "s2",
      number: "2",
      title: "2. Base Compensation",
      text: "Employee shall be paid an annual base salary of ₹2,800,000 payable monthly.", // MODIFIED amount
      page: 2,
    },
    {
      id: "s3",
      number: "3",
      title: "3. Termination Notice",
      text: "Either party may terminate this agreement by providing ninety (90) days' written notice.", // MODIFIED deadline
      page: 3,
    },
    {
      id: "s4",
      number: "4",
      title: "4. Confidentiality",
      text: "Both parties agree to preserve confidential information for five (5) years post-termination.", // UNCHANGED
      page: 4,
    },
    // s5 Non-Solicitation omitted -> REMOVED
    {
      id: "s6",
      number: "6",
      title: "6. Data Protection and Cybersecurity",
      text: "The service provider shall maintain ISO 27001 compliance and notify security incidents within 72 hours.", // ADDED
      page: 5,
    },
  ]);

  const mockAiOutput = JSON.stringify({
    changes: [
      {
        changeId: "chg_1",
        title: "2. Base Compensation",
        severity: "major",
        explanation: "Annual base compensation increased from ₹2,400,000 to ₹2,800,000.",
        whyItMatters: "This revision increases the employer's fixed annual salary commitment by ₹400,000.",
        suggestedReviewQuestion: "Does the revised salary align with the approved department compensation budget?",
      },
      {
        changeId: "chg_2",
        title: "3. Termination Notice",
        severity: "major",
        explanation: "Notice period required for termination increased from 30 days to 90 days.",
        whyItMatters: "Tripling the notice duration significantly extends operational transition requirements.",
        suggestedReviewQuestion: "Is a 90-day notice period acceptable for mutual operational continuity?",
      },
    ],
    inconsistencies: [],
  });

  const mockProvider = new MockComparisonAiProvider(mockAiOutput);

  const result = await compareDocuments(docA, docB, {
    requestId: "test_cmp_001",
    aiProvider: mockProvider,
  });

  // Verify Metrics
  assert.strictEqual(result.documentA.name, "Contract_A_Original.pdf");
  assert.strictEqual(result.documentB.name, "Contract_B_Revised.pdf");
  assert.strictEqual(result.unchangedSections.length, 2); // Term & Duration + Confidentiality
  assert.ok(result.changes.length >= 4); // 2 modified + 1 removed + 1 added

  // Verify Unchanged Sections
  const unchangedTitles = result.unchangedSections.map((u) => u.title);
  assert.ok(unchangedTitles.includes("1. Term and Duration"));
  assert.ok(unchangedTitles.includes("4. Confidentiality"));

  // Verify Removed Clause
  const removed = result.changes.find((c) => c.status === "removed");
  assert.ok(removed);
  assert.strictEqual(removed.clauseTitle, "5. Non-Solicitation");
  assert.strictEqual(removed.sectionB, "Omitted / Replaced");

  // Verify Added Clause
  const added = result.changes.find((c) => c.status === "added");
  assert.ok(added);
  assert.strictEqual(added.clauseTitle, "6. Data Protection and Cybersecurity");
  assert.strictEqual(added.sectionA, "Not in Document A");

  // Verify Modified Clause with AI enrichment
  const salaryChange = result.changes.find((c) => c.clauseTitle.includes("Base Compensation"));
  assert.ok(salaryChange);
  assert.strictEqual(salaryChange.changeSeverity, "major");
  assert.strictEqual(salaryChange.summaryChange, "Annual base compensation increased from ₹2,400,000 to ₹2,800,000.");
  assert.ok(salaryChange.whyItMatters?.includes("₹400,000"));
  assert.ok(salaryChange.suggestedReviewQuestion?.includes("compensation budget"));

  // Verify Source Evidence Isolation
  assert.strictEqual(salaryChange.sourceA?.documentId, "doc_a");
  assert.strictEqual(salaryChange.sourceB?.documentId, "doc_b");
  assert.strictEqual(salaryChange.pageA, 2);
  assert.strictEqual(salaryChange.pageB, 2);
  assert.strictEqual(salaryChange.sourceA?.verified, true);
  assert.strictEqual(salaryChange.sourceB?.verified, true);

  // Verify Diagnostics
  assert.ok(result.diagnostics);
  assert.strictEqual(result.diagnostics.comparisonRequestId, "test_cmp_001");
  assert.strictEqual(result.diagnostics.aiUsed, true);
  assert.strictEqual(result.diagnostics.aiCallCount, 1);
});

// 8. Same Document Protection
test("Same Document Protection rejects comparing a document to itself", async () => {
  const docA = createMockDoc("doc_self", "Contract.pdf", [
    { id: "s1", number: "1", title: "Terms", text: "Some text" },
  ]);

  await assert.rejects(
    async () => {
      await compareDocuments(docA, docA);
    },
    (err: unknown) => {
      assert.ok(err instanceof ComparisonEngineError);
      assert.strictEqual(err.code, "COMPARISON_CONFLICT");
      assert.strictEqual(err.statusCode, 409);
      return true;
    }
  );
});

// 9. Document Invalid Protection
test("Document Invalid Protection rejects documents without chunks", async () => {
  const docA = createMockDoc("doc_a", "DocA.pdf", [
    { id: "s1", number: "1", title: "Terms", text: "Text" },
  ]);
  const docEmptyChunks: NormalizedDocument = {
    ...docA,
    id: "doc_empty",
    chunks: [],
  };

  await assert.rejects(
    async () => {
      await compareDocuments(docA, docEmptyChunks);
    },
    (err: unknown) => {
      assert.ok(err instanceof ComparisonEngineError);
      assert.strictEqual(err.code, "DOCUMENT_INVALID");
      assert.strictEqual(err.statusCode, 422);
      return true;
    }
  );
});

// 10. AI Failure Graceful Fallback
test("AI Failure Graceful Fallback preserves deterministic comparison when AI fails", async () => {
  const docA = createMockDoc("doc_a", "ContractA.pdf", [
    { id: "s1", number: "1", title: "Notice", text: "30 days notice" },
  ]);
  const docB = createMockDoc("doc_b", "ContractB.pdf", [
    { id: "s1", number: "1", title: "Notice", text: "90 days notice" },
  ]);

  class FailingAiProvider implements AiProvider {
    async generateChatCompletion(): Promise<string> {
      throw new Error("HTTP 503 Provider Unavailable");
    }
  }

  const result = await compareDocuments(docA, docB, {
    aiProvider: new FailingAiProvider(),
  });

  assert.strictEqual(result.changes.length, 1);
  assert.strictEqual(result.changes[0].changeSeverity, "major");
  assert.ok(result.changes[0].whyItMatters);
  assert.strictEqual(result.diagnostics?.aiUsed, false);
  assert.ok(result.diagnostics?.aiError?.includes("503"));
});

// 11. Comparison Regression with Real Test PDF
test("Comparison Regression with Real Test PDF: detects known modifications", async () => {
  const pdfPath = path.resolve(process.cwd(), "tests/fixtures/LexiGuide_AI_Comprehensive_Legal_Test_Contract.pdf");
  const buffer = fs.readFileSync(pdfPath);
  const docA = await processDocument(buffer, "LexiGuide_AI_Comprehensive_Legal_Test_Contract.pdf", "application/pdf");

  assert.ok(docA.sections.length > 5);
  assert.ok(docA.chunks.length > 20);

  // Create controlled modified version Doc B
  const docB: NormalizedDocument = {
    ...docA,
    id: "doc_test_pdf_b",
    displayName: "LexiGuide_AI_Comprehensive_Legal_Test_Contract_Updated.pdf",
    sections: docA.sections.map((sec) => ({ ...sec })),
    chunks: docA.chunks.map((chk) => {
      let text = chk.text;
      // 1. Base salary: ₹2,400,000 -> ₹2,800,000
      if (text.includes("2,400,000")) {
        text = text.replace(/2,400,000/g, "2,800,000");
      }
      // 2. Notice: 30 days -> 90 days
      if (text.includes("30 days")) {
        text = text.replace(/30 days/g, "90 days");
      }
      // 3. Arbitration: Mumbai -> Bengaluru
      if (text.includes("Mumbai")) {
        text = text.replace(/Mumbai/g, "Bengaluru");
      }
      // 4. Confidentiality: 5 years -> 3 years
      if (text.includes("5 years") || text.includes("five (5) years")) {
        text = text.replace(/five \(5\) years/g, "three (3) years").replace(/5 years/g, "3 years");
      }
      return { ...chk, text };
    }),
  };

  // Add new clause to Doc B
  const newSecId = "sec_cyber_new";
  const newChunkId = "chk_cyber_new";
  docB.sections.push({
    sectionId: newSecId,
    sectionNumber: "99",
    title: "Section 99: Cybersecurity Incident Disclosure",
    startOffset: 99999,
    endOffset: 100500,
    pageReferences: [docA.pageCount || 10],
    chunkIds: [newChunkId],
    characterCount: 200,
  });
  docB.chunks.push({
    chunkId: newChunkId,
    chunkIndex: docB.chunks.length,
    text: "Vendor must notify all cybersecurity incidents and data breaches within 24 hours.",
    sectionId: newSecId,
    sectionNumber: "99",
    sectionTitle: "Section 99: Cybersecurity Incident Disclosure",
    pageNumbers: [docA.pageCount || 10],
    startOffset: 99999,
    endOffset: 100500,
    characterCount: 200,
    wordCount: 15,
  });

  // Remove one section from Doc B
  const removedSection = docB.sections[docB.sections.length - 2];
  docB.sections = docB.sections.filter((s) => s.sectionId !== removedSection.sectionId);
  docB.chunks = docB.chunks.filter((c) => c.sectionId !== removedSection.sectionId);

  const result = await compareDocuments(docA, docB, { skipAi: true });

  assert.ok(result.changes.length >= 3);
  assert.ok(result.metrics.changesIdentified >= 3);
  assert.ok(result.unchangedSections.length > 0);

  // Check that salary change was identified
  const salaryDiff = result.changes.find(
    (c) => c.clauseTitle.toLowerCase().includes("compensat") || c.docBContent.includes("2,800,000")
  );
  assert.ok(salaryDiff, "Salary modification must be detected");
  assert.strictEqual(salaryDiff.changeSeverity, "major");

  // Check that added clause was detected
  const addedDiff = result.changes.find((c) => c.status === "added" && c.clauseTitle.includes("Cybersecurity"));
  assert.ok(addedDiff, "Added Cybersecurity section must be detected");

  // Check that removed section was detected
  const removedDiff = result.changes.find((c) => c.status === "removed" && c.clauseTitle === removedSection.title);
  assert.ok(removedDiff, "Removed section must be detected");
});
