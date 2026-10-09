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
 * Server-side client for Groq API document intelligence.
 * Strictly communicates from the server runtime; never bundled to the browser.
 * Configured for openai/gpt-oss-120b on the official Groq OpenAI-compatible endpoint.
 */
export class GroqClient implements AiProvider {
  private readonly config: AiRuntimeConfig;

  constructor(customConfig?: Partial<AiRuntimeConfig>) {
    const baseConfig = getAiConfig();
    this.config = {
      ...baseConfig,
      ...customConfig,
    };
  }

  /**
   * Invokes Groq chat completions endpoint,
   * measures TTFT, ensures clean structured JSON, and returns the assembled content.
   */
  public async generateChatCompletion(
    messages: ChatMessage[],
    options?: ChatCompletionOptions
  ): Promise<string> {
    const result = await this.generateChatCompletionDetailed(messages, options);
    return result.content;
  }

  /**
   * Invokes Groq with full metadata (finish_reason, token usage, TTFT, and latency).
   */
  public async generateChatCompletionDetailed(
    messages: ChatMessage[],
    options?: ChatCompletionOptions
  ): Promise<ChatCompletionResult> {
    if (!this.config.apiKey) {
      throw new AiEngineError(
        "AI_CONFIG_ERROR",
        "GROQ_API_KEY is not configured on the server.",
        401
      );
    }

    const targetModel = options?.model || this.config.model;

    // Safety constraint: Validate model is not blank or unsupported
    if (!targetModel || targetModel.trim() === "") {
      throw new AiEngineError(
        "AI_CONFIG_ERROR",
        "Configuration Error: Groq model ID is not configured.",
        500
      );
    }

    const reqTag = options?.requestId ? `[${options.requestId}]` : "";
    console.log(`[AI-DIAG]${reqTag} provider=${this.config.provider} model=${targetModel}`);

    const maxRetries = 2;
    const maxElapsedRetryMs = 18000;
    let elapsedRetryMs = 0;
    let lastError: unknown;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const isRetry = attempt > 0;
      try {
        return await this.executeChat(targetModel, messages, options, isRetry);
      } catch (err) {
        lastError = err;

        if (attempt >= maxRetries) {
          throw err;
        }

        // 1. Rate Limit handling (HTTP 429)
        if (err instanceof AiEngineError && err.code === "AI_RATE_LIMITED" && err.statusCode === 429) {
          // Rule: If daily account/model quota is exhausted, never retry!
          if (err.details?.isDailyQuota) {
            console.warn(`[AI-DIAG]${reqTag} Groq daily quota exhausted. Retries aborted immediately.`);
            throw err;
          }

          const rawRetrySec = typeof err.details?.retryAfterSeconds === "number" ? err.details.retryAfterSeconds : 8;
          // Rule: If provider reset window exceeds reasonable request wait (>15s), abort retry to avoid hanging serverless request
          if (rawRetrySec > 15) {
            console.warn(
              `[AI-DIAG]${reqTag} Groq rate limit reset (${rawRetrySec}s) exceeds retry threshold (>15s). Aborting synchronous retry.`
            );
            throw err;
          }

          // Compute backoff with jitter
          const delayMs = Math.round(rawRetrySec * 1000 + Math.random() * 500);
          if (elapsedRetryMs + delayMs > maxElapsedRetryMs) {
            console.warn(
              `[AI-DIAG]${reqTag} Retry delay of ${delayMs}ms would exceed total retry budget (${maxElapsedRetryMs}ms). Aborting.`
            );
            throw err;
          }

          elapsedRetryMs += delayMs;
          console.warn(
            `[AI-DIAG]${reqTag} Transient HTTP 429 received from ${targetModel} (${err.details?.rateLimitType || "tokens"}). Respecting provider reset of ${delayMs}ms (attempt ${attempt + 1}/${maxRetries + 1}). Retrying...`
          );
          await new Promise((resolve) => setTimeout(resolve, delayMs));
          continue;
        }

        // 2. Transient 5xx server errors
        const isTransient5xx =
          err instanceof AiEngineError &&
          err.code === "AI_PROVIDER_ERROR" &&
          (err.statusCode === 500 ||
            err.statusCode === 502 ||
            err.statusCode === 503 ||
            err.statusCode === 504);

        if (isTransient5xx) {
          const baseDelay = attempt === 0 ? 1500 : 3000;
          const delayMs = Math.round(baseDelay + Math.random() * 500);
          if (elapsedRetryMs + delayMs > maxElapsedRetryMs) {
            throw err;
          }
          elapsedRetryMs += delayMs;
          console.warn(
            `[AI-DIAG]${reqTag} Transient HTTP ${err.statusCode} from ${targetModel}. Retrying in ${delayMs}ms (attempt ${attempt + 1}/${maxRetries + 1})...`
          );
          await new Promise((resolve) => setTimeout(resolve, delayMs));
          continue;
        }

        // Non-transient errors (auth 401, validation 400, timeout, abort, etc.): do not retry
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
    const reasoningEffort = options?.reasoningEffort ?? this.config.reasoningEffort ?? "low";

    const payload: ChatCompletionRequest = {
      model: modelName,
      messages,
      temperature: options?.temperature ?? this.config.temperature,
      max_tokens: options?.maxTokens ?? this.config.maxTokens,
      stream: isStream,
      response_format: { type: "json_object" },
      reasoning_format: options?.reasoningFormat ?? "hidden",
    };

    if (reasoningEffort && reasoningEffort !== "none") {
      payload.reasoning_effort = reasoningEffort;
    }

    const t0 = Date.now();
    console.log(
      `[AI-DIAG]${reqTag} ${isRetry ? "RETRY " : ""}Groq request started: provider=groq model=${modelName} stream=${isStream} max_tokens=${payload.max_tokens}`
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
        `[AI-DIAG]${reqTag} Groq response headers received in ${headersMs}ms (status: ${response.status})`
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
          `[PERF]${reqTag} provider=groq model=${modelName} stream=false groq_request_ms=${totalDuration} ttft_ms=${totalDuration} generation_ms=${totalDuration} output_chars=${content.length} output_estimated_tokens=${estimatedOutputTokens} finish_reason=${finishReason}`
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

      let sawDoneEvent = false;

      const processSseLine = (line: string) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith(":")) {
          return;
        }

        if (trimmed === "data: [DONE]") {
          sawDoneEvent = true;
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

      try {
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
      } finally {
        reader.releaseLock();
      }

      if (firstTokenTimer) clearTimeout(firstTokenTimer);
      clearTimeout(timeoutId);

      if (streamError) {
        throw streamError;
      }

      // Detect premature stream termination without provider completion signal
      if (!sawDoneEvent && !finishReason && accumulatedContent.length > 0) {
        console.warn(
          `[AI-DIAG]${reqTag} Stream closed without [DONE] or finish_reason. Marking as interrupted.`
        );
        finishReason = "interrupted";
      }

      const totalDuration = Date.now() - t0;
      const ttft = firstTokenTime || totalDuration;
      const generationMs = Math.max(0, totalDuration - ttft);
      const estimatedOutputTokens = Math.ceil(accumulatedContent.length / 4);

      console.log(
        `[PERF]${reqTag} provider=groq model=${modelName} stream=true groq_request_ms=${totalDuration} ttft_ms=${ttft} generation_ms=${generationMs} output_chars=${accumulatedContent.length} output_estimated_tokens=${estimatedOutputTokens} finish_reason=${finishReason}`
      );
      console.log(
        `[AI-DIAG]${reqTag} Groq stream completed in ${totalDuration}ms (TTFT: ${ttft}ms, finish_reason: ${finishReason}, chars: ${accumulatedContent.length})`
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
      safeErrorBody = body.slice(0, 500);
    } catch {
      safeErrorBody = "Unable to parse error body";
    }

    if (status === 401 || status === 403) {
      throw new AiEngineError(
        "AI_AUTH_ERROR",
        "Authentication failed with Groq API. Please verify GROQ_API_KEY.",
        401
      );
    }

    if (status === 429) {
      const rateLimitInfo = this.parseRateLimitDetails(response, safeErrorBody);
      const isDailyQuota = rateLimitInfo.isDailyQuota;
      const retryAfterSeconds = Math.max(1, Math.ceil(rateLimitInfo.retryAfterSeconds));

      const message = isDailyQuota
        ? "The AI provider's daily usage limit has been reached. Please try again after the quota resets."
        : `Groq is temporarily rate-limiting analysis requests. Please try again in ${retryAfterSeconds} seconds.`;

      throw new AiEngineError(
        "AI_RATE_LIMITED",
        message,
        429,
        {
          retryAfterSeconds,
          isDailyQuota,
          rateLimitType: rateLimitInfo.rateLimitType,
          status: 429,
          errorSnippet: safeErrorBody.slice(0, 300),
        }
      );
    }

    if (status === 503) {
      throw new AiEngineError(
        "AI_PROVIDER_ERROR",
        `Groq API server temporarily unavailable (HTTP 503).`,
        503,
        { status, errorSnippet: safeErrorBody }
      );
    }

    if (status >= 500) {
      throw new AiEngineError(
        "AI_PROVIDER_ERROR",
        `Groq API server error (HTTP ${status}).`,
        502,
        { status, errorSnippet: safeErrorBody }
      );
    }

    throw new AiEngineError(
      "AI_PROVIDER_ERROR",
      `Groq API returned HTTP ${status}.`,
      status,
      { status, errorSnippet: safeErrorBody }
    );
  }

  /**
   * Defensively extracts rate-limit reset and quota metadata from response headers and error payload.
   */
  private parseRateLimitDetails(
    response: Response,
    bodyText: string
  ): { retryAfterSeconds: number; isDailyQuota: boolean; rateLimitType: string } {
    let isDailyQuota = false;
    let retryAfterSeconds = 0;
    let rateLimitType = "tokens";

    // 1. Inspect HTTP header: retry-after
    const retryAfterHeader = response.headers.get("retry-after");
    if (retryAfterHeader) {
      const parsed = parseFloat(retryAfterHeader);
      if (!isNaN(parsed) && parsed > 0) {
        retryAfterSeconds = parsed;
      }
    }

    // 2. Inspect HTTP header: x-ratelimit-reset-tokens (e.g. "7.62s", "39.142s", "1m20s")
    const resetTokensHeader = response.headers.get("x-ratelimit-reset-tokens");
    if (!retryAfterSeconds && resetTokensHeader) {
      const mSec = resetTokensHeader.match(/^(\d+(?:\.\d+)?)s$/);
      const mMinSec = resetTokensHeader.match(/^(\d+)m(?:(\d+(?:\.\d+)?)s)?$/);
      if (mSec) {
        retryAfterSeconds = parseFloat(mSec[1]);
      } else if (mMinSec) {
        retryAfterSeconds = parseInt(mMinSec[1], 10) * 60 + (mMinSec[2] ? parseFloat(mMinSec[2]) : 0);
      }
    }

    // 3. Inspect JSON body error message if available
    try {
      const data = JSON.parse(bodyText);
      const msg = data.error?.message || "";
      rateLimitType = data.error?.type || "tokens";

      if (/daily|per day|day limit|tokens_per_day/i.test(msg) || rateLimitType === "daily_tokens") {
        isDailyQuota = true;
      }

      if (!retryAfterSeconds && msg) {
        const match = msg.match(/try again in (\d+(?:\.\d+)?)s/i);
        if (match) {
          retryAfterSeconds = parseFloat(match[1]);
        }
      }
    } catch {
      if (/daily|per day|day limit/i.test(bodyText)) {
        isDailyQuota = true;
      }
    }

    if (!retryAfterSeconds) {
      retryAfterSeconds = isDailyQuota ? 86400 : 8;
    }

    return { retryAfterSeconds, isDailyQuota, rateLimitType };
  }
}

// Backwards-compatible alias for legacy references if any remain during migration
export { GroqClient as NemotronClient };
