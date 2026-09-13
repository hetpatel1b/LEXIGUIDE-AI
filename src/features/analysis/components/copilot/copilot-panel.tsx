"use client";

import * as React from "react";
import {
  Sparkles,
  PanelRightClose,
  PanelRightOpen,
  RotateCcw,
  HelpCircle,
} from "lucide-react";
import { IconButton } from "@/components/ui/icon-button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CopilotMessage, type CopilotMessageItem } from "./copilot-message";
import { CopilotInput } from "./copilot-input";
import {
  COPILOT_SUGGESTIONS,
  COPILOT_QA_PAIRS,
  COPILOT_NOT_FOUND_RESPONSE,
  type EvidenceDetail,
} from "../../fixtures/analysis-fixture";

export interface CopilotPanelProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onViewEvidence?: (evidence: EvidenceDetail) => void;
  className?: string;
}

const INITIAL_MESSAGES: CopilotMessageItem[] = [
  {
    id: "init-1",
    sender: "assistant",
    text: "Hello! I am your Document Copilot for Employment_Agreement_2026.pdf. You can ask me questions about termination notice periods, confidentiality obligations, IP ownership, compensation, or dispute jurisdiction.",
    timestamp: "10:00 AM",
  },
];

export function CopilotPanel({
  isCollapsed,
  onToggleCollapse,
  onViewEvidence,
  className,
}: CopilotPanelProps) {
  const [messages, setMessages] = React.useState<CopilotMessageItem[]>(INITIAL_MESSAGES);
  const [isTyping, setIsTyping] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const counterRef = React.useRef(100);

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

    // Simulate response resolution from fixtures
    setTimeout(() => {
      const lower = userText.toLowerCase();
      let matchedFixture = null;

      if (lower.includes("terminat") || lower.includes("fire") || lower.includes("end")) {
        matchedFixture = COPILOT_QA_PAIRS.termination;
      } else if (lower.includes("obligation") || lower.includes("duty") || lower.includes("responsibilit")) {
        matchedFixture = COPILOT_QA_PAIRS.obligations;
      } else if (lower.includes("review") || lower.includes("concern") || lower.includes("careful") || lower.includes("risk")) {
        matchedFixture = COPILOT_QA_PAIRS.review;
      } else if (lower.includes("resign") || lower.includes("leave") || lower.includes("quit")) {
        matchedFixture = COPILOT_QA_PAIRS.resign;
      } else if (lower.includes("confident") || lower.includes("secret") || lower.includes("nda")) {
        matchedFixture = COPILOT_QA_PAIRS.confidentiality;
      }

      counterRef.current += 1;
      let assistantMsg: CopilotMessageItem;

      if (matchedFixture) {
        assistantMsg = {
          id: `asst-${counterRef.current}`,
          sender: "assistant",
          text: matchedFixture.answer,
          sourceSection: matchedFixture.sectionReference,
          pageNumber: matchedFixture.pageNumber,
          evidenceExcerpt: matchedFixture.evidenceExcerpt,
          suggestedNextStep: matchedFixture.suggestedNextStep,
          timestamp: "Just now",
        };
      } else {
        assistantMsg = {
          id: `asst-${counterRef.current}`,
          sender: "assistant",
          text: COPILOT_NOT_FOUND_RESPONSE.answer,
          suggestedNextStep: COPILOT_NOT_FOUND_RESPONSE.suggestedNextStep,
          isNotFound: true,
          timestamp: "Just now",
        };
      }

      setMessages((prev) => [...prev, assistantMsg]);
      setIsTyping(false);
    }, 450);
  };

  const handleReset = () => {
    setMessages(INITIAL_MESSAGES);
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
        "w-[350px] lg:w-[360px] shrink-0 border-l border-[var(--border)] bg-[var(--surface-subtle)] flex flex-col h-full transition-all overflow-hidden",
        className
      )}
    >
      {/* Copilot Header */}
      <div className="p-3 sm:p-3.5 px-4 border-b border-[var(--border)] bg-[var(--surface)] shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-brand-blue)]/10 text-[var(--primary)] border border-[var(--primary)]/20">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
            </div>

            <div className="text-left">
              <div className="flex items-center gap-1.5">
                <h3 className="text-xs font-semibold text-[var(--foreground)]">
                  Document Copilot
                </h3>
                <Badge variant="brand" size="sm">
                  Grounded
                </Badge>
              </div>
              <p className="text-[10px] text-[var(--foreground-muted)]">
                Ask questions about this agreement
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
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
              {COPILOT_SUGGESTIONS.map((suggestion) => (
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
