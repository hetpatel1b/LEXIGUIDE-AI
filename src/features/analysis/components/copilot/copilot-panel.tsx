"use client";

import * as React from "react";
import {
  Sparkles,
  PanelRightClose,
  PanelRightOpen,
  RotateCcw,
} from "lucide-react";
import { IconButton } from "@/components/ui/icon-button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CopilotMessage, type CopilotMessageItem } from "./copilot-message";
import { CopilotInput } from "./copilot-input";
import type { EvidenceDetail } from "@/types";
import type { NormalizedDocument } from "@/types/document";

export interface CopilotPanelProps {
  document?: NormalizedDocument | null;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onViewEvidence?: (evidence: EvidenceDetail) => void;
  className?: string;
}

const DEFAULT_SUGGESTIONS = [
  "What are the termination conditions?",
  "What are my key obligations?",
  "Are there restrictive covenants or non-compete terms?",
  "What is the governing law and dispute jurisdiction?",
];

export function CopilotPanel({
  document,
  isCollapsed,
  onToggleCollapse,
  onViewEvidence,
  className,
}: CopilotPanelProps) {
  const docName = document?.displayName;

  const initialMessage = React.useMemo<CopilotMessageItem>(() => {
    if (docName) {
      return {
        id: "init-1",
        sender: "assistant",
        text: `Hello! I am your Document Copilot for ${docName}. Ask me any questions about clauses, obligations, dates, or key terms.`,
        documentTitle: docName,
        timestamp: "Just now",
      };
    }
    return {
      id: "init-1",
      sender: "assistant",
      text: "Hello! I am your Document Copilot. Please upload or select a document to ask questions about its clauses, obligations, dates, and terms.",
      timestamp: "Just now",
    };
  }, [docName]);

  const [prevDocName, setPrevDocName] = React.useState(docName);
  const [messages, setMessages] = React.useState<CopilotMessageItem[]>([initialMessage]);
  const [isTyping, setIsTyping] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const counterRef = React.useRef(100);

  // Re-sync initial message when active document changes
  if (docName !== prevDocName) {
    setPrevDocName(docName);
    setMessages([initialMessage]);
  }

  // Auto-scroll on new messages
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = (userText: string) => {
    counterRef.current += 1;
    const userMsg: CopilotMessageItem = {
      id: `usr-${counterRef.current}`,
      sender: "user",
      text: userText,
      timestamp: "Just now",
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    setTimeout(() => {
      counterRef.current += 1;
      let assistantMsg: CopilotMessageItem;

      if (!document || !document.chunks || document.chunks.length === 0) {
        assistantMsg = {
          id: `asst-${counterRef.current}`,
          sender: "assistant",
          text: "No active document content is loaded. Please upload a document to enable grounded Copilot answers.",
          isNotFound: true,
          timestamp: "Just now",
        };
      } else {
        // Deterministic keyword retrieval across document chunks
        const queryTerms = userText
          .toLowerCase()
          .split(/\s+/)
          .filter((t) => t.length > 2 && !["what", "when", "where", "how", "the", "are", "and", "for"].includes(t));

        let bestChunk = null;
        let highestScore = 0;

        for (const chunk of document.chunks) {
          const contentLower = chunk.text.toLowerCase();
          let score = 0;
          for (const term of queryTerms) {
            if (contentLower.includes(term)) {
              score += 1;
            }
          }
          if (score > highestScore) {
            highestScore = score;
            bestChunk = chunk;
          }
        }

        if (bestChunk && highestScore > 0) {
          const sectionTitle = bestChunk.sectionTitle || "Document Excerpt";
          const pageNumber = bestChunk.pageNumbers?.[0] ?? 1;

          assistantMsg = {
            id: `asst-${counterRef.current}`,
            sender: "assistant",
            text: `Based on ${sectionTitle} in ${document.displayName}: "${bestChunk.text.slice(0, 300)}..."`,
            sourceSection: sectionTitle,
            pageNumber,
            evidenceExcerpt: bestChunk.text.slice(0, 300),
            documentTitle: document.displayName,
            suggestedNextStep: "Review the referenced section in the document viewer for full contractual context.",
            timestamp: "Just now",
          };
        } else {
          assistantMsg = {
            id: `asst-${counterRef.current}`,
            sender: "assistant",
            text: `Not found in the uploaded document (${document.displayName}). LexiGuide AI only answers based on terms actually identified in your active contract.`,
            documentTitle: document.displayName,
            suggestedNextStep: "Try phrasing your inquiry using specific terms that appear in the document clauses.",
            isNotFound: true,
            timestamp: "Just now",
          };
        }
      }

      setMessages((prev) => [...prev, assistantMsg]);
      setIsTyping(false);
    }, 450);
  };

  const handleReset = () => {
    setMessages([initialMessage]);
  };

  if (isCollapsed) {
    return (
      <div
        className={cn(
          "w-12 shrink-0 border-l border-[var(--border)] bg-[var(--surface-subtle)] flex flex-col items-center py-4 gap-4 transition-all",
          className
        )}
      >
        <IconButton
          size="sm"
          variant="ghost"
          onClick={onToggleCollapse}
          aria-label="Open Document Copilot"
          title="Open Document Copilot"
          className="text-[var(--foreground-secondary)] hover:text-[var(--primary)]"
        >
          <PanelRightOpen className="h-4 w-4" />
        </IconButton>

        <div className="flex-1 flex flex-col items-center justify-start pt-4 gap-6">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-brand-blue)]/10 text-[var(--primary)]"
            title="Document Copilot"
          >
            <Sparkles className="h-4 w-4" />
          </div>

          <div className="[writing-mode:vertical-rl] rotate-180 text-[11px] font-medium text-[var(--foreground-muted)] tracking-wider">
            Document Copilot
          </div>
        </div>
      </div>
    );
  }

  return (
    <aside
      aria-label="Document AI Copilot Assistant"
      className={cn(
        "w-full lg:w-[360px] shrink-0 border-l border-[var(--border)] bg-[var(--surface-subtle)] flex flex-col h-full transition-all overflow-hidden",
        className
      )}
    >
      {/* Copilot Header */}
      <div className="p-3 sm:p-3.5 px-4 border-b border-[var(--border)] bg-[var(--surface)] shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-brand-blue)]/10 text-[var(--primary)] border border-[var(--primary)]/20 shrink-0">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
            </div>

            <div className="text-left min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="text-xs font-semibold text-[var(--foreground)] truncate">
                  Document Copilot
                </h3>
                <Badge variant="brand" size="sm">
                  Grounded
                </Badge>
              </div>
              <p className="text-[10px] text-[var(--foreground-muted)] truncate">
                {docName ? `Active: ${docName}` : "Ask questions about your document"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <IconButton
              size="sm"
              variant="ghost"
              onClick={handleReset}
              aria-label="Reset conversation"
              title="Reset conversation"
              className="text-[var(--foreground-muted)] hover:text-[var(--foreground)] h-7 w-7"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </IconButton>

            <IconButton
              size="sm"
              variant="ghost"
              onClick={onToggleCollapse}
              aria-label="Collapse Document Copilot"
              title="Collapse Document Copilot"
              className="text-[var(--foreground-muted)] hover:text-[var(--foreground)] h-7 w-7"
            >
              <PanelRightClose className="h-4 w-4" />
            </IconButton>
          </div>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-y-auto p-3.5 sm:p-4 space-y-3.5 focus:outline-none"
      >
        {messages.map((msg) => (
          <CopilotMessage
            key={msg.id}
            message={msg}
            onViewEvidence={onViewEvidence}
          />
        ))}

        {isTyping && (
          <div className="flex items-center gap-2 text-xs text-[var(--foreground-muted)] pl-2">
            <Sparkles className="h-3 w-3 animate-spin text-[var(--primary)]" />
            <span>Consulting contract text…</span>
          </div>
        )}

        {/* Suggested Questions Section */}
        {messages.length <= 2 && !isTyping && (
          <div className="pt-2 space-y-2 text-left">
            <span className="text-[11px] font-semibold text-[var(--foreground-muted)] uppercase tracking-wider block">
              Suggested Inquiries
            </span>
            <div className="flex flex-col gap-1.5">
              {DEFAULT_SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => handleSend(suggestion)}
                  className="w-full text-left p-2.5 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--primary)]/60 hover:bg-[var(--surface-raised)] text-xs text-[var(--foreground-secondary)] transition-all cursor-pointer min-h-[44px] flex items-center"
                >
                  &ldquo;{suggestion}&rdquo;
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Input Area at Bottom */}
      <CopilotInput onSendMessage={handleSend} disabled={isTyping} />
    </aside>
  );
}
