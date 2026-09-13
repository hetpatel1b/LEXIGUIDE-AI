"use client";

import * as React from "react";
import { AlertTriangle, ExternalLink, ShieldAlert, Info } from "lucide-react";
import { Card } from "@/components/ui/card";
import { RiskIndicator } from "@/components/shared/risk-indicator";
import { POTENTIAL_CONCERNS, type EvidenceDetail } from "../../fixtures/analysis-fixture";

export interface ConcernsTabProps {
  onViewEvidence: (evidence: EvidenceDetail) => void;
}

export function ConcernsTab({ onViewEvidence }: ConcernsTabProps) {
  return (
    <div className="space-y-6 text-left max-w-4xl mx-auto">
      {/* Header & Subtitle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[var(--border)]">
        <div>
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            Potential Areas Requiring Review
          </h2>
          <p className="text-xs text-[var(--foreground-muted)]">
            Objective, balanced highlights of provisions that may warrant legal clarification
          </p>
        </div>

        <div className="flex items-center gap-2">
          <RiskIndicator severity="high" size="sm" label="1 High Attention" />
          <RiskIndicator severity="medium" size="sm" label="3 Review" />
          <RiskIndicator severity="low" size="sm" label="1 Info" />
        </div>
      </div>

      {/* Statutory Informational Banner */}
      <div className="rounded-[var(--radius-lg)] border border-amber-200/80 bg-amber-50/70 p-3.5 flex items-start gap-2.5 text-xs text-amber-950">
        <Info className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
        <div className="leading-relaxed">
          <span className="font-semibold mr-1">Balanced Informational Review:</span>
          AI-generated document analysis is for general informational purposes and does not replace advice from a qualified legal professional. Items flagged below represent common contractual risk areas worth discussing rather than definitive determinations of invalidity.
        </div>
      </div>

      {/* Concerns Cards List */}
      <div className="space-y-4">
        {POTENTIAL_CONCERNS.map((concern) => (
          <Card
            key={concern.id}
            density="spacious"
            className="bg-[var(--surface)] hover:border-[var(--border-strong)] transition-all space-y-3"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-[var(--surface-muted)] text-[var(--foreground)]">
                  {concern.clauseReference}
                </span>
                <h3 className="text-sm font-semibold text-[var(--foreground)]">
                  {concern.title}
                </h3>
              </div>

              <RiskIndicator severity={concern.severity} size="md" />
            </div>

            <div className="space-y-1.5 text-xs">
              <div>
                <span className="font-medium text-[var(--foreground)]">Context &amp; Analysis: </span>
                <span className="text-[var(--foreground-secondary)] leading-relaxed">
                  {concern.description}
                </span>
              </div>

              <div className="p-2.5 rounded-[var(--radius-md)] bg-[var(--surface-subtle)] border border-[var(--border-muted)]">
                <span className="font-medium text-[var(--primary)] mr-1">Recommended Point to Discuss:</span>
                <span className="text-[var(--foreground-secondary)] leading-relaxed">
                  {concern.recommendation}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[var(--border-muted)] text-xs text-[var(--foreground-muted)]">
              <span className="font-mono text-[11px]">
                {concern.clauseReference} · Page {concern.pageNumber}
              </span>

              <button
                type="button"
                onClick={() =>
                  onViewEvidence({
                    id: concern.id,
                    documentTitle: "Employment_Agreement_2026.pdf",
                    sectionReference: concern.clauseReference || "Clause",
                    pageNumber: concern.pageNumber || 1,
                    excerpt: concern.evidenceSnippet || "",
                  })
                }
                className="inline-flex items-center gap-1 text-[var(--primary)] hover:underline font-medium text-xs cursor-pointer"
              >
                <span>View Exact Clause Text</span>
                <ExternalLink className="h-3 w-3" />
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
