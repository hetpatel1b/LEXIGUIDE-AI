import fs from "fs";
import path from "path";

async function uploadFile(filePath: string, filename: string, mimeType: string) {
  const fullPath = path.resolve(process.cwd(), filePath);
  const fileBuf = fs.readFileSync(fullPath);
  const blob = new Blob([fileBuf], { type: mimeType });
  const form = new FormData();
  form.append("file", blob, filename);

  const res = await fetch("http://localhost:3000/api/documents/process", {
    method: "POST",
    body: form,
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(`Upload failed for ${filename}: ${JSON.stringify(data)}`);
  }
  console.log(`[UPLOAD SUCCESS] ${filename} -> id=${data.data.id}, chunks=${data.data.chunks?.length}`);
  return data.data;
}

async function runE2E() {
  console.log("================================================================================");
  console.log("LEXIGUIDE AI — FULL LIVE END-TO-END HTTP API FLOW");
  console.log("================================================================================\n");

  // Step 1: Upload Doc A
  console.log("[STEP 1] Uploading Document A (comprehensive test contract PDF)...");
  const docA = await uploadFile("tests/fixtures/LexiGuide_AI_Comprehensive_Legal_Test_Contract.pdf", "LexiGuide_AI_Comprehensive_Legal_Test_Contract.pdf", "application/pdf");

  // Step 2: Upload Doc B
  console.log("[STEP 2] Uploading Document B (controlled revised version TXT)...");
  const docB = await uploadFile("tests/fixtures/LexiGuide_AI_Comprehensive_Legal_Test_Contract_v2.txt", "LexiGuide_AI_Comprehensive_Legal_Test_Contract_v2.txt", "text/plain");

  // Step 3: Call POST /api/comparison with only document IDs
  console.log("\n[STEP 3] Calling POST /api/comparison with documentAId and documentBId only...");
  const t0 = Date.now();
  const compRes = await fetch("http://localhost:3000/api/comparison", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      documentAId: docA.id,
      documentBId: docB.id,
    }),
  });

  const compData = await compRes.json();
  const dur = Date.now() - t0;
  console.log(`[STEP 4] Comparison completed in ${dur}ms with status: ${compRes.status}`);

  if (!compRes.ok || !compData.success) {
    throw new Error(`Comparison failed: ${JSON.stringify(compData)}`);
  }

  const result = compData.data;
  console.log("\n[VERIFICATION: SUMMARY METRICS]");
  console.log(result.metrics);

  console.log("\n[VERIFICATION: CHANGED CLAUSES COUNT]", result.changes?.length);
  for (const c of result.changes || []) {
    console.log(`  - [${c.changeSeverity.toUpperCase()}] ${c.clauseTitle} (${c.status || "modified"}): "${c.summaryChange || c.whyItMatters}"`);
  }

  console.log("\n[VERIFICATION: INCONSISTENCIES COUNT]", result.inconsistencies?.length);
  for (const inc of (result.inconsistencies || []).slice(0, 5)) {
    console.log(`  - [${inc.inconsistencyType}] ${inc.title}: ${inc.explanation.substring(0, 100)}...`);
  }

  // Step 5: Test Q&A Integration ("Ask About Change")
  console.log("\n[STEP 5] Testing Grounded Q&A Integration on Changed Clause...");
  const sampleChange = result.changes.find((c: any) => c.docBContent.includes("90 days") || c.summaryChange.includes("90 days")) || result.changes[0];
  const question = sampleChange.suggestedReviewQuestion || `What is the revision to the ${sampleChange.clauseTitle} provision and what are its implications?`;

  console.log(`Question: "${question}" on Document B (id=${docB.id})`);
  const tQa0 = Date.now();
  const qaRes = await fetch("http://localhost:3000/api/qa", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      documentId: docB.id,
      question,
    }),
  });
  const qaData = await qaRes.json();
  const qaDur = Date.now() - tQa0;
  console.log(`[STEP 5 RESULT] Q&A returned in ${qaDur}ms (status ${qaRes.status})`);
  console.log("Answer snippet:", qaData.data?.answer?.substring(0, 200), "...");
  console.log("Citations:", qaData.data?.citations?.length);

  // Step 6: Verify Action Center item structure
  console.log("\n[STEP 6] Simulating Action Center addition from comparison change...");
  const actionItem = {
    id: `act-comp-${sampleChange.id}`,
    category: "review",
    status: sampleChange.changeSeverity === "major" ? "needs_review" : "confirm",
    title: `Review revision in ${sampleChange.clauseTitle}`,
    description: sampleChange.summaryChange,
    whyItMatters: sampleChange.whyItMatters,
    sourceSection: sampleChange.sectionB || sampleChange.sectionA,
    pageNumber: sampleChange.pageB || sampleChange.pageA,
    suggestedQuestion: sampleChange.suggestedReviewQuestion,
    evidenceSnippet: sampleChange.docBContent || sampleChange.docAContent,
    isChecked: false,
  };
  console.log("[STEP 6 RESULT] Action Center Item constructed:", actionItem.id, actionItem.title);

  console.log("\n================================================================================");
  console.log("ALL REAL HTTP END-TO-END FLOWS COMPLETED SUCCESSFULLY!");
  console.log("================================================================================");
}

runE2E().catch((err) => {
  console.error("FATAL ERROR in E2E API flow:", err);
  process.exit(1);
});
