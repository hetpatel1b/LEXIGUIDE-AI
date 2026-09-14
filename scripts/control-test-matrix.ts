import fs from "fs";
import path from "path";

// Load .env.local for NVIDIA_API_KEY
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
  console.error("ERROR: NVIDIA_API_KEY is missing from .env.local");
  process.exit(1);
}

const MODEL = "nvidia/nemotron-3-ultra-550b-a55b";
const ENDPOINT = "https://integrate.api.nvidia.com/v1/chat/completions";

interface RunResult {
  iteration: number;
  mode: "non-streaming" | "streaming";
  httpStatus: number;
  headersMs: number;
  ttftMs: number;
  totalMs: number;
  outputChars: number;
  outputTokens?: number;
  promptTokens?: number;
  reasoningTokens?: number;
  finishReason?: string;
  content: string;
  error?: string;
}

async function runSingleTest(
  iteration: number,
  messages: Array<{ role: string; content: string }>,
  maxTokens: number,
  stream: boolean
): Promise<RunResult> {
  const payload = {
    model: MODEL,
    messages,
    temperature: 0.1,
    max_tokens: maxTokens,
    stream,
    reasoning_effort: "none",
    chat_template_kwargs: {
      enable_thinking: false,
    },
  };

  const t0 = Date.now();
  let headersMs = 0;
  let ttftMs = 0;

  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    headersMs = Date.now() - t0;

    if (!stream) {
      const totalMs = Date.now() - t0;
      const data = await res.json();
      if (!res.ok) {
        return {
          iteration,
          mode: "non-streaming",
          httpStatus: res.status,
          headersMs,
          ttftMs: totalMs,
          totalMs,
          outputChars: 0,
          error: data?.error?.message || `HTTP ${res.status}`,
          content: "",
        };
      }

      const choice = data.choices?.[0];
      const content = choice?.message?.content || "";
      const finishReason = choice?.finish_reason;
      const usage = data.usage;

      return {
        iteration,
        mode: "non-streaming",
        httpStatus: res.status,
        headersMs,
        ttftMs: totalMs,
        totalMs,
        outputChars: content.length,
        outputTokens: usage?.completion_tokens,
        promptTokens: usage?.prompt_tokens,
        finishReason,
        content: content.slice(0, 100),
      };
    } else {
      // Streaming mode
      if (!res.ok) {
        const errText = await res.text();
        const totalMs = Date.now() - t0;
        return {
          iteration,
          mode: "streaming",
          httpStatus: res.status,
          headersMs,
          ttftMs: totalMs,
          totalMs,
          outputChars: 0,
          error: errText,
          content: "",
        };
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";
      let finishReason: string | undefined;
      let usage: any;
      let lineBuf = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunkText = decoder.decode(value, { stream: true });
        lineBuf += chunkText;
        const lines = lineBuf.split("\n");
        lineBuf = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith(":") || trimmed === "data: [DONE]") continue;
          if (trimmed.startsWith("data:")) {
            try {
              const json = JSON.parse(trimmed.slice(5).trim());
              const delta = json.choices?.[0]?.delta;
              if ((delta?.content || delta?.reasoning_content) && !ttftMs) {
                ttftMs = Date.now() - t0;
              }
              if (delta?.content) {
                accumulated += delta.content;
              }
              if (json.choices?.[0]?.finish_reason) {
                finishReason = json.choices[0].finish_reason;
              }
              if (json.usage) usage = json.usage;
            } catch {
              // Ignore partial JSON
            }
          }
        }
      }

      const totalMs = Date.now() - t0;
      return {
        iteration,
        mode: "streaming",
        httpStatus: res.status,
        headersMs,
        ttftMs: ttftMs || totalMs,
        totalMs,
        outputChars: accumulated.length,
        outputTokens: usage?.completion_tokens,
        promptTokens: usage?.prompt_tokens,
        finishReason,
        content: accumulated.slice(0, 100),
      };
    }
  } catch (err: any) {
    const totalMs = Date.now() - t0;
    return {
      iteration,
      mode: stream ? "streaming" : "non-streaming",
      httpStatus: 0,
      headersMs,
      ttftMs: totalMs,
      totalMs,
      outputChars: 0,
      error: err.message,
      content: "",
    };
  }
}

export async function runMinimalControlTest() {
  console.log("========================================================");
  console.log("CONTROL TEST 1: MINIMAL 64-TOKEN REQUEST (3 RUNS)");
  console.log(`Model: ${MODEL}`);
  console.log("Payload: system='You are a concise JSON generator.', user='Return exactly: {\\\"ok\\\":true}'");
  console.log("Config: reasoning_effort='none', enable_thinking=false, max_tokens=64, temp=0.1");
  console.log("========================================================\n");

  const messages = [
    { role: "system", content: "You are a concise JSON generator." },
    { role: "user", content: 'Return exactly:\n{"ok":true}' },
  ];

  const results: RunResult[] = [];

  for (let i = 1; i <= 3; i++) {
    console.log(`[Run ${i}/3] Executing non-streaming minimal test...`);
    const res = await runSingleTest(i, messages, 64, false);
    console.log(
      `  -> Status: ${res.httpStatus} | Total: ${res.totalMs}ms | Headers: ${res.headersMs}ms | Tokens: ${res.outputTokens ?? "N/A"} | Content: ${res.content.trim()}`
    );
    if (res.error) console.log(`     Error: ${res.error}`);
    results.push(res);
  }

  // Also test streaming once for comparison
  console.log("\n[Comparison] Executing streaming minimal test (1 run)...");
  const streamRes = await runSingleTest(4, messages, 64, true);
  console.log(
    `  -> Status: ${streamRes.httpStatus} | Total: ${streamRes.totalMs}ms | TTFT: ${streamRes.ttftMs}ms | Content: ${streamRes.content.trim()}`
  );
  results.push(streamRes);

  return results;
}

// -----------------------------------------------------------------------------
// CONTROL TEST 2: SMALL LEGAL PROMPT (1K-2K chars, max_tokens: 600)
// -----------------------------------------------------------------------------
export async function runSmallLegalControlTest() {
  console.log("\n========================================================");
  console.log("CONTROL TEST 2: SMALL LEGAL PROMPT (~1.5K chars, maxTokens=600)");
  console.log("========================================================");

  const sampleContractText = `EXECUTIVE EMPLOYMENT, INTELLECTUAL PROPERTY, CONFIDENTIALITY AND SERVICES AGREEMENT
This Agreement is entered into on 1 October 2026 (the "Effective Date") by and between:
1. Northstar Analytics Private Limited, an Indian private limited company having its registered office at Level 7, Manyata Tech Park, Bengaluru, Karnataka 560045, India ("Company" or "Employer"), and
2. Arjun Mehta, residing at 402 Palm Grove Residences, Indiranagar, Bengaluru, Karnataka 560038, India ("Executive" or "Employee").
RECITALS
A. The Company provides enterprise artificial intelligence solutions, decision platforms, and data analytics software.
B. The Executive has specialized expertise in engineering leadership and artificial intelligence architectures.
C. The Company desires to employ the Executive as Chief Technology Officer (CTO), and the Executive agrees to accept such employment upon the terms set forth herein.
SECTION 2. COMPENSATION AND BENEFITS
2.1. Base Salary
The Company shall pay the Executive a base salary of INR 2,400,000 (Two Million Four Hundred Thousand Indian Rupees) per annum, payable in accordance with the Company's standard payroll practices in twelve equal monthly installments, subject to statutory deductions.`;

  const messages = [
    {
      role: "system",
      content:
        "You are a concise legal analyst. Extract the requested fields and return strictly valid JSON with keys: documentType, parties, effectiveDate, salary. Do not include markdown code blocks or conversational filler.",
    },
    {
      role: "user",
      content: `Analyze this contract excerpt:\n\n${sampleContractText}\n\nReturn compact JSON:`,
    },
  ];

  console.log(`Prompt size: ${sampleContractText.length} chars`);
  console.log("[Run 1/2] Non-streaming test (stream=false)...");
  const res1 = await runSingleTest(1, messages, 600, false);
  console.log(
    `  -> Status: ${res1.httpStatus} | Total: ${res1.totalMs}ms | Tokens: ${res1.outputTokens ?? "N/A"} | Content: ${res1.content}`
  );

  console.log("[Run 2/2] Streaming test (stream=true)...");
  const res2 = await runSingleTest(2, messages, 600, true);
  console.log(
    `  -> Status: ${res2.httpStatus} | Total: ${res2.totalMs}ms | TTFT: ${res2.ttftMs}ms | Tokens: ${res2.outputTokens ?? "N/A"} | Content: ${res2.content}`
  );

  return [res1, res2];
}

// -----------------------------------------------------------------------------
// CONTROL TEST 3: MEDIUM CONTEXT (~8K chars, maxTokens=1800)
// -----------------------------------------------------------------------------
export async function runMediumContextControlTest() {
  console.log("\n========================================================");
  console.log("CONTROL TEST 3: MEDIUM CONTEXT (~8K chars, maxTokens=1800)");
  console.log("========================================================");

  const { processDocument } = await import("../src/lib/document-engine/pipeline");
  const { buildDocumentAnalysisIndex } = await import("../src/lib/ai/context/document-index");
  const { buildAnalysisContext } = await import("../src/lib/ai/context/context-builder");

  const pdfPath = path.resolve(process.cwd(), "tests/fixtures/LexiGuide_AI_Comprehensive_Legal_Test_Contract.pdf");
  const buf = fs.readFileSync(pdfPath);
  const doc = await processDocument(buf, "contract.pdf", "application/pdf");
  const docIndex = buildDocumentAnalysisIndex(doc);
  const ctx = buildAnalysisContext(doc, 8000, docIndex);

  console.log(`Selected context: ${ctx.contextText.length} chars, ${ctx.includedChunks} chunks`);

  const messages = [
    {
      role: "system",
      content:
        "You are a legal analysis AI. Return strictly valid JSON containing: executiveSummary (1 concise paragraph), keyClauses (max 5 items, each with title, summary, importance, chunkId), potentialConcerns (max 3 items), obligations (max 5 items), importantDates (max 5 items). Keep summaries under 25 words. No markdown code blocks.",
    },
    {
      role: "user",
      content: `CONTRACT CONTEXT:\n${ctx.contextText}\n\nProduce compact JSON:`,
    },
  ];

  console.log("[Run 1/2] Non-streaming test (stream=false)...");
  const res1 = await runSingleTest(1, messages, 1800, false);
  console.log(
    `  -> Status: ${res1.httpStatus} | Total: ${res1.totalMs}ms | Tokens: ${res1.outputTokens ?? "N/A"} | Content: ${res1.content}`
  );

  console.log("[Run 2/2] Streaming test (stream=true)...");
  const res2 = await runSingleTest(2, messages, 1800, true);
  console.log(
    `  -> Status: ${res2.httpStatus} | Total: ${res2.totalMs}ms | TTFT: ${res2.ttftMs}ms | Tokens: ${res2.outputTokens ?? "N/A"} | Content: ${res2.content}`
  );

  return [res1, res2];
}

// -----------------------------------------------------------------------------
// CONTROL TEST 4: FULL PROPOSED CONTEXT (~14K-16K chars, maxTokens=2200)
// -----------------------------------------------------------------------------
export async function runFullContextControlTest() {
  console.log("\n========================================================");
  console.log("CONTROL TEST 4: FULL PROPOSED CONTEXT (~14K-16K chars, maxTokens=2200)");
  console.log("========================================================");

  const { processDocument } = await import("../src/lib/document-engine/pipeline");
  const { buildDocumentAnalysisIndex } = await import("../src/lib/ai/context/document-index");
  const { buildAnalysisContext } = await import("../src/lib/ai/context/context-builder");

  const pdfPath = path.resolve(process.cwd(), "tests/fixtures/LexiGuide_AI_Comprehensive_Legal_Test_Contract.pdf");
  const buf = fs.readFileSync(pdfPath);
  const doc = await processDocument(buf, "contract.pdf", "application/pdf");
  const docIndex = buildDocumentAnalysisIndex(doc);
  const ctx = buildAnalysisContext(doc, 15000, docIndex);

  console.log(`Selected context: ${ctx.contextText.length} chars, ${ctx.includedChunks} chunks`);

  const messages = [
    {
      role: "system",
      content:
        "You are a legal analysis AI. Return strictly valid JSON containing: metadata (documentType, parties, effectiveDate, terminationDate, governingLaw, financialTerms), executiveSummary (1 paragraph), keyClauses (max 7 items), potentialConcerns (max 4 items), obligations (max 6 items), importantDates (max 6 items). Keep every summary under 25 words. No markdown code blocks.",
    },
    {
      role: "user",
      content: `CONTRACT CONTEXT:\n${ctx.contextText}\n\nProduce compact JSON:`,
    },
  ];

  console.log("[Run 1/2] Non-streaming test (stream=false)...");
  const res1 = await runSingleTest(1, messages, 2200, false);
  console.log(
    `  -> Status: ${res1.httpStatus} | Total: ${res1.totalMs}ms | Tokens: ${res1.outputTokens ?? "N/A"} | Content: ${res1.content}`
  );

  console.log("[Run 2/2] Streaming test (stream=true)...");
  const res2 = await runSingleTest(2, messages, 2200, true);
  console.log(
    `  -> Status: ${res2.httpStatus} | Total: ${res2.totalMs}ms | TTFT: ${res2.ttftMs}ms | Tokens: ${res2.outputTokens ?? "N/A"} | Content: ${res2.content}`
  );

  return [res1, res2];
}

async function main() {
  console.log("STARTING COMPLETE CONTROL TEST MATRIX...\n");
  await runSmallLegalControlTest();
  await runMediumContextControlTest();
  await runFullContextControlTest();
}

if (require.main === module) {
  main().catch(console.error);
}

