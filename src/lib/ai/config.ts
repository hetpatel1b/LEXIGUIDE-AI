import { AiEngineError } from "./errors";

/**
 * Server-only AI configuration for Groq API document analysis.
 * Enforces conservative, grounded defaults appropriate for legal documents.
 */
export const AI_CONFIG = {
  defaultProvider: "groq",
  defaultModel: "openai/gpt-oss-120b",
  fallbackModel: "",
  defaultBaseURL: "https://api.groq.com/openai/v1",
  temperature: 0.1,
  maxTokens: 3000,
  timeoutMs: 120000,
  firstTokenTimeoutMs: 90000,
  maxContextChars: 9500, // ~2,375 tokens coverage-aware context. With maxTokens 3000, total request reservation is ~5,800 tokens, well below Groq 8,000 TPM
  reasoningEffort: "low",
  schemaVersion: "1.0",
} as const;

export interface AiRuntimeConfig {
  apiKey: string;
  provider: string;
  model: string;
  fallbackModel: string;
  baseURL: string;
  temperature: number;
  maxTokens: number;
  timeoutMs: number;
  firstTokenTimeoutMs: number;
  maxContextChars: number;
  reasoningEffort: "low" | "medium" | "high";
  schemaVersion: string;
}

/**
 * Returns the validated, server-only AI runtime configuration.
 * Throws AiEngineError(AI_CONFIG_ERROR) if GROQ_API_KEY is not configured.
 */
export function getAiConfig(): AiRuntimeConfig {
  if (typeof window !== "undefined") {
    throw new Error("Security Violation: AI configuration cannot be accessed in the browser.");
  }

  const apiKey = process.env.GROQ_API_KEY || "";
  if (!apiKey) {
    throw new AiEngineError(
      "AI_CONFIG_ERROR",
      "GROQ_API_KEY is not configured on the server.",
      401
    );
  }

  const provider = process.env.AI_PROVIDER || AI_CONFIG.defaultProvider;
  const model = process.env.AI_MODEL || process.env.GROQ_MODEL_ID || AI_CONFIG.defaultModel;
  const fallbackModel = process.env.GROQ_FALLBACK_MODEL_ID || AI_CONFIG.fallbackModel;
  const baseURL =
    process.env.GROQ_BASE_URL || process.env.GROQ_API_BASE_URL || AI_CONFIG.defaultBaseURL;

  return {
    apiKey,
    provider,
    model,
    fallbackModel,
    baseURL,
    temperature: AI_CONFIG.temperature,
    maxTokens: AI_CONFIG.maxTokens,
    timeoutMs: AI_CONFIG.timeoutMs,
    firstTokenTimeoutMs: AI_CONFIG.firstTokenTimeoutMs,
    maxContextChars: AI_CONFIG.maxContextChars,
    reasoningEffort: AI_CONFIG.reasoningEffort,
    schemaVersion: AI_CONFIG.schemaVersion,
  };
}
