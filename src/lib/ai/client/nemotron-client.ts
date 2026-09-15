import { getAiConfig, type AiRuntimeConfig } from "../config";
import { AiEngineError } from "../errors";
import type {
  AiProvider,
  ChatMessage,
  ChatCompletionRequest,
  ChatCompletionResult,
  ChatCompletionOptions,
} from "./types";

/**
 * Server-side client for NVIDIA Nemotron document analysis.
 * Strictly communicates from the server runtime; never bundled to the browser.
 * Configured for nvidia/nemotron-3-super-120b-a12b on the NVIDIA hosted OpenAI-compatible endpoint.
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
   * Invokes NVIDIA Nemotron chat completion endpoint,
   * measures TTFT, strips reasoning tokens, and returns the assembled JSON content.
   */
  public async generateChatCompletion(
    messages: ChatMessage[],
    options?: ChatCompletionOptions
  ): Promise<string> {
    const result = await this.generateChatCompletionDetailed(messages, options);
    return result.content;
  }

  /**
   * Invokes NVIDIA Nemotron with full metadata (finish_reason, token usage, TTFT, and latency).
   */
  public async generateChatCompletionDetailed(
    messages: ChatMessage[],
    options?: ChatCompletionOptions
  ): Promise<ChatCompletionResult> {
    if (!this.config.apiKey) {
      throw new AiEngineError(
        "AI_CONFIG_ERROR",
        "NVIDIA_API_KEY is not configured on the server.",
        401
      );
    }

    const targetModel = options?.model || this.config.model;

    // Safety constraint: Verify we never accidentally run Ultra
    if (targetModel.includes("ultra-550b")) {
      throw new AiEngineError(
        "AI_CONFIG_ERROR",
        `Configuration Error: Model resolved to Ultra (${targetModel}). LexiGuide Phase 3 requires nvidia/nemotron-3-super-120b-a12b.`,
        500
      );
    }

    const reqTag = options?.requestId ? `[${options.requestId}]` : "";
    console.log(`[AI-DIAG]${reqTag} provider=${this.config.provider} model=${targetModel}`);

    const retryDelays = [2500, 5000];
    let lastError: unknown;

    for (let attempt = 0; attempt <= retryDelays.length; attempt++) {
      const isRetry = attempt > 0;
      try {
        return await this.executeChat(targetModel, messages, options, isRetry);
      } catch (err) {
        lastError = err;

        const isTransient =
          err instanceof AiEngineError &&
          (err.code === "AI_PROVIDER_ERROR" || err.code === "AI_RATE_LIMITED") &&
          (err.statusCode === 429 ||
            err.statusCode === 500 ||
            err.statusCode === 502 ||
            err.statusCode === 503 ||
            err.statusCode === 504);

        if (isTransient && attempt < retryDelays.length) {
          const delay = retryDelays[attempt];
          console.warn(
            `[AI-DIAG]${reqTag} Transient HTTP ${err.statusCode} received from ${targetModel} (attempt ${attempt + 1}/${retryDelays.length + 1}). Retrying in ${delay}ms...`
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        throw err;
      }
    }

    throw lastError;
  }

  private async executeChat(
    modelName: string,
    messages: ChatMessage[],
    options?: ChatCompletionOptions,
    isRetry = false
  ): Promise<ChatCompletionResult> {
    const endpoint = `${this.config.baseURL.replace(/\/$/, "")}/chat/completions`;
    const reqTag = options?.requestId ? `[${options.requestId}]` : "";
    const isStream = options?.stream !== false;
    const reasoningEffort = options?.reasoningEffort ?? "none";
    const enableThinking = options?.enableThinking ?? false;

    const payload: ChatCompletionRequest = {
      model: modelName,
      messages,
      temperature: options?.temperature ?? this.config.temperature,
      max_tokens: options?.maxTokens ?? this.config.maxTokens,
      stream: isStream,
      reasoning_effort: reasoningEffort,
      chat_template_kwargs: {
        enable_thinking: enableThinking,
      },
      response_format: { type: "json_object" },
    };

    const t0 = Date.now();
    console.log(
      `[AI-DIAG]${reqTag} ${isRetry ? "RETRY " : ""}NVIDIA request started: provider=nvidia model=${modelName} stream=${isStream} reasoning_effort=${reasoningEffort} max_tokens=${payload.max_tokens}`
    );

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutMs);

    let firstTokenTimer: NodeJS.Timeout | null = null;
    if (isStream && this.config.firstTokenTimeoutMs > 0) {
      firstTokenTimer = setTimeout(() => {
        console.warn(
          `[AI-DIAG]${reqTag} First token timeout (${this.config.firstTokenTimeoutMs}ms) exceeded for ${modelName}`
        );
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

      const headersMs = Date.now() - t0;
      console.log(
        `[AI-DIAG]${reqTag} NVIDIA response headers received in ${headersMs}ms (status: ${response.status})`
      );

      if (!response.ok) {
        if (firstTokenTimer) clearTimeout(firstTokenTimer);
        clearTimeout(timeoutId);
        await this.handleHttpError(response);
      }

      // Non-streaming response handling
      if (!isStream) {
        clearTimeout(timeoutId);
        const json = await response.json();
        const totalDuration = Date.now() - t0;
        const choice = json.choices?.[0];
        const content = choice?.message?.content || "";
        const finishReason = choice?.finish_reason || null;
        const usage = json.usage
          ? {
              promptTokens: json.usage.prompt_tokens,
              completionTokens: json.usage.completion_tokens,
              totalTokens: json.usage.total_tokens,
            }
          : undefined;
        const estimatedOutputTokens = Math.ceil(content.length / 4);

        console.log(
          `[PERF]${reqTag} provider=nvidia model=${modelName} stream=false reasoning_effort=${reasoningEffort} nvidia_request_ms=${totalDuration} ttft_ms=${totalDuration} generation_ms=${totalDuration} output_chars=${content.length} output_estimated_tokens=${estimatedOutputTokens} finish_reason=${finishReason}`
        );

        if (!content.trim()) {
          throw new AiEngineError(
            "AI_INVALID_RESPONSE",
            "AI provider returned empty response content.",
            502
          );
        }

        return {
          content,
          finishReason,
          usage,
          ttftMs: totalDuration,
          totalDurationMs: totalDuration,
          model: modelName,
          estimatedOutputTokens,
        };
      }

      // Streaming response handling
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
      let finishReason: string | null = null;
      let usage: { promptTokens?: number; completionTokens?: number; totalTokens?: number } | undefined;
      let lineBuffer = "";
      let streamError: AiEngineError | null = null;

      const processSseLine = (line: string) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith(":") || trimmed === "data: [DONE]") {
          return;
        }

        if (trimmed.startsWith("data:")) {
          try {
            const data = JSON.parse(trimmed.slice(5).trim());

            if (data.error) {
              const errMsg = data.error.message || "AI provider stream error";
              const errCode = data.error.code === 503 ? 503 : 502;
              streamError = new AiEngineError("AI_PROVIDER_ERROR", errMsg, errCode);
              return;
            }

            const choice = data.choices?.[0];
            const delta = choice?.delta;

            const hasAnyToken = Boolean(delta?.content || delta?.reasoning_content);
            if (hasAnyToken && !firstTokenTime) {
              firstTokenTime = Date.now() - t0;
              if (firstTokenTimer) {
                clearTimeout(firstTokenTimer);
                firstTokenTimer = null;
              }
              console.log(`[AI-DIAG]${reqTag} FIRST TOKEN RECEIVED (TTFT): ${firstTokenTime}ms`);
            }

            if (delta?.content) {
              accumulatedContent += delta.content;
            }

            if (choice?.finish_reason) {
              finishReason = choice.finish_reason;
            }

            if (data.usage) {
              usage = {
                promptTokens: data.usage.prompt_tokens,
                completionTokens: data.usage.completion_tokens,
                totalTokens: data.usage.total_tokens,
              };
            }
          } catch (parseErr) {
            if (parseErr instanceof AiEngineError) {
              streamError = parseErr;
            }
            // Ignore partial SSE JSON parse errors
          }
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          if (lineBuffer.trim()) {
            processSseLine(lineBuffer.trim());
          }
          break;
        }

        const chunkText = decoder.decode(value, { stream: true });
        lineBuffer += chunkText;
        const lines = lineBuffer.split("\n");
        lineBuffer = lines.pop() || "";

        for (const line of lines) {
          processSseLine(line);
        }
      }

      if (firstTokenTimer) clearTimeout(firstTokenTimer);
      clearTimeout(timeoutId);

      if (streamError) {
        throw streamError;
      }

      const totalDuration = Date.now() - t0;
      const ttft = firstTokenTime || totalDuration;
      const generationMs = Math.max(0, totalDuration - ttft);
      const estimatedOutputTokens = Math.ceil(accumulatedContent.length / 4);

      console.log(
        `[PERF]${reqTag} provider=nvidia model=${modelName} stream=true reasoning_effort=${reasoningEffort} nvidia_request_ms=${totalDuration} ttft_ms=${ttft} generation_ms=${generationMs} output_chars=${accumulatedContent.length} output_estimated_tokens=${estimatedOutputTokens} finish_reason=${finishReason}`
      );
      console.log(
        `[AI-DIAG]${reqTag} NVIDIA stream completed in ${totalDuration}ms (TTFT: ${ttft}ms, finish_reason: ${finishReason}, chars: ${accumulatedContent.length})`
      );

      if (!accumulatedContent.trim()) {
        throw new AiEngineError(
          "AI_INVALID_RESPONSE",
          "AI provider returned empty response content.",
          502
        );
      }

      return {
        content: accumulatedContent,
        finishReason,
        usage,
        ttftMs: ttft,
        totalDurationMs: totalDuration,
        model: modelName,
        estimatedOutputTokens,
      };
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

    if (status === 503) {
      throw new AiEngineError(
        "AI_PROVIDER_ERROR",
        `NVIDIA API server temporarily unavailable (HTTP 503).`,
        503,
        { status, errorSnippet: safeErrorBody }
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
