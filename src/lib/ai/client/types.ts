export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
  reasoning_effort?: "none" | "low" | "medium" | "high";
  reasoning_format?: "hidden" | "parsed" | "raw";
  response_format?: { type: "json_object" };
}

export interface ChatCompletionChoice {
  index: number;
  message?: {
    role: string;
    content: string;
    reasoning_content?: string | null;
  };
  delta?: {
    role?: string;
    content?: string;
    reasoning_content?: string | null;
  };
  finish_reason?: string | null;
}

export interface ChatCompletionResponse {
  id: string;
  choices: ChatCompletionChoice[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface ChatCompletionResult {
  content: string;
  finishReason: string | null;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
  ttftMs: number;
  totalDurationMs: number;
  model: string;
  estimatedOutputTokens?: number;
}

export interface ChatCompletionOptions {
  maxTokens?: number;
  temperature?: number;
  requestId?: string;
  reasoningEffort?: "none" | "low" | "medium" | "high";
  reasoningFormat?: "hidden" | "parsed" | "raw";
  enableThinking?: boolean;
  stream?: boolean;
  model?: string;
}

/**
 * Pluggable AI provider interface.
 * Abstracts the underlying AI provider (Groq API) away from application logic
 * for clean testability and future expansions.
 */
export interface AiProvider {
  generateChatCompletion(messages: ChatMessage[], options?: ChatCompletionOptions): Promise<string>;
  generateChatCompletionDetailed?(messages: ChatMessage[], options?: ChatCompletionOptions): Promise<ChatCompletionResult>;
}
