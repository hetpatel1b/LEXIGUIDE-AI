import { getAiConfig, type AiRuntimeConfig } from "../config";
import { AiEngineError } from "../errors";
import type { AiProvider, ChatMessage, ChatCompletionRequest, ChatCompletionResponse } from "./types";

/**
 * Server-side client for NVIDIA Nemotron-3-Ultra-550B.
 * Strictly communicates from the server runtime; never bundled to the browser.
 */
export class NemotronClient implements AiProvider {
  private readonly config: AiRuntimeConfig;

  constructor(customConfig?: Partial<AiRuntimeConfig>) {
    const baseConfig = getAiConfig();
    this.config = {
      ...baseConfig,
      ...customConfig,
    };
  }

  /**
   * Invokes NVIDIA Nemotron chat completion endpoint and returns the raw assistant response content.
   */
  public async generateChatCompletion(messages: ChatMessage[]): Promise<string> {
    if (!this.config.apiKey) {
      throw new AiEngineError(
        "AI_CONFIG_ERROR",
        "NVIDIA_API_KEY is not configured on the server.",
        401
      );
    }

    const endpoint = `${this.config.baseURL.replace(/\/$/, "")}/chat/completions`;
    const payload: ChatCompletionRequest = {
      model: this.config.model,
      messages,
      temperature: this.config.temperature,
      max_tokens: this.config.maxTokens,
      stream: false,
      response_format: { type: "json_object" },
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutMs);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        await this.handleHttpError(response);
      }

      const data = (await response.json()) as ChatCompletionResponse;

      if (!data || !data.choices || data.choices.length === 0 || !data.choices[0].message) {
        throw new AiEngineError(
          "AI_INVALID_RESPONSE",
          "AI provider returned an empty or malformed completion response.",
          502
        );
      }

      return data.choices[0].message.content;
    } catch (error: unknown) {
      clearTimeout(timeoutId);

      if (error instanceof AiEngineError) {
        throw error;
      }

      if (error instanceof Error && error.name === "AbortError") {
        throw new AiEngineError(
          "AI_TIMEOUT",
          `AI request timed out after ${this.config.timeoutMs}ms.`,
          504
        );
      }

      throw new AiEngineError(
        "AI_UNKNOWN_ERROR",
        error instanceof Error ? error.message : "Network error contacting AI provider.",
        500
      );
    }
  }

  private async handleHttpError(response: Response): Promise<never> {
    const status = response.status;
    let safeErrorBody = "";
    try {
      const body = await response.text();
      // Keep only first 200 chars and avoid leaking sensitive headers or tokens
      safeErrorBody = body.slice(0, 200);
    } catch {
      safeErrorBody = "Unable to parse error body";
    }

    if (status === 401 || status === 403) {
      throw new AiEngineError(
        "AI_AUTH_ERROR",
        "Authentication failed with NVIDIA API. Please verify NVIDIA_API_KEY.",
        401
      );
    }

    if (status === 429) {
      throw new AiEngineError(
        "AI_RATE_LIMITED",
        "NVIDIA API rate limit exceeded. Please try again later.",
        429
      );
    }

    if (status >= 500) {
      throw new AiEngineError(
        "AI_PROVIDER_ERROR",
        `NVIDIA API server error (HTTP ${status}).`,
        502,
        { status, errorSnippet: safeErrorBody }
      );
    }

    throw new AiEngineError(
      "AI_PROVIDER_ERROR",
      `NVIDIA API returned HTTP ${status}.`,
      status,
      { status, errorSnippet: safeErrorBody }
    );
  }
}
