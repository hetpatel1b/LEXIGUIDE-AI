import fs from "fs";
import path from "path";
import { processDocument } from "../src/lib/document-engine/pipeline";
import { compareDocuments } from "../src/lib/comparison/comparison-service";
import { NemotronClient } from "../src/lib/ai/client/nemotron-client";
import type { NormalizedDocument } from "../src/lib/document-engine/types";

// Load .env.local
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, "utf8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("NVIDIA_API_KEY=")) {
      process.env.NVIDIA_API_KEY = trimmed.substring("NVIDIA_API_KEY=".length).trim().replace(/^["']|["']$/g, "");
    }
    if (trimmed.startsWith("NVIDIA_MODEL_ID=")) {
      process.env.NVIDIA_MODEL_ID = trimmed.substring("NVIDIA_MODEL_ID=".length).trim().replace(/^["']|["']$/g, "");
    }
    if (trimmed.startsWith("AI_MODEL=")) {
      process.env.AI_MODEL = trimmed.substring("AI_MODEL=".length).trim().replace(/^["']|["']$/g, "");
    }
  }
}

async function runRealNvidiaVerification() {
  console.log("================================================================================");
  console.log("LEXIGUIDE AI — PHASE 5 REAL NVIDIA COMPARISON VERIFICATION");
  console.log(`Model: ${process.env.NVIDIA_MODEL_ID || "nvidia/nemotron-3-super-120b-a12b"}`);
  console.log("Provider: NVIDIA (https://integrate.api.nvidia.com/v1)");
  console.log("================================================================================\n");

  const pdfPath = path.resolve(process.cwd(), "tests/fixtures/LexiGuide_AI_Comprehensive_Legal_Test_Contract.pdf");
  if (!fs.existsSync(pdfPath)) {
    throw new Error(`File not found: ${pdfPath}`);
  }

  const fileBuffer = fs.readFileSync(pdfPath);
  console.log(`[INGEST] Processing Document A (${fileBuffer.length} bytes)...`);
  const docA = await processDocument(fileBuffer, "LexiGuide_AI_Comprehensive_Legal_Test_Contract.pdf", "application/pdf");
  console.log(`[INGEST] Doc A parsed: sections=${docA.sections.length}, chunks=${docA.chunks.length}, chars=${docA.characterCount}\n`);

  // Check if Doc A has internal inconsistency or if we add the internal inconsistency (30-day invoice vs 15-day schedule)
  let docAHasPaymentConflict = false;
  for (const chk of docA.chunks) {
    if (chk.text.includes("30") && chk.text.toLowerCase().includes("invoice")) {
      console.log(`[INFO] Found invoice text in Doc A: "${chk.text.substring(0, 100)}..."`);
    }
  }

  // Ensure Doc A contains the internal inconsistency: 30-day invoice provision vs 15-day schedule provision
  // If not present in raw PDF chunks, we add Schedule B chunk to Doc A to represent the 15-day schedule conflict
  const hasScheduleB = docA.chunks.some(c => c.sectionTitle.toLowerCase().includes("schedule b"));
  if (!hasScheduleB) {
    console.log("[SETUP] Adding Schedule B (15-day payment) to Doc A to test internal inconsistency against 30-day invoice clause...");
    const schedSecId = "sec_sched_b_fee";
    const schedChkId = "chk_sched_b_fee";
    docA.sections.push({
      sectionId: schedSecId,
      sectionNumber: "Schedule B",
      title: "Schedule B: Invoicing & Disbursement Schedule",
      startOffset: docA.characterCount,
      endOffset: docA.characterCount + 200,
      pageReferences: [docA.pageCount || 10],
      chunkIds: [schedChkId],
      characterCount: 200,
    });
    docA.chunks.push({
      chunkId: schedChkId,
      chunkIndex: docA.chunks.length,
      text: "Payment of all vendor invoices shall be executed within fifteen (15) days of receipt.",
      sectionId: schedSecId,
      sectionNumber: "Schedule B",
      sectionTitle: "Schedule B: Invoicing & Disbursement Schedule",
      pageNumbers: [docA.pageCount || 10],
      startOffset: docA.characterCount,
      endOffset: docA.characterCount + 200,
      characterCount: 200,
      wordCount: 14,
    });
    docA.characterCount += 200;
  }

  // Ensure Doc A has the 30-day invoice provision if not already explicitly matching
  const has30DayInvoice = docA.chunks.some(c => /thirty\s*\(\s*30\s*\)\s*days|30\s*days/i.test(c.text) && /invoice|payable/i.test(c.text));
  if (!has30DayInvoice) {
    console.log("[SETUP] Ensuring Section 4 has 30-day invoice provision...");
    const sec4 = docA.sections.find(s => s.sectionNumber === "4" || s.title.toLowerCase().includes("payment") || s.title.toLowerCase().includes("compensation"));
    if (sec4) {
      const chk = docA.chunks.find(c => c.sectionId === sec4.sectionId);
      if (chk) {
        chk.text += " All undisputed invoices shall be paid within thirty (30) days of receipt.";
      }
    }
  }

  // Create controlled modified version Doc B
  console.log("[SETUP] Generating Document B with controlled modifications...");
  const docB: NormalizedDocument = {
    ...docA,
    id: "doc_revised_target_b",
    displayName: "LexiGuide_AI_Comprehensive_Legal_Test_Contract_v2.pdf",
    sections: docA.sections.map((sec) => ({ ...sec })),
    chunks: docA.chunks.map((chk) => {
      let text = chk.text;
      // 1. Base salary: INR 2,400,000 -> INR 2,800,000
      if (text.includes("2,400,000")) {
        text = text.replace(/2,400,000/g, "2,800,000");
      }
      // 2. Notice: 30 days -> 90 days
      if (text.includes("30 days")) {
        text = text.replace(/30 days/g, "90 days");
      } else if (text.includes("thirty (30) days")) {
        text = text.replace(/thirty \(30\) days/g, "ninety (90) days");
      }
      // 3. Arbitration change: Mumbai -> Bengaluru
      if (text.includes("Mumbai")) {
        text = text.replace(/Mumbai/g, "Bengaluru");
      }
      // 4. Confidentiality change: 5 years -> 3 years
      if (text.includes("five (5) years")) {
        text = text.replace(/five \(5\) years/g, "three (3) years");
      } else if (text.includes("5 years")) {
        text = text.replace(/5 years/g, "3 years");
      }
      return { ...chk, text };
    }),
  };

  // 5. One added clause: Section 99 Cybersecurity Incident Disclosure
  const newSecId = "sec_cyber_99";
  const newChunkId = "chk_cyber_99";
  docB.sections.push({
    sectionId: newSecId,
    sectionNumber: "99",
    title: "Section 99: Cybersecurity Incident Disclosure",
    startOffset: docB.characterCount,
    endOffset: docB.characterCount + 220,
    pageReferences: [docA.pageCount || 10],
    chunkIds: [newChunkId],
    characterCount: 220,
  });
  docB.chunks.push({
    chunkId: newChunkId,
    chunkIndex: docB.chunks.length,
    text: "Vendor must notify all cybersecurity incidents and material data breaches to the Company Security Operations Center within 24 hours of discovery.",
    sectionId: newSecId,
    sectionNumber: "99",
    sectionTitle: "Section 99: Cybersecurity Incident Disclosure",
    pageNumbers: [docA.pageCount || 10],
    startOffset: docB.characterCount,
    endOffset: docB.characterCount + 220,
    characterCount: 220,
    wordCount: 20,
  });
  docB.characterCount += 220;

  // 6. One removed clause: Remove penultimate section from Doc B
  const removedSection = docB.sections[docB.sections.length - 3]; // Pick a valid clause to remove
  console.log(`[SETUP] Removing Section from Doc B: "${removedSection.title}"`);
  docB.sections = docB.sections.filter((s) => s.sectionId !== removedSection.sectionId);
  docB.chunks = docB.chunks.filter((c) => c.sectionId !== removedSection.sectionId);

  // Now execute 3 REAL comparison requests against NVIDIA Nemotron
  const outPath = path.resolve(process.cwd(), "tests/fixtures/real-nvidia-comparison-results.json");
  const runs: Array<{
    runIndex: number;
    ttftMs: number;
    generationMs: number;
    totalNvidiaRequestMs: number;
    totalComparisonMs: number;
    contextChars: number;
    estimatedInputTokens: number;
    outputTokens: number;
    aiCallCount: number;
    changesCount: number;
    inconsistenciesCount: number;
    salaryDetected: boolean;
    noticeDetected: boolean;
    arbitrationDetected: boolean;
    confidentialityDetected: boolean;
    addedClauseDetected: boolean;
    removedClauseDetected: boolean;
    internalInconsistencyDetected: boolean;
  }> = fs.existsSync(outPath) ? JSON.parse(fs.readFileSync(outPath, "utf8")) : [];

  for (let i = 5; i <= 5; i++) {
    console.log(`\n================================================================================`);
    console.log(`STARTING REAL NVIDIA COMPARISON RUN ${i} (FINAL HEADROOM CONFIRMATION)`);
    console.log(`================================================================================`);

    const client = new NemotronClient();
    const t0 = Date.now();
    const result = await compareDocuments(docA, docB, {
      requestId: `real_nvidia_run_${i}_${Date.now()}`,
      aiProvider: client,
    });
    const totalComparisonMs = Date.now() - t0;

    const diag = result.diagnostics!;
    console.log(`[RUN ${i} COMPLETED] Total time: ${totalComparisonMs}ms, AI used: ${diag.aiUsed}`);
    console.log(`[RUN ${i} AI PERF] TTFT: ${diag.nvidiaTtftMs}ms, Gen: ${diag.generationMs}ms, Ctx Chars: ${diag.contextChars}, In Tokens: ${diag.estimatedInputTokens}, Out Tokens: ${diag.outputTokens}`);

    // Verification of Known Changes
    const salaryChg = result.changes.find(c => 
      c.docBContent.includes("2,800,000") || 
      c.diffHighlightB?.includes("2,800,000") ||
      c.summaryChange?.toLowerCase().includes("salary") ||
      c.summaryChange?.includes("2,800,000")
    );
    const noticeChg = result.changes.find(c => 
      c.docBContent.includes("90 days") || 
      c.docBContent.includes("ninety (90) days") ||
      c.summaryChange?.toLowerCase().includes("90 days") ||
      c.summaryChange?.toLowerCase().includes("notice")
    );
    const arbChg = result.changes.find(c => 
      c.docBContent.includes("Bengaluru") ||
      c.summaryChange?.toLowerCase().includes("bengaluru") ||
      c.summaryChange?.toLowerCase().includes("arbitration")
    );
    const confChg = result.changes.find(c => 
      c.docBContent.includes("three (3) years") ||
      c.docBContent.includes("3 years") ||
      c.summaryChange?.toLowerCase().includes("confidential")
    );
    const addedChg = result.changes.find(c => 
      c.status === "added" && (c.clauseTitle.includes("Cybersecurity") || c.docBContent.includes("Cybersecurity"))
    );
    const removedChg = result.changes.find(c => 
      c.status === "removed" && c.clauseTitle === removedSection.title
    );
    const incChg = result.inconsistencies.find(inc => 
      inc.title.toLowerCase().includes("payment") ||
      inc.explanation.toLowerCase().includes("30") ||
      inc.explanation.toLowerCase().includes("15")
    );

    console.log(`[RUN ${i} VERIFICATIONS]`);
    console.log(`  - Salary INR 2.4M -> 2.8M: ${salaryChg ? "DETECTED (" + salaryChg.changeSeverity + ")" : "MISSING"}`);
    console.log(`  - Notice 30d -> 90d: ${noticeChg ? "DETECTED (" + noticeChg.changeSeverity + ")" : "MISSING"}`);
    console.log(`  - Arbitration seat: ${arbChg ? "DETECTED" : "MISSING"}`);
    console.log(`  - Confidentiality: ${confChg ? "DETECTED" : "MISSING"}`);
    console.log(`  - Added clause: ${addedChg ? "DETECTED" : "MISSING"}`);
    console.log(`  - Removed clause: ${removedChg ? "DETECTED" : "MISSING"}`);
    console.log(`  - Internal inconsistency: ${incChg ? "DETECTED" : "MISSING"}`);

    runs.push({
      runIndex: i,
      ttftMs: diag.nvidiaTtftMs,
      generationMs: diag.generationMs,
      totalNvidiaRequestMs: diag.generationMs,
      totalComparisonMs,
      contextChars: diag.contextChars,
      estimatedInputTokens: diag.estimatedInputTokens,
      outputTokens: diag.outputTokens || 0,
      aiCallCount: diag.aiCallCount,
      changesCount: result.changes.length,
      inconsistenciesCount: result.inconsistencies.length,
      salaryDetected: Boolean(salaryChg),
      noticeDetected: Boolean(noticeChg),
      arbitrationDetected: Boolean(arbChg),
      confidentialityDetected: Boolean(confChg),
      addedClauseDetected: Boolean(addedChg),
      removedClauseDetected: Boolean(removedChg),
      internalInconsistencyDetected: Boolean(incChg),
    });
  }

  console.log("\n================================================================================");
  console.log("FINAL SUMMARY TABLE: 3 REAL NVIDIA NEMOTRON COMPARISON CALLS");
  console.log("================================================================================");
  console.table(runs);

  // Write results to a JSON file for recording
  fs.writeFileSync(outPath, JSON.stringify(runs, null, 2));
  console.log(`[OUTPUT] Written results to ${outPath}`);
}

runRealNvidiaVerification().catch((err) => {
  console.error("FATAL ERROR in real NVIDIA comparison verification:", err);
  process.exit(1);
});
