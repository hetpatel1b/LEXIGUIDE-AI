"use client";

import * as React from "react";
import Link from "next/link";
import {
  Sparkles,
  BookOpen,
  ExternalLink,
  CheckSquare,
  AlertCircle,
  Copy,
  Check,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { QuestionMessage } from "@/types";

export interface QAConversationProps {
  messages: QuestionMessage[];
  isThinking?: boolean;
  onViewEvidence: (msg: QuestionMessage) => void;
  onAddToActionCenter?: (msg: QuestionMessage) => void;
}

export function QAConversation({
  messages,
  isThinking = false,
  onViewEvidence,
  onAddToActionCenter,
}: QAConversationProps) {
  const [expandedExcerpts, setExpandedExcerpts] = React.useState<Record<string, boolean>>({});
  const [addedMap, setAddedMap] = React.useState<Record<string, boolean>>({});

  const toggleExcerpt = (id: string) => {
    setExpandedExcerpts((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAddToAction = (msg: QuestionMessage) => {
    onAddToActionCenter?.(msg);
    setAddedMap((prev) => ({ ...prev, [msg.id]: true }));
    setTimeout(() => {
      setAddedMap((prev) => ({ ...prev, [msg.id]: false }));
    }, 3000);
  };

  return (
    <div className="space-y-6 text-left">
      {messages.map((msg) => {
        const isExpanded = !!expandedExcerpts[msg.id];
        const isAdded = !!addedMap[msg.id];
        const firstCitation = msg.evidence?.[0];

        return (
          <div key={msg.id} className="space-y-4">
            {/* User Message Bubble */}
            <div className="flex justify-end pl-6 sm:pl-16">
              <div className="rounded-2xl rounded-tr-sm bg-[var(--primary)] text-white px-4 py-3 text-xs sm:text-sm max-w-[85%] shadow-sm">
                <p className="leading-relaxed font-medium">{msg.question}</p>
                <span className="text-[10px] text-white/70 block text-right mt-1 font-mono">
                  {msg.askedAt}
                </span>
              </div>
            </div>

            {/* Assistant Response Card */}
            {msg.answer && (
              <div className="flex items-start gap-3 pr-2 sm:pr-10">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[var(--color-brand-blue)]/10 text-[var(--primary)] border border-[var(--primary)]/20 mt-0.5">
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                </div>

                <Card
                  density="spacious"
                  className="flex-1 bg-[var(--surface)] border-[var(--border)] p-4 sm:p-5 space-y-3.5 shadow-2xs"
                >
                  {/* Direct Answer Header */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="brand" size="sm" dot>
                        Document-Grounded Answer
                      </Badge>
                      {msg.answeredAt && (
                        <span className="text-[10px] text-[var(--foreground-muted)] font-mono">
                          {msg.answeredAt}
                        </span>
                      )}
                    </div>

                    <p className="text-xs sm:text-sm text-[var(--foreground)] leading-relaxed font-medium">
                      {msg.answer}
                    </p>
                  </div>

                  {/* Not Found in Document Notification */}
                  {msg.isNotFound && (
                    <div className="p-3 rounded-[var(--radius-md)] border border-amber-200/80 bg-amber-50/70 dark:border-amber-900/40 dark:bg-amber-950/20 text-xs text-amber-900 dark:text-amber-300 flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                      <div className="leading-relaxed">
                        <span className="font-semibold mr-1">Not Found in Uploaded Document:</span>
                        LexiGuide AI only reports terms actually identified in this contract and does not fabricate missing clauses.
                      </div>
                    </div>
                  )}

                  {/* Source Citation & Verbatim Evidence */}
                  {firstCitation && (
                    <div className="pt-2 border-t border-[var(--border-muted)] space-y-2">
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-1.5 font-mono text-[11px] text-[var(--primary)] font-medium">
                          <BookOpen className="h-3.5 w-3.5 shrink-0" />
                          <span>
                            {firstCitation.sectionTitle || "Source"} · Page {firstCitation.pageNumber}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => toggleExcerpt(msg.id)}
                          className="text-[11px] text-[var(--foreground-muted)] hover:text-[var(--primary)] font-medium cursor-pointer"
                        >
                          {isExpanded ? "Hide Verbatim Excerpt" : "Show Verbatim Excerpt"}
                        </button>
                      </div>

                      {isExpanded && (
                        <div className="p-3 rounded-[var(--radius-md)] bg-[var(--surface-subtle)] border border-[var(--border)] space-y-2 text-xs">
                          <p className="italic text-[var(--foreground-secondary)] leading-relaxed font-serif pl-2 border-l-2 border-[var(--primary)]">
                            &ldquo;{firstCitation.excerpt}&rdquo;
                          </p>

                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={() => onViewEvidence(msg)}
                              className="inline-flex items-center gap-1 text-[var(--primary)] hover:underline font-medium text-xs cursor-pointer"
                            >
                              <span>Inspect in Evidence Modal</span>
                              <ExternalLink className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Suggested Next Step */}
                  {msg.suggestedNextStep && (
                    <div className="p-2.5 rounded-[var(--radius-md)] bg-[var(--surface-muted)] border border-[var(--border-muted)] text-xs text-[var(--foreground-secondary)]">
                      <span className="font-semibold text-[var(--foreground)] mr-1">
                        Suggested Next Step:
                      </span>
                      <span>{msg.suggestedNextStep}</span>
                    </div>
                  )}

                  {/* Action Bar */}
                  <div className="flex items-center justify-between pt-2 border-t border-[var(--border-muted)] text-xs">
                    {firstCitation ? (
                      <button
                        type="button"
                        onClick={() => onViewEvidence(msg)}
                        className="inline-flex items-center gap-1 text-[var(--primary)] hover:underline font-medium text-xs cursor-pointer"
                      >
                        <ExternalLink className="h-3 w-3" />
                        <span>View Evidence</span>
                      </button>
                    ) : (
                      <span />
                    )}

                    <div className="flex items-center gap-2">
                      <Button
                        variant={isAdded ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => handleAddToAction(msg)}
                        leftIcon={<CheckSquare className="h-3 w-3" />}
                        className="text-xs"
                      >
                        {isAdded ? "Added to Actions!" : "Add to Action Center"}
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </div>
        );
      })}

      {/* Thinking Indicator */}
      {isThinking && (
        <div className="flex items-center gap-3 pr-10 text-xs text-[var(--foreground-muted)]">
          <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-[var(--color-brand-blue)]/10 text-[var(--primary)] animate-pulse">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <span>Retrieving grounded contract text &amp; cross-referencing sections…</span>
        </div>
      )}
    </div>
  );
}
