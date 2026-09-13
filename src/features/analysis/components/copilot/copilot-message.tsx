"use client";

import * as React from "react";
import { Sparkles, User, BookOpen, ExternalLink, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { EvidenceDetail } from "../../fixtures/analysis-fixture";

export interface CopilotMessageItem {
  id: string;
  sender: "user" | "assistant";
  text: string;
  sourceSection?: string;
  pageNumber?: number;
  evidenceExcerpt?: string;
  suggestedNextStep?: string;
  isNotFound?: boolean;
  timestamp?: string;
}

export interface CopilotMessageProps {
  message: CopilotMessageItem;
  onViewEvidence?: (evidence: EvidenceDetail) => void;
}

export function CopilotMessage({ message, onViewEvidence }: CopilotMessageProps) {
  const [evidenceExpanded, setEvidenceExpanded] = React.useState(false);

  if (message.sender === "user") {
    return (
      <div className="flex justify-end text-left pl-6">
        <div className="rounded-2xl rounded-tr-sm bg-[var(--primary)] text-white px-3.5 py-2.5 text-xs max-w-[85%] shadow-sm space-y-1">
          <p className="leading-relaxed">{message.text}</p>
        </div>
      </div>
    );
  }

  // Assistant Response
  return (
    <div className="flex items-start gap-2.5 text-left pr-4">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--color-brand-blue)]/10 text-[var(--primary)] border border-[var(--primary)]/20 mt-0.5">
        <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
      </div>

      <div className="flex-1 space-y-2.5 min-w-0">
        <div className="rounded-2xl rounded-tl-sm bg-[var(--surface-muted)]/80 border border-[var(--border)] p-3.5 text-xs text-[var(--foreground)] space-y-2.5 shadow-sm">
          {/* Main Answer text */}
          <p className="text-xs text-[var(--foreground)] leading-relaxed">
            {message.text}
          </p>

          {/* Not Found State Alert */}
          {message.isNotFound && (
            <div className="p-2.5 rounded-[var(--radius-md)] border border-amber-200/80 bg-amber-50/70 text-[11px] text-amber-900 flex items-start gap-1.5">
              <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-amber-600" />
              <span>
                Not found in the uploaded document. LexiGuide AI only reports terms actually identified in this contract.
              </span>
            </div>
          )}

          {/* Grounded Citation & Expandable Evidence */}
          {message.sourceSection && (
            <div className="pt-2 border-t border-[var(--border-muted)] space-y-2">
              <div className="flex items-center justify-between gap-1 text-[11px]">
                <span className="font-mono font-medium text-[var(--primary)]">
                  {message.sourceSection} · Page {message.pageNumber}
                </span>

                {message.evidenceExcerpt && (
                  <button
                    type="button"
                    onClick={() => setEvidenceExpanded(!evidenceExpanded)}
                    className="text-[var(--foreground-muted)] hover:text-[var(--primary)] text-[10px] font-medium cursor-pointer"
                  >
                    {evidenceExpanded ? "Hide Excerpt" : "Show Excerpt"}
                  </button>
                )}
              </div>

              {evidenceExpanded && message.evidenceExcerpt && (
                <div className="p-2.5 rounded-[var(--radius-md)] bg-[var(--surface)] border border-[var(--border)] space-y-2 text-[11px]">
                  <p className="text-[var(--foreground-secondary)] italic leading-relaxed">
                    &ldquo;{message.evidenceExcerpt}&rdquo;
                  </p>

                  {onViewEvidence && (
                    <button
                      type="button"
                      onClick={() =>
                        onViewEvidence({
                          id: message.id,
                          documentTitle: "Employment_Agreement_2026.pdf",
                          sectionReference: message.sourceSection || "Clause",
                          pageNumber: message.pageNumber || 1,
                          excerpt: message.evidenceExcerpt || "",
                        })
                      }
                      className="inline-flex items-center gap-1 text-[var(--primary)] hover:underline font-medium text-[10px] cursor-pointer"
                    >
                      <span>Inspect in Evidence Dialog</span>
                      <ExternalLink className="h-3 w-3" />
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Suggested Next Step */}
          {message.suggestedNextStep && (
            <div className="pt-1.5 text-[11px] text-[var(--foreground-muted)]">
              <span className="font-medium text-[var(--foreground-secondary)] mr-1">
                Suggested Next Step:
              </span>
              <span>{message.suggestedNextStep}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
