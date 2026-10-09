import test from "node:test";
import assert from "node:assert";
import { compareDocuments } from "@/lib/comparison/comparison-service";
import type { NormalizedDocument, DocumentSection, DocumentChunk } from "@/lib/document-engine/types";
import type { AiProvider, ChatMessage, ChatCompletionResult } from "@/lib/ai/client/types";

// Mock Groq AI provider for comparison enrichment
class MockGroqComparisonProvider implements AiProvider {
  async generateChatCompletion(messages: ChatMessage[]): Promise<string> {
    const detailed = await this.generateChatCompletionDetailed(messages);
    return detailed.content;
  }

  async generateChatCompletionDetailed(messages: ChatMessage[]): Promise<ChatCompletionResult> {
    assert.ok(messages.length >= 2);
    assert.strictEqual(messages[0].role, "system");
    assert.strictEqual(messages[1].role, "user");

    const responseJson = JSON.stringify({
      changes: [
        {
          changeId: "chk_docA_sec_invoice_vs_chk_docB_sec_invoice",
          explanation: "Payment deadline shortened from 30 days to 15 days.",
          whyItMatters: "Accelerates payment cycle, requiring faster processing of invoices.",
          suggestedReviewQuestion: "Can the accounts payable workflow accommodate a 15-day turnaround?",
          severity: "major",
        },
        {
          changeId: "chk_docA_sec_term_vs_chk_docB_sec_term",
          explanation: "Termination notice period extended from 30 days to 60 days.",
          whyItMatters: "Doubles the mandatory notice requirement prior to contractual separation.",
          suggestedReviewQuestion: "Does the extended 60-day notice align with business transition planning?",
          severity: "major",
        },
        {
          changeId: "chk_docA_sec_retention_vs_chk_docB_sec_retention",
          explanation: "Retention award increased from INR 600,000 to INR 750,000.",
          whyItMatters: "Increases the financial retention incentive upon satisfying continuous service conditions.",
          suggestedReviewQuestion: "Has the increased award budget been approved by compensation committee?",
          severity: "major",
        },
        {
          changeId: "chk_docA_sec_confidentiality_vs_chk_docB_sec_confidentiality",
          explanation: "Confidentiality protection term reduced from 5 years to 3 years.",
          whyItMatters: "Shortens the post-termination trade secret and confidential information protection window.",
          suggestedReviewQuestion: "Is a 3-year confidentiality term sufficient to protect proprietary technical assets?",
          severity: "moderate",
        },
      ],
      inconsistencies: [],
    });

    return {
      content: responseJson,
      finishReason: "stop",
      ttftMs: 25,
      totalDurationMs: 45,
      model: "openai/gpt-oss-120b",
      estimatedOutputTokens: 180,
    };
  }
}

function buildControlledTestDoc(
  id: string,
  name: string,
  clauses: Array<{ id: string; number: string; title: string; text: string; page: number }>
): NormalizedDocument {
  const sections: DocumentSection[] = [];
  const chunks: DocumentChunk[] = [];

  clauses.forEach((c, idx) => {
    const chunkId = `chk_${id}_${c.id}`;
    sections.push({
      sectionId: c.id,
      sectionNumber: c.number,
      title: c.title,
      startOffset: idx * 300,
      endOffset: idx * 300 + c.text.length,
      pageReferences: [c.page],
      chunkIds: [chunkId],
      characterCount: c.text.length,
    });
    chunks.push({
      chunkId,
      chunkIndex: idx,
      text: c.text,
      sectionId: c.id,
      sectionNumber: c.number,
      sectionTitle: c.title,
      pageNumbers: [c.page],
      startOffset: idx * 300,
      endOffset: idx * 300 + c.text.length,
      characterCount: c.text.length,
      wordCount: c.text.split(/\s+/).length,
    });
  });

  return {
    id,
    originalFilename: name,
    displayName: name,
    format: "pdf",
    mimeType: "application/pdf",
    sizeBytes: 1024 * 30,
    pageCount: 6,
    characterCount: clauses.reduce((acc, c) => acc + c.text.length, 0),
    wordCount: clauses.reduce((acc, c) => acc + c.text.split(/\s+/).length, 0),
    lineCount: clauses.length * 4,
    paragraphCount: clauses.length,
    uploadedAt: new Date().toISOString(),
    status: "analyzed",
    extractedMetadata: {
      title: name,
    },
    sections,
    chunks,
    pages: [],
    source: "user-upload",
  };
}

test("Controlled Comparison Fixture: Accurately detects the 4 controlled changes without false positives", async () => {
  // Document A: Baseline Contract
  const docA = buildControlledTestDoc("docA", "Executive_Agreement_Original.pdf", [
    {
      id: "sec_invoice",
      number: "4",
      title: "Section 4: Invoicing and Payment Terms",
      text: "All undisputed invoices shall be paid within thirty (30) days of receipt.",
      page: 2,
    },
    {
      id: "sec_term",
      number: "7",
      title: "Section 7: Term and Termination",
      text: "Either party may terminate this agreement by providing thirty (30) days' prior written notice.",
      page: 4,
    },
    {
      id: "sec_retention",
      number: "Schedule F",
      title: "Schedule F: Retention Incentive",
      text: "If the Executive remains continuously employed through the vesting date, the Company will pay a retention award of INR 600,000.",
      page: 5,
    },
    {
      id: "sec_confidentiality",
      number: "9",
      title: "Section 9: Confidentiality Covenants",
      text: "The confidentiality obligations set forth herein shall survive for a period of five (5) years following termination.",
      page: 3,
    },
    {
      id: "sec_gov_law",
      number: "12",
      title: "Section 12: Governing Law",
      text: "This agreement shall be governed by and construed in accordance with the substantive laws of India.",
      page: 6,
    },
    {
      id: "sec_non_solicit",
      number: "10",
      title: "Section 10: Non-Solicitation",
      text: "The Executive agrees not to solicit employees or contractors of the Company for a period of 12 months following termination.",
      page: 4,
    },
  ]);

  // Document B: Revised Contract with the 4 intended changes
  // 1. Invoice deadline: 30 days -> 15 days
  // 2. Termination notice: 30 days -> 60 days
  // 3. Retention award: INR 600,000 -> INR 750,000
  // 4. Confidentiality period: 5 years -> 3 years
  const docB = buildControlledTestDoc("docB", "Executive_Agreement_Revised.pdf", [
    {
      id: "sec_invoice",
      number: "4",
      title: "Section 4: Invoicing and Payment Terms",
      text: "All undisputed invoices shall be paid within fifteen (15) days of receipt.",
      page: 2,
    },
    {
      id: "sec_term",
      number: "7",
      title: "Section 7: Term and Termination",
      text: "Either party may terminate this agreement by providing sixty (60) days' prior written notice.",
      page: 4,
    },
    {
      id: "sec_retention",
      number: "Schedule F",
      title: "Schedule F: Retention Incentive",
      text: "If the Executive remains continuously employed through the vesting date, the Company will pay a retention award of INR 750,000.",
      page: 5,
    },
    {
      id: "sec_confidentiality",
      number: "9",
      title: "Section 9: Confidentiality Covenants",
      text: "The confidentiality obligations set forth herein shall survive for a period of three (3) years following termination.",
      page: 3,
    },
    {
      id: "sec_gov_law",
      number: "12",
      title: "Section 12: Governing Law",
      text: "This agreement shall be governed by and construed in accordance with the substantive laws of India.",
      page: 6,
    },
    {
      id: "sec_non_solicit",
      number: "10",
      title: "Section 10: Non-Solicitation",
      text: "The Executive agrees not to solicit employees or contractors of the Company for a period of 12 months following termination.",
      page: 4,
    },
  ]);

  const mockProvider = new MockGroqComparisonProvider();
  const comparisonResult = await compareDocuments(docA, docB, {
    aiProvider: mockProvider,
    requestId: "test_controlled_comparison_groq",
  });

  // Verification 1: Exactly 4 modified clauses detected
  assert.strictEqual(comparisonResult.changes.length, 4, "Must detect exactly 4 modified clauses");
  assert.strictEqual(comparisonResult.metrics.changesIdentified, 4);

  // Verification 2: Exactly 2 unchanged sections detected (Governing Law and Non-Solicitation)
  assert.strictEqual(comparisonResult.unchangedSections.length, 2, "Unchanged sections must be 2");
  assert.strictEqual(comparisonResult.metrics.unchangedCount, 2);

  // Verification 3: Change 1 — Invoice deadline: 30 days to 15 days
  const invoiceChange = comparisonResult.changes.find(
    (c) => c.sectionA.includes("4") || c.clauseTitle.toLowerCase().includes("invoic")
  );
  assert.ok(invoiceChange, "Invoice change must be identified");
  assert.ok(invoiceChange.docAContent.includes("thirty (30) days"));
  assert.ok(invoiceChange.docBContent.includes("fifteen (15) days"));
  assert.strictEqual(invoiceChange.status, "modified");

  // Verification 4: Change 2 — Termination notice: 30 days to 60 days
  const terminationChange = comparisonResult.changes.find(
    (c) => c.sectionA.includes("7") || c.clauseTitle.toLowerCase().includes("termination")
  );
  assert.ok(terminationChange, "Termination notice change must be identified");
  assert.ok(terminationChange.docAContent.includes("thirty (30) days"));
  assert.ok(terminationChange.docBContent.includes("sixty (60) days"));
  assert.strictEqual(terminationChange.status, "modified");

  // Verification 5: Change 3 — Retention award: INR 600,000 to INR 750,000
  const retentionChange = comparisonResult.changes.find(
    (c) => c.sectionA.toLowerCase().includes("schedule f") || c.clauseTitle.toLowerCase().includes("retention")
  );
  assert.ok(retentionChange, "Retention award change must be identified");
  assert.ok(retentionChange.docAContent.includes("600,000"));
  assert.ok(retentionChange.docBContent.includes("750,000"));
  assert.strictEqual(retentionChange.status, "modified");

  // Verification 6: Change 4 — Confidentiality period: 5 years to 3 years
  const confidentialityChange = comparisonResult.changes.find(
    (c) => c.sectionA.includes("9") || c.clauseTitle.toLowerCase().includes("confidentiality")
  );
  assert.ok(confidentialityChange, "Confidentiality period change must be identified");
  assert.ok(confidentialityChange.docAContent.includes("five (5) years"));
  assert.ok(confidentialityChange.docBContent.includes("three (3) years"));
  assert.strictEqual(confidentialityChange.status, "modified");

  // Verification 7: AI enrichment merged correctly from Groq provider
  assert.ok(comparisonResult.diagnostics, "Diagnostics must be present");
  assert.ok(comparisonResult.diagnostics.aiUsed, "AI must be marked as used");
  assert.strictEqual(comparisonResult.diagnostics.aiCallCount, 1, "Exactly 1 AI call");
  assert.strictEqual(comparisonResult.diagnostics.ttftMs, 25);
  assert.strictEqual(comparisonResult.diagnostics.groqTtftMs, 25);
  assert.strictEqual(comparisonResult.diagnostics.nvidiaTtftMs, 25);

  // Verification 8: Document isolation preserved (docA !== docB)
  assert.strictEqual(comparisonResult.documentA.id, "docA");
  assert.strictEqual(comparisonResult.documentB.id, "docB");
});
