import { AiEngineError } from "./errors";

/**
 * Server-only AI configuration for NVIDIA Nemotron document analysis.
 * Enforces conservative, grounded defaults appropriate for legal documents.
 */
export const AI_CONFIG = {
  defaultProvider: "nvidia",
  defaultModel: "nvidia/nemotron-3-super-120b-a12b",
  fallbackModel: "",
  defaultBaseURL: "https://integrate.api.nvidia.com/v1",
  temperature: 0.1,
  maxTokens: 4096,
  timeoutMs: 120000,
  firstTokenTimeoutMs: 90000,
  maxContextChars: 18000, // ~4,500 tokens coverage-aware bounded context across all 15 categories
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
  schemaVersion: string;
}

/**
 * Returns the validated, server-only AI runtime configuration.
 * Throws AiEngineError(AI_CONFIG_ERROR) if NVIDIA_API_KEY is not configured.
 */
export function getAiConfig(): AiRuntimeConfig {
  if (typeof window !== "undefined") {
    throw new Error("Security Violation: AI configuration cannot be accessed in the browser.");
  }

  const apiKey = process.env.NVIDIA_API_KEY || "";
  if (!apiKey) {
    throw new AiEngineError(
      "AI_CONFIG_ERROR",
      "NVIDIA_API_KEY is not configured on the server.",
      401
    );
  }

  const provider = process.env.AI_PROVIDER || AI_CONFIG.defaultProvider;
  const model = process.env.AI_MODEL || process.env.NVIDIA_MODEL_ID || AI_CONFIG.defaultModel;
  const fallbackModel = process.env.NVIDIA_FALLBACK_MODEL_ID || AI_CONFIG.fallbackModel;
  const baseURL =
    process.env.NVIDIA_BASE_URL || process.env.NVIDIA_API_BASE_URL || AI_CONFIG.defaultBaseURL;

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
    schemaVersion: AI_CONFIG.schemaVersion,
  };
}
