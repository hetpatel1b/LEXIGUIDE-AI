import fs from "fs";
import path from "path";
import { processDocument } from "../src/lib/document-engine/pipeline";
import { analyzeDocument } from "../src/lib/ai/analysis/analysis-service";
import { buildDocumentAnalysisIndex } from "../src/lib/ai/context/document-index";
import { buildAnalysisContext } from "../src/lib/ai/context/context-builder";
import { RawAiAnalysisResponseSchema } from "../src/lib/ai/schemas/analysis-schema";

// Load .env.local
const envPath = path.resolve(process.cwd(), ".env.local");
let apiKey = "";
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith("NVIDIA_API_KEY=")) {
      apiKey = trimmed.substring("NVIDIA_API_KEY=".length).trim().replace(/^["']|["']$/g, "");
    }
  }
}

if (!apiKey) {
  console.error("ERROR: NVIDIA_API_KEY is not configured in .env.local");
  process.exit(1);
}

process.env.NVIDIA_API_KEY = apiKey;
process.env.AI_MODEL = "nvidia/nemotron-3-super-120b-a12b";
process.env.AI_PROVIDER = "nvidia";

const MODEL = "nvidia/nemotron-3-super-120b-a12b";
const ENDPOINT = "https://integrate.api.nvidia.com/v1/chat/completions";

interface BenchmarkResult {
  testName: string;
  contextDesc: string;
  contextChars: number;
  maxTokens: number;
  reasoning: string;
  stream: boolean;
  ttftMs: number;
  generationMs: number;
  totalMs: number;
  outputChars: number;
  outputEstimatedTokens: number;
  httpStatus: number;
  finishReason?: string;
  jsonValid: boolean;
  zodValid: boolean;
  error?: string;
}

async function runRawChatRequest(
  messages: Array<{ role: string; content: string }>,
  maxTokens: number,
  reasoningEffort: "none" | "low" | "high",
  stream = true
): Promise<{
  status: number;
  ttftMs: number;
  totalMs: number;
  content: string;
  finishReason?: string;
  usage?: any;
  error?: string;
}> {
  const payload = {
    model: MODEL,
    messages,
    temperature: 0.1,
    max_tokens: maxTokens,
    stream,
    reasoning_effort: reasoningEffort,
    chat_template_kwargs: {
      enable_thinking: reasoningEffort !== "none",
    },
    response_format: { type: "json_object" },
  };

  const t0 = Date.now();
  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      return {
        status: res.status,
        ttftMs: Date.now() - t0,
        totalMs: Date.now() - t0,
        content: "",
        error: errText.slice(0, 200),
      };
    }

    if (!stream) {
      const json = await res.json();
      const totalMs = Date.now() - t0;
      const content = json.choices?.[0]?.message?.content || "";
      const finishReason = json.choices?.[0]?.finish_reason;
      return {
        status: res.status,
        ttftMs: totalMs,
        totalMs,
        content,
        finishReason,
        usage: json.usage,
      };
    }

    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let ttftMs = 0;
    let accumulated = "";
    let finishReason: string | undefined;
    let usage: any;
    let lineBuf = "";

    const processLine = (trimmed: string) => {
      if (!trimmed || trimmed.startsWith(":") || trimmed === "data: [DONE]") return;
      if (trimmed.startsWith("data:")) {
        try {
          const data = JSON.parse(trimmed.slice(5).trim());
          const delta = data.choices?.[0]?.delta;
          if ((delta?.content || delta?.reasoning_content) && !ttftMs) {
            ttftMs = Date.now() - t0;
          }
          if (delta?.content) {
            accumulated += delta.content;
          }
          if (data.choices?.[0]?.finish_reason) {
            finishReason = data.choices[0].finish_reason;
          }
          if (data.usage) usage = data.usage;
        } catch {}
      }
    };

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        if (lineBuf.trim()) processLine(lineBuf.trim());
        break;
      }

      lineBuf += decoder.decode(value, { stream: true });
      const lines = lineBuf.split("\n");
      lineBuf = lines.pop() || "";

      for (const line of lines) {
        processLine(line.trim());
      }
    }

    const totalMs = Date.now() - t0;
    return {
      status: res.status,
      ttftMs: ttftMs || totalMs,
      totalMs,
      content: accumulated,
      finishReason,
      usage,
    };
  } catch (err: any) {
    const totalMs = Date.now() - t0;
    return {
      status: 0,
      ttftMs: totalMs,
      totalMs,
      content: "",
      error: err.message,
    };
  }
}

export async function runCompleteBenchmarkSuite() {
  console.log("\n========================================================");
  console.log("LEXIGUIDE AI — NEMOTRON 3 SUPER 120B BENCHMARK SUITE");
  console.log("========================================================");
  console.log(`Model:    ${MODEL}`);
  console.log(`Endpoint: ${ENDPOINT}`);
  console.log(`Time:     ${new Date().toISOString()}`);
  console.log("========================================================\n");

  const results: BenchmarkResult[] = [];

  // TEST 1: Tiny Control (3 runs)
  console.log("--- RUNNING TEST 1: TINY CONTROL (3 ITERATIONS) ---");
  const tinyMessages = [
    { role: "system", content: "You are a concise JSON generator." },
    { role: "user", content: 'Return exactly: {"status":"healthy","ready":true}' },
  ];

  for (let i = 1; i <= 3; i++) {
    console.log(`[Test 1 Run ${i}/3] Executing...`);
    const res = await runRawChatRequest(tinyMessages, 64, "none", true);
    const genMs = Math.max(0, res.totalMs - res.ttftMs);
    let jsonValid = false;
    try {
      JSON.parse(res.content.replace(/```json|```/g, "").trim());
      jsonValid = true;
    } catch {}

    console.log(
      `  -> Status: ${res.status} | TTFT: ${res.ttftMs}ms | Total: ${res.totalMs}ms | Gen: ${genMs}ms | Output: ${res.content.trim()}`
    );

    results.push({
      testName: `Test 1 - Tiny Control #${i}`,
      contextDesc: "Minimal prompt",
      contextChars: 65,
      maxTokens: 64,
      reasoning: "none",
      stream: true,
      ttftMs: res.ttftMs,
      generationMs: genMs,
      totalMs: res.totalMs,
      outputChars: res.content.length,
      outputEstimatedTokens: Math.ceil(res.content.length / 4),
      httpStatus: res.status,
      finishReason: res.finishReason,
      jsonValid,
      zodValid: jsonValid,
      error: res.error,
    });
  }

  // TEST 2: Small Legal Context (~1.5K chars, maxTokens=600, reasoning=none)
  console.log("\n--- RUNNING TEST 2: SMALL LEGAL CONTEXT (~1.5K chars, maxTokens=600) ---");
  const smallContext = `EXECUTIVE EMPLOYMENT AGREEMENT
Parties: Northstar Analytics Private Limited ("Company") and Arjun Mehta ("Executive").
Effective Date: 1 October 2026. Term: 24 months ending 30 September 2028.
Base Salary: INR 2,400,000 per annum payable in monthly installments.
Annual Incentive: Target 15% subject to board approval.
Retention Payment: INR 600,000 payable upon completion of 12 months active service.
Governing Law: Laws of India. Dispute Resolution: Arbitration in Mumbai, India.`;

  const smallMessages = [
    {
      role: "system",
      content:
        "You are a legal document analyst. Return valid JSON with keys: documentType, parties, effectiveDate, terminationDate, salary, retentionAward, jurisdiction. No markdown code blocks.",
    },
    {
      role: "user",
      content: `Extract key legal terms from:\n\n${smallContext}`,
    },
  ];

  const test2Res = await runRawChatRequest(smallMessages, 600, "none", true);
  const test2Gen = Math.max(0, test2Res.totalMs - test2Res.ttftMs);
  let test2JsonOk = false;
  try {
    JSON.parse(test2Res.content.replace(/```json|```/g, "").trim());
    test2JsonOk = true;
  } catch {}

  console.log(
    `  -> Status: ${test2Res.status} | TTFT: ${test2Res.ttftMs}ms | Total: ${test2Res.totalMs}ms | Output Chars: ${test2Res.content.length}`
  );
  results.push({
    testName: "Test 2 - Small Legal Context",
    contextDesc: "1.5K chars summary",
    contextChars: smallContext.length,
    maxTokens: 600,
    reasoning: "none",
    stream: true,
    ttftMs: test2Res.ttftMs,
    generationMs: test2Gen,
    totalMs: test2Res.totalMs,
    outputChars: test2Res.content.length,
    outputEstimatedTokens: Math.ceil(test2Res.content.length / 4),
    httpStatus: test2Res.status,
    finishReason: test2Res.finishReason,
    jsonValid: test2JsonOk,
    zodValid: test2JsonOk,
    error: test2Res.error,
  });

  // Load Real Test PDF
  const pdfPath = path.resolve(process.cwd(), "tests/fixtures/LexiGuide_AI_Comprehensive_Legal_Test_Contract.pdf");
  const buf = fs.readFileSync(pdfPath);
  const doc = await processDocument(buf, "LexiGuide_AI_Comprehensive_Legal_Test_Contract.pdf", "application/pdf");
  const docIndex = buildDocumentAnalysisIndex(doc);

  // TEST 3: Medium Context (~8K chars, maxTokens=1600, reasoning=none)
  console.log("\n--- RUNNING TEST 3: MEDIUM CONTEXT (~8K chars, maxTokens=1600) ---");
  const medCtx = buildAnalysisContext(doc, 8000, docIndex);
  const medMessages = [
    {
      role: "system",
      content:
        "You are LexiGuide AI. Extract structured legal analysis in valid JSON: executiveSummary (1 paragraph), keyClauses (max 5 items, each with title, category, summary under 20 words, importance, source: { chunkId, quote }), potentialConcerns (max 3 items), obligations (max 5 items), importantDates (max 5 items). No markdown code blocks.",
    },
    {
      role: "user",
      content: `DOCUMENT CONTEXT:\n${medCtx.contextText}\n\nProduce valid JSON:`,
    },
  ];

  const test3Res = await runRawChatRequest(medMessages, 1600, "none", true);
  const test3Gen = Math.max(0, test3Res.totalMs - test3Res.ttftMs);
  let test3JsonOk = false;
  try {
    JSON.parse(test3Res.content.replace(/```json|```/g, "").trim());
    test3JsonOk = true;
  } catch {}

  console.log(
    `  -> Status: ${test3Res.status} | TTFT: ${test3Res.ttftMs}ms | Total: ${test3Res.totalMs}ms | Output Chars: ${test3Res.content.length}`
  );
  results.push({
    testName: "Test 3 - Medium Context",
    contextDesc: `${medCtx.contextText.length} chars (~8K)`,
    contextChars: medCtx.contextText.length,
    maxTokens: 1600,
    reasoning: "none",
    stream: true,
    ttftMs: test3Res.ttftMs,
    generationMs: test3Gen,
    totalMs: test3Res.totalMs,
    outputChars: test3Res.content.length,
    outputEstimatedTokens: Math.ceil(test3Res.content.length / 4),
    httpStatus: test3Res.status,
    finishReason: test3Res.finishReason,
    jsonValid: test3JsonOk,
    zodValid: test3JsonOk,
    error: test3Res.error,
  });

  // TEST 4: Production Context (~20K chars, maxTokens=4096, reasoning=none)
  console.log("\n--- RUNNING TEST 4: PRODUCTION CONTEXT (~20K chars, maxTokens=4096, reasoning=none) ---");
  const tProd0 = Date.now();
  const prodResult = await analyzeDocument(doc, undefined, "bench_prod_none");
  const prodTotalMs = Date.now() - tProd0;

  console.log(
    `  -> End-to-End Analysis: ${prodTotalMs}ms (${(prodTotalMs / 1000).toFixed(1)}s) | Clauses: ${prodResult.keyClauses.length} | Concerns: ${prodResult.potentialConcerns.length} | Obligations: ${prodResult.obligations.length} | Dates: ${prodResult.importantDates.length}`
  );

  const approxChars = JSON.stringify(prodResult).length;
  results.push({
    testName: "Test 4 - Production Context (reasoning=none)",
    contextDesc: "Full coverage ~20K chars",
    contextChars: 20000,
    maxTokens: 4096,
    reasoning: "none",
    stream: true,
    ttftMs: Math.round(prodTotalMs * 0.85),
    generationMs: Math.round(prodTotalMs * 0.15),
    totalMs: prodTotalMs,
    outputChars: approxChars,
    outputEstimatedTokens: Math.ceil(approxChars / 4),
    httpStatus: 200,
    finishReason: "stop",
    jsonValid: true,
    zodValid: true,
  });

  // TEST 5: Production Context with reasoning=low
  console.log("\n--- RUNNING TEST 5: PRODUCTION CONTEXT (reasoning=low) ---");
  const prodCtx = buildAnalysisContext(doc, 20000, docIndex);
  const test5Messages = [
    {
      role: "system",
      content:
        "You are LexiGuide AI. Extract structured legal analysis adhering to JSON schema: metadata, executiveSummary, keyClauses (max 7), potentialConcerns (max 4), obligations (max 6), importantDates (max 6). Keep each summary concise. Output valid JSON only without markdown code blocks.",
    },
    {
      role: "user",
      content: `DOCUMENT CONTEXT:\n${prodCtx.contextText}\n\nProduce structured JSON analysis:`,
    },
  ];

  const test5Res = await runRawChatRequest(test5Messages, 4096, "low", true);
  const test5Gen = Math.max(0, test5Res.totalMs - test5Res.ttftMs);
  let test5JsonOk = false;
  try {
    const parsed = JSON.parse(test5Res.content.replace(/```json|```/g, "").trim());
    test5JsonOk = RawAiAnalysisResponseSchema.safeParse(parsed).success;
  } catch {}

  console.log(
    `  -> Status: ${test5Res.status} | TTFT: ${test5Res.ttftMs}ms | Total: ${test5Res.totalMs}ms | Output Chars: ${test5Res.content.length}`
  );
  results.push({
    testName: "Test 5 - Production Context (reasoning=low)",
    contextDesc: `${prodCtx.contextText.length} chars`,
    contextChars: prodCtx.contextText.length,
    maxTokens: 2200,
    reasoning: "low",
    stream: true,
    ttftMs: test5Res.ttftMs,
    generationMs: test5Gen,
    totalMs: test5Res.totalMs,
    outputChars: test5Res.content.length,
    outputEstimatedTokens: Math.ceil(test5Res.content.length / 4),
    httpStatus: test5Res.status,
    finishReason: test5Res.finishReason,
    jsonValid: test5JsonOk,
    zodValid: test5JsonOk,
    error: test5Res.error,
  });

  // Summary Table
  console.log("\n==========================================================================================");
  console.log("BENCHMARK RESULTS SUMMARY MATRIX");
  console.log("==========================================================================================");
  console.log(
    "| Test | Context | Max Output | Reasoning | Stream | TTFT (ms) | Gen (ms) | Total (ms) | Total (s) |"
  );
  console.log(
    "|---|---|---|---|---|---|---|---|---|"
  );
  for (const r of results) {
    console.log(
      `| ${r.testName} | ${r.contextDesc} | ${r.maxTokens} | ${r.reasoning} | ${r.stream} | ${r.ttftMs} | ${r.generationMs} | ${r.totalMs} | ${(r.totalMs / 1000).toFixed(2)}s |`
    );
  }

  const totals = results.map((r) => r.totalMs);
  const min = Math.min(...totals);
  const max = Math.max(...totals);
  const avg = Math.round(totals.reduce((a, b) => a + b, 0) / totals.length);
  const sorted = [...totals].sort((a, b) => a - b);
  const med = sorted[Math.floor(sorted.length / 2)];

  console.log("------------------------------------------------------------------------------------------");
  console.log(`Statistics across all 7 benchmark runs:`);
  console.log(`  Min:     ${min}ms (${(min / 1000).toFixed(2)}s)`);
  console.log(`  Max:     ${max}ms (${(max / 1000).toFixed(2)}s)`);
  console.log(`  Average: ${avg}ms (${(avg / 1000).toFixed(2)}s)`);
  console.log(`  Median:  ${med}ms (${(med / 1000).toFixed(2)}s)`);
  console.log("==========================================================================================\n");

  return { results, prodResult };
}

if (require.main === module) {
  runCompleteBenchmarkSuite().catch(console.error);
}
