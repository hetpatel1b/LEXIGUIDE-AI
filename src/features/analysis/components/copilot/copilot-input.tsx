"use client";

import * as React from "react";
import { Send, Sparkles } from "lucide-react";
import { IconButton } from "@/components/ui/icon-button";
import { cn } from "@/lib/utils";

export interface CopilotInputProps {
  onSendMessage: (text: string) => void;
  disabled?: boolean;
  className?: string;
}

export function CopilotInput({
  onSendMessage,
  disabled = false,
  className,
}: CopilotInputProps) {
  const [inputVal, setInputVal] = React.useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputVal.trim();
    if (!trimmed || disabled) return;
    onSendMessage(trimmed);
    setInputVal("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className={cn("p-3 border-t border-[var(--border)] bg-[var(--surface)] shrink-0 space-y-2", className)}>
      <form onSubmit={handleSubmit} className="flex items-center gap-1.5">
        <label htmlFor="copilot-query-input" className="sr-only">
          Ask a question about this document
        </label>
        <div className="relative flex-1">
          <input
            id="copilot-query-input"
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder="Ask about this document…"
            className="w-full h-9 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--background)] px-3 text-xs text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--focus-ring)] transition-all disabled:opacity-50"
          />
        </div>

        <IconButton
          type="submit"
          size="sm"
          variant="primary"
          disabled={!inputVal.trim() || disabled}
          aria-label="Send question to Document Copilot"
          title="Send question"
          className="h-9 w-9 shrink-0 shadow-sm"
        >
          <Send className="h-3.5 w-3.5" />
        </IconButton>
      </form>

      <p className="text-[10px] text-[var(--foreground-muted)] text-center leading-tight">
        Answers are strictly grounded in <span className="font-mono">Employment_Agreement_2026.pdf</span>.
      </p>
    </div>
  );
}
