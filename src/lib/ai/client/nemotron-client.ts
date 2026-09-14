import { getAiConfig, type AiRuntimeConfig } from "../config";
import { AiEngineError } from "../errors";
import type { AiProvider, ChatMessage, ChatCompletionRequest } from "./types";

/**
 * Server-side client for NVIDIA Nemotron document analysis.
 * Strictly communicates from the server runtime; never bundled to the browser.
 * Supports streaming with TTFT measurement, reasoning token suppression, and intelligent model failover.
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
   * Invokes NVIDIA Nemotron chat completion endpoint with streaming,
   * measures TTFT, strips reasoning tokens, and returns the assembled JSON content.
   */
  public async generateChatCompletion(messages: ChatMessage[]): Promise<string> {
    if (!this.config.apiKey) {
      throw new AiEngineError(
        "AI_CONFIG_ERROR",
        "NVIDIA_API_KEY is not configured on the server.",
        401
      );
    }

    try {
      return await this.executeChatStream(this.config.model, messages);
    } catch (primaryError) {
      // If primary model stalls or fails and a distinct fallback is configured, try fallback
      if (
        this.config.fallbackModel &&
        this.config.fallbackModel !== this.config.model &&
        primaryError instanceof AiEngineError &&
        (primaryError.code === "AI_TIMEOUT" || primaryError.code === "AI_PROVIDER_ERROR")
      ) {
        console.warn(
          `[AI-DIAG] Primary model (${this.config.model}) failed (${primaryError.code}). Failing over to ${this.config.fallbackModel}...`
        );
        return await this.executeChatStream(this.config.fallbackModel, messages);
      }

      throw primaryError;
    }
  }

  private async executeChatStream(
    modelName: string,
    messages: ChatMessage[]
  ): Promise<string> {
    const endpoint = `${this.config.baseURL.replace(/\/$/, "")}/chat/completions`;
    const payload: ChatCompletionRequest = {
      model: modelName,
      messages,
      temperature: this.config.temperature,
      max_tokens: this.config.maxTokens,
      stream: true,
      reasoning_effort: "none",
      chat_template_kwargs: {
        enable_thinking: false,
      },
      response_format: { type: "json_object" },
    };

    const t0 = Date.now();
    console.log(`[AI-DIAG] NVIDIA request started for model=${modelName}...`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutMs);

    let firstTokenTimer: NodeJS.Timeout | null = null;
    if (this.config.firstTokenTimeoutMs > 0) {
      firstTokenTimer = setTimeout(() => {
        console.warn(`[AI-DIAG] First token timeout (${this.config.firstTokenTimeoutMs}ms) exceeded for ${modelName}`);
        controller.abort();
      }, this.config.firstTokenTimeoutMs);
    }

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

      console.log(
        `[AI-DIAG] NVIDIA response headers received in ${Date.now() - t0}ms (status: ${response.status})`
      );

      if (!response.ok) {
        if (firstTokenTimer) clearTimeout(firstTokenTimer);
        clearTimeout(timeoutId);
        await this.handleHttpError(response);
      }

      if (!response.body) {
        if (firstTokenTimer) clearTimeout(firstTokenTimer);
        clearTimeout(timeoutId);
        throw new AiEngineError(
          "AI_INVALID_RESPONSE",
          "AI provider returned an empty response stream.",
          502
        );
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let firstTokenTime: number | null = null;
      let accumulatedContent = "";
      let lineBuffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunkText = decoder.decode(value, { stream: true });
        lineBuffer += chunkText;
        const lines = lineBuffer.split("\n");
        lineBuffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith(":") || trimmed === "data: [DONE]") {
            continue;
          }

          if (trimmed.startsWith("data:")) {
            try {
              const data = JSON.parse(trimmed.slice(5).trim());
              const delta = data.choices?.[0]?.delta;

              if (delta?.content) {
                if (!firstTokenTime) {
                  firstTokenTime = Date.now() - t0;
                  if (firstTokenTimer) {
                    clearTimeout(firstTokenTimer);
                    firstTokenTimer = null;
                  }
                  console.log(`[AI-DIAG] FIRST TOKEN RECEIVED (TTFT): ${firstTokenTime}ms`);
                }
                accumulatedContent += delta.content;
              }
              // delta.reasoning_content is deliberately ignored to protect against leakage
            } catch {
              // Ignore partial JSON parse errors in SSE line buffering
            }
          }
        }
      }

      if (firstTokenTimer) clearTimeout(firstTokenTimer);
      clearTimeout(timeoutId);

      const totalDuration = Date.now() - t0;
      console.log(
        `[AI-DIAG] NVIDIA stream completed in ${totalDuration}ms (TTFT: ${firstTokenTime || totalDuration}ms, chars: ${accumulatedContent.length})`
      );

      if (!accumulatedContent.trim()) {
        throw new AiEngineError(
          "AI_INVALID_RESPONSE",
          "AI provider returned empty response content.",
          502
        );
      }

      return accumulatedContent;
    } catch (error: unknown) {
      if (firstTokenTimer) clearTimeout(firstTokenTimer);
      clearTimeout(timeoutId);

      if (error instanceof AiEngineError) {
        throw error;
      }

      if (error instanceof Error && error.name === "AbortError") {
        throw new AiEngineError(
          "AI_TIMEOUT",
          `AI request timed out after ${Date.now() - t0}ms while processing.`,
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
