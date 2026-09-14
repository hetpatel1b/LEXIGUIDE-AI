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
  thinkingMessage?: string;
  onViewEvidence: (msg: QuestionMessage) => void;
  onAddToActionCenter?: (msg: QuestionMessage) => void;
}

export function QAConversation({
  messages,
  isThinking = false,
  thinkingMessage,
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
            <div className="flex justify-end pl-2 sm:pl-16">
              <div className="rounded-2xl rounded-tr-sm bg-[var(--primary)] text-white px-3.5 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm max-w-[90%] sm:max-w-[85%] shadow-sm">
                <p className="leading-relaxed font-medium">{msg.question}</p>
                <span className="text-[10px] text-white/70 block text-right mt-1 font-mono">
                  {msg.askedAt}
                </span>
              </div>
            </div>

            {/* Assistant Response Card */}
            {msg.answer && (
              <div className="flex items-start gap-2.5 sm:gap-3 pr-0 sm:pr-10">
                <div className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-xl bg-[var(--color-brand-blue)]/10 text-[var(--primary)] border border-[var(--primary)]/20 mt-0.5">
                  <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden="true" />
                </div>

                <Card
                  density="spacious"
                  className="flex-1 min-w-0 bg-[var(--surface)] border-[var(--border)] p-3.5 sm:p-5 space-y-3.5 shadow-2xs"
                >
                  {/* Direct Answer Header */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      {msg.isError || msg.answerStatus === "error" ? (
                        <Badge variant="danger" size="sm" dot>
                          Request Error
                        </Badge>
                      ) : msg.answerStatus === "clarification" ? (
                        <Badge variant="neutral" size="sm" dot>
                          Clarification
                        </Badge>
                      ) : msg.isNotFound || msg.answerStatus === "not_found" ? (
                        <Badge variant="warning" size="sm" dot>
                          Not Found in Uploaded Document
                        </Badge>
                      ) : msg.answerStatus === "partially_supported" ? (
                        <Badge variant="neutral" size="sm" dot>
                          Partially Supported by Document
                        </Badge>
                      ) : (
                        <Badge variant="brand" size="sm" dot>
                          Document-Grounded Answer
                        </Badge>
                      )}
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

                  {/* Key Points If Present */}
                  {msg.keyPoints && msg.keyPoints.length > 0 && (
                    <div className="pt-2 border-t border-[var(--border-muted)] space-y-1.5">
                      <span className="text-[11px] font-semibold text-[var(--foreground-secondary)] uppercase tracking-wider block">
                        {msg.answerStatus === "clarification" ? "Suggested Inquiries:" : "Key Points:"}
                      </span>
                      <ul className="space-y-1">
                        {msg.keyPoints.map((kp, idx) => (
                          <li key={idx} className="text-xs text-[var(--foreground)] leading-relaxed flex items-start gap-1.5">
                            <span className="text-[var(--primary)] font-bold shrink-0">&bull;</span>
                            <span>{kp.text}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Error Notification */}
                  {(msg.isError || msg.answerStatus === "error") && (
                    <div className="p-3 rounded-[var(--radius-md)] border border-red-200/80 bg-red-50/70 dark:border-red-900/60 dark:bg-red-950/20 text-xs text-red-900 dark:text-red-200 flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
                      <div className="leading-relaxed">
                        <span className="font-semibold mr-1">System Notice:</span>
                        The request could not be completed. Please check your connection or retry in a moment.
                      </div>
                    </div>
                  )}

                  {/* Clarification Guidance */}
                  {msg.answerStatus === "clarification" && (
                    <div className="p-3 rounded-[var(--radius-md)] border border-blue-200/80 bg-blue-50/70 dark:border-blue-900/60 dark:bg-blue-950/20 text-xs text-blue-900 dark:text-blue-200 flex items-start gap-2">
                      <Sparkles className="h-4 w-4 shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
                      <div className="leading-relaxed">
                        <span className="font-semibold mr-1">Specific Questions Recommended:</span>
                        LexiGuide AI works best when asking about specific topics such as base salary, notice periods, arbitration seat, or specific numbered clauses.
                      </div>
                    </div>
                  )}

                  {/* Not Found in Document Notification */}
                  {(msg.isNotFound || msg.answerStatus === "not_found") &&
                    !msg.isError &&
                    msg.answerStatus !== "error" &&
                    msg.answerStatus !== "clarification" && (
                      <div className="p-3 rounded-[var(--radius-md)] border border-amber-200/80 bg-amber-50/70 dark:border-amber-900/60 dark:bg-amber-950/20 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
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
                      <div className="flex items-center justify-between gap-2 text-xs flex-wrap">
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
                          {isExpanded ? "Hide Excerpt" : "Show Excerpt"}
                        </button>
                      </div>

                      {isExpanded && firstCitation.excerpt && (
                        <div className="p-3 rounded-[var(--radius-md)] bg-[var(--surface-sunken)] border border-[var(--border-muted)] font-mono text-xs text-[var(--foreground)] leading-relaxed italic">
                          &ldquo;{firstCitation.excerpt}&rdquo;
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actionable Next Step Suggestion */}
                  {msg.suggestedNextStep && (
                    <div className="p-3 rounded-[var(--radius-md)] bg-[var(--surface-sunken)] border border-[var(--border-muted)] text-xs text-[var(--foreground-muted)] leading-relaxed">
                      <span className="font-semibold text-[var(--foreground)] mr-1">
                        Suggested Next Step:
                      </span>
                      <span>{msg.suggestedNextStep}</span>
                    </div>
                  )}

                  {/* Action Bar */}
                  <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2.5 pt-2 border-t border-[var(--border-muted)] text-xs">
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

                    {!msg.isError &&
                      msg.answerStatus !== "error" &&
                      msg.answerStatus !== "clarification" && (
                        <div className="flex items-center gap-2">
                          <Button
                            variant={isAdded ? "secondary" : "ghost"}
                            size="sm"
                            onClick={() => handleAddToAction(msg)}
                            leftIcon={<CheckSquare className="h-3 w-3" />}
                            className="text-xs w-full xs:w-auto"
                          >
                            {isAdded ? "Added to Actions!" : "Add to Action Center"}
                          </Button>
                        </div>
                      )}
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
          <span>{thinkingMessage || "Retrieving grounded contract text & cross-referencing sections…"}</span>
        </div>
      )}
    </div>
  );
}
