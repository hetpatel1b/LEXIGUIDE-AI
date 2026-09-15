import fs from "fs";
import path from "path";

interface Timings {
  processMs: number;
  analysisTotalMs: number;
  analysisNvidiaMs?: number;
  qaTotalMs: number;
  comparisonUploadMs: number;
  comparisonTotalMs: number;
  comparisonNvidiaMs?: number;
}

const timings: Timings = {
  processMs: 0,
  analysisTotalMs: 0,
  qaTotalMs: 0,
  comparisonUploadMs: 0,
  comparisonTotalMs: 0,
};

let sessionCookie = "";

function parseCookie(setCookieHeader: string | null): string {
  if (!setCookieHeader) return "";
  const match = setCookieHeader.match(/lexiguide_anon_id=([a-f0-9-]+)/i);
  return match ? `lexiguide_anon_id=${match[1]}` : "";
}

async function runLiveVerification() {
  console.log("================================================================================");
  console.log("LEXIGUIDE AI — PHASE 6 LIVE PRODUCTION SECURITY & PERFORMANCE VERIFICATION");
  console.log("================================================================================\n");

  const pdfPath = path.resolve(process.cwd(), "tests/fixtures/LexiGuide_AI_Comprehensive_Legal_Test_Contract.pdf");
  const txtPath = path.resolve(process.cwd(), "tests/fixtures/LexiGuide_AI_Comprehensive_Legal_Test_Contract_v2.txt");

  const pdfBuf = fs.readFileSync(pdfPath);
  const txtBuf = fs.readFileSync(txtPath);

  // --------------------------------------------------------------------------
  // TEST 1: AUTHORITATIVE UPLOAD & ANONYMOUS SESSION MINTING
  // --------------------------------------------------------------------------
  console.log("[TEST 1] Uploading Document A (Comprehensive Legal Contract PDF)...");
  const formA = new FormData();
  formA.append("file", new Blob([pdfBuf], { type: "application/pdf" }), "LexiGuide_Contract_A.pdf");

  const t0_upload = Date.now();
  const uploadRes = await fetch("http://localhost:3000/api/documents/process", {
    method: "POST",
    body: formA,
  });

  timings.processMs = Date.now() - t0_upload;
  const rawSetCookie = uploadRes.headers.get("set-cookie");
  sessionCookie = parseCookie(rawSetCookie);

  console.log(`  -> Status: ${uploadRes.status} (completed in ${timings.processMs}ms)`);
  console.log(`  -> Anonymous Session Cookie Minted: ${sessionCookie}`);

  if (!uploadRes.ok) {
    const err = await uploadRes.json();
    throw new Error(`Document A upload failed: ${JSON.stringify(err)}`);
  }

  const uploadData = await uploadRes.json();
  const docA = uploadData.data;
  console.log(`  -> Doc A ID: ${docA.id}, chunks: ${docA.chunks?.length}, pages: ${docA.pageCount}`);

  // --------------------------------------------------------------------------
  // TEST 2: REAL NVIDIA NEMOTRON 3 SUPER 120B ANALYSIS
  // --------------------------------------------------------------------------
  console.log("\n[TEST 2] Executing Real AI Analysis via POST /api/analysis with Session Cookie...");
  const t0_ana = Date.now();
  const anaRes = await fetch("http://localhost:3000/api/analysis", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      cookie: sessionCookie,
    },
    body: JSON.stringify({
      documentId: docA.id,
      document: docA,
    }),
  });

  timings.analysisTotalMs = Date.now() - t0_ana;
  console.log(`  -> Status: ${anaRes.status} (completed in ${timings.analysisTotalMs}ms)`);

  if (!anaRes.ok) {
    const err = await anaRes.json();
    throw new Error(`Analysis failed: ${JSON.stringify(err)}`);
  }

  const anaData = await anaRes.json();
  const anaResult = anaData.data;
  console.log(`  -> Model Used: ${anaResult.modelUsed}`);
  console.log(`  -> Key Clauses: ${anaResult.keyClauses?.length}`);
  console.log(`  -> Potential Concerns: ${anaResult.potentialConcerns?.length}`);
  console.log(`  -> Obligations: ${anaResult.obligations?.length}`);
  console.log(`  -> Important Dates: ${anaResult.importantDates?.length}`);

  // --------------------------------------------------------------------------
  // TEST 3: REAL GROUNDED Q&A WITH SOURCE VERIFICATION
  // --------------------------------------------------------------------------
  console.log("\n[TEST 3] Executing Real Grounded Q&A via POST /api/qa...");
  const t0_qa = Date.now();
  const qaRes = await fetch("http://localhost:3000/api/qa", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      cookie: sessionCookie,
    },
    body: JSON.stringify({
      documentId: docA.id,
      question: "What is the employee's base salary and when is it paid?",
    }),
  });

  timings.qaTotalMs = Date.now() - t0_qa;
  console.log(`  -> Status: ${qaRes.status} (completed in ${timings.qaTotalMs}ms)`);

  if (!qaRes.ok) {
    const err = await qaRes.json();
    throw new Error(`QA failed: ${JSON.stringify(err)}`);
  }

  const qaData = await qaRes.json();
  const qaResult = qaData.data;
  console.log(`  -> Answer Status: ${qaResult.answerStatus}`);
  console.log(`  -> Answer Excerpt: "${qaResult.answer.substring(0, 120)}..."`);
  console.log(`  -> Verified Sources Count: ${qaResult.sources?.length}`);
  if (qaResult.sources?.length > 0) {
    console.log(`  -> Verified Citation 1: chunkId=${qaResult.sources[0].chunkId}, quote="${qaResult.sources[0].quote}"`);
  }

  // --------------------------------------------------------------------------
  // TEST 4: EPHEMERAL COMPARISON DOCUMENT B UPLOAD
  // --------------------------------------------------------------------------
  console.log("\n[TEST 4] Uploading Ephemeral Document B via POST /api/comparison/upload...");
  const formB = new FormData();
  formB.append("file", new Blob([txtBuf], { type: "text/plain" }), "LexiGuide_Contract_B.txt");

  const t0_compUp = Date.now();
  const compUpRes = await fetch("http://localhost:3000/api/comparison/upload", {
    method: "POST",
    headers: {
      cookie: sessionCookie,
    },
    body: formB,
  });

  timings.comparisonUploadMs = Date.now() - t0_compUp;
  console.log(`  -> Status: ${compUpRes.status} (completed in ${timings.comparisonUploadMs}ms)`);

  if (!compUpRes.ok) {
    const err = await compUpRes.json();
    throw new Error(`Comparison upload failed: ${JSON.stringify(err)}`);
  }

  const compUpData = await compUpRes.json();
  const docB = compUpData.data;
  const comparisonId = compUpData.comparisonId;
  console.log(`  -> Ephemeral Doc B ID: ${docB.id}, comparisonId: ${comparisonId}`);

  // --------------------------------------------------------------------------
  // TEST 5: REAL COMPARISON SERVICE WITH NEMOTRON EXPLANATIONS
  // --------------------------------------------------------------------------
  console.log("\n[TEST 5] Executing Comparison via POST /api/comparison...");
  const t0_comp = Date.now();
  const compRes = await fetch("http://localhost:3000/api/comparison", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      cookie: sessionCookie,
    },
    body: JSON.stringify({
      documentAId: docA.id,
      documentBId: docB.id,
      comparisonId,
    }),
  });

  timings.comparisonTotalMs = Date.now() - t0_comp;
  console.log(`  -> Status: ${compRes.status} (completed in ${timings.comparisonTotalMs}ms)`);

  if (!compRes.ok) {
    const err = await compRes.json();
    throw new Error(`Comparison failed: ${JSON.stringify(err)}`);
  }

  const compData = await compRes.json();
  const compResult = compData.data;
  console.log(`  -> Substantive Changes: ${compResult.changes?.length}`);
  console.log(`  -> Inconsistencies: ${compResult.inconsistencies?.length}`);
  if (compResult.changes?.length > 0) {
    const firstChange = compResult.changes[0];
    console.log(`  -> Change 1 [${firstChange.changeSeverity}]: ${firstChange.clauseTitle}`);
    console.log(`     Why it matters: "${firstChange.whyItMatters}"`);
  }

  // --------------------------------------------------------------------------
  // TEST 6: CROSS-SESSION ISOLATION VERIFICATION
  // --------------------------------------------------------------------------
  console.log("\n[TEST 6] Verifying Cross-Session Document Isolation...");
  // Attempt to access Doc A using a different anonymous session ID (unauthorized)
  const foreignSessionCookie = "lexiguide_anon_id=99999999-9999-4999-8999-999999999999";
  const isolationRes = await fetch("http://localhost:3000/api/qa", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      cookie: foreignSessionCookie,
    },
    body: JSON.stringify({
      documentId: docA.id,
      question: "What is the compensation?",
    }),
  });

  console.log(`  -> Cross-session access status: ${isolationRes.status} (Expected: 404)`);
  assert(isolationRes.status === 404, `Expected 404 for unauthorized session access, got ${isolationRes.status}`);
  const isolationData = await isolationRes.json();
  console.log(`  -> Controlled Error Response: ${JSON.stringify(isolationData.error)}`);

  // --------------------------------------------------------------------------
  // SUMMARY REPORT
  // --------------------------------------------------------------------------
  console.log("\n================================================================================");
  console.log("PHASE 6 LIVE VERIFICATION COMPLETE — REAL APPLICATION TIMINGS");
  console.log("================================================================================");
  console.log(`Document Processing Time:       ${timings.processMs} ms`);
  console.log(`Analysis API Total Time:         ${timings.analysisTotalMs} ms`);
  console.log(`Q&A API Total Time:              ${timings.qaTotalMs} ms`);
  console.log(`Comparison Upload Time:          ${timings.comparisonUploadMs} ms`);
  console.log(`Comparison API Total Time:       ${timings.comparisonTotalMs} ms`);
  console.log("Cross-Session Isolation:         VERIFIED (100% BLOCKED)");
  console.log("================================================================================\n");
}

function assert(condition: boolean, msg: string) {
  if (!condition) throw new Error(`Assertion failed: ${msg}`);
}

runLiveVerification().catch((err) => {
  console.error("\n[VERIFICATION ERROR]", err);
  process.exit(1);
});
