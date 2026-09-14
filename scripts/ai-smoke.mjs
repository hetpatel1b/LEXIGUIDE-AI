import fs from "fs";
import path from "path";

// Load .env.local if present
const envPath = path.resolve(process.cwd(), ".env.local");
let apiKey = process.env.NVIDIA_API_KEY || "";
let modelId = process.env.NVIDIA_MODEL_ID || "nvidia/nemotron-3-super-120b-a12b";

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith("NVIDIA_API_KEY=")) {
      apiKey = trimmed.substring("NVIDIA_API_KEY=".length).trim().replace(/^["']|["']$/g, "");
    }
    if (trimmed.startsWith("AI_MODEL=")) {
      modelId = trimmed.substring("AI_MODEL=".length).trim().replace(/^["']|["']$/g, "");
    }
    if (trimmed.startsWith("NVIDIA_MODEL_ID=") && !trimmed.startsWith("AI_MODEL=")) {
      modelId = trimmed.substring("NVIDIA_MODEL_ID=".length).trim().replace(/^["']|["']$/g, "");
    }
  }
}

console.log("\n========================================================");
console.log("LexiGuide Nemotron Smoke Test");
console.log("========================================================");
console.log(`Model:     ${modelId}`);
console.log(`API Key:   ${apiKey ? "configured" : "MISSING"}`);
console.log(`Reasoning: disabled (none)`);
console.log(`Streaming: enabled`);

if (!apiKey) {
  console.log("Status:    FAIL (NVIDIA_API_KEY not configured in .env.local)");
  console.log("========================================================\n");
  process.exit(1);
}

const endpoint = "https://integrate.api.nvidia.com/v1/chat/completions";
const t0 = Date.now();

try {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: modelId,
      messages: [
        { role: "system", content: "You are a test assistant. Return JSON." },
        { role: "user", content: 'Return {"ok":true}' }
      ],
      max_tokens: 50,
      temperature: 0.1,
      stream: true,
      reasoning_effort: "none",
      chat_template_kwargs: {
        enable_thinking: false
      },
      response_format: { type: "json_object" }
    }),
    signal: controller.signal,
  });

  if (!res.ok) {
    clearTimeout(timeoutId);
    console.log(`HTTP Error: ${res.status}`);
    console.log("Status:    FAIL");
    console.log("========================================================\n");
    process.exit(1);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let firstTokenTime = null;
  let accumulated = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const text = decoder.decode(value, { stream: true });
    if (!firstTokenTime) {
      firstTokenTime = Date.now() - t0;
    }
    for (const line of text.split("\n")) {
      const trimmed = line.trim();
      if (trimmed.startsWith("data:") && !trimmed.includes("[DONE]")) {
        try {
          const parsed = JSON.parse(trimmed.slice(5).trim());
          const delta = parsed.choices?.[0]?.delta?.content;
          if (delta) accumulated += delta;
        } catch {}
      }
    }
  }

  clearTimeout(timeoutId);
  const total = Date.now() - t0;
  console.log(`TTFT:      ${firstTokenTime || total}ms`);
  console.log(`Total:     ${total}ms`);
  console.log(`Response:  ${accumulated.trim()}`);
  console.log("Status:    PASS");
  console.log("========================================================\n");
} catch (err) {
  const total = Date.now() - t0;
  console.log(`Total:     ${total}ms`);
  console.log(`Error:     ${err.name} - ${err.message}`);
  console.log("Status:    FAIL");
  console.log("========================================================\n");
  process.exit(1);
}
