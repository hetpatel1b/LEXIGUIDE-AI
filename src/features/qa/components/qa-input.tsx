"use client";

import * as React from "react";
import { Send, Sparkles } from "lucide-react";
import { IconButton } from "@/components/ui/icon-button";
import { cn } from "@/lib/utils";

export interface QAInputProps {
  documentName?: string;
  onSendMessage: (text: string) => void;
  disabled?: boolean;
  className?: string;
}

export function QAInput({
  documentName,
  onSendMessage,
  disabled = false,
  className,
}: QAInputProps) {
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
    <div className={cn("p-4 border-t border-[var(--border)] bg-[var(--surface)] space-y-2 shrink-0 shadow-sm", className)}>
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <label htmlFor="qa-document-input" className="sr-only">
          Ask a question about this document
        </label>

        <div className="relative flex-1">
          <input
            id="qa-document-input"
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder="Ask anything about this document…"
            className="w-full h-11 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--background)] px-4 text-xs sm:text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--focus-ring)]/20 transition-all disabled:opacity-50"
          />
        </div>

        <IconButton
          type="submit"
          size="md"
          variant="primary"
          disabled={!inputVal.trim() || disabled}
          aria-label="Send question to document assistant"
          title="Send question"
          className="h-11 w-11 shrink-0 shadow-sm"
        >
          <Send className="h-4 w-4" />
        </IconButton>
      </form>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-[var(--foreground-muted)]">
        <span>Answers are intended to use information found in the selected document.</span>
        {documentName && <span className="font-mono text-[10px] truncate max-w-[200px]">{documentName}</span>}
      </div>
    </div>
  );
}
