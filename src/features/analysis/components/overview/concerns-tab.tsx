"use client";

import * as React from "react";
import { ExternalLink, Info } from "lucide-react";
import { Card } from "@/components/ui/card";
import { RiskIndicator } from "@/components/shared/risk-indicator";
import { POTENTIAL_CONCERNS, type EvidenceDetail } from "../../fixtures/analysis-fixture";
import type { AnalysisResult } from "@/lib/ai/types";

export interface ConcernsTabProps {
  analysisResult?: AnalysisResult | null;
  onViewEvidence: (evidence: EvidenceDetail) => void;
}

export function ConcernsTab({ analysisResult, onViewEvidence }: ConcernsTabProps) {
  const concerns = React.useMemo(() => {
    if (!analysisResult) return POTENTIAL_CONCERNS;
    return analysisResult.potentialConcerns.map((c) => ({
      id: c.id,
      title: c.title,
      severity: c.severity,
      description: c.explanation,
      recommendation: `${c.whyItMatters} Question for counsel: ${c.suggestedReviewQuestion}`,
      clauseReference: c.source.sectionTitle || c.source.sectionId || "Section",
      pageNumber: c.source.pageNumber || 1,
      evidenceSnippet: c.source.quote,
      verified: c.verified,
    }));
  }, [analysisResult]);

  const highCount = concerns.filter((c) => c.severity === "high").length;
  const mediumCount = concerns.filter((c) => c.severity === "medium").length;
  const lowCount = concerns.filter((c) => c.severity === "low").length;

  return (
    <div className="space-y-6 text-left w-full">
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

        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {highCount > 0 && <RiskIndicator severity="high" size="sm" label={`${highCount} High Attention`} />}
          {mediumCount > 0 && <RiskIndicator severity="medium" size="sm" label={`${mediumCount} Review`} />}
          {lowCount > 0 && <RiskIndicator severity="low" size="sm" label={`${lowCount} Info`} />}
          {concerns.length === 0 && (
            <span className="text-xs text-[var(--foreground-muted)]">No flagged concerns</span>
          )}
        </div>
      </div>

      {/* Statutory Informational Banner */}
      <div className="rounded-[var(--radius-lg)] border border-amber-200/80 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/20 p-3.5 flex items-start gap-2.5 text-xs text-amber-950 dark:text-amber-200">
        <Info className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
        <div className="leading-relaxed">
          <span className="font-semibold mr-1">Balanced Informational Review:</span>
          AI-generated document analysis is for general informational purposes and does not replace advice from a qualified legal professional. Items flagged below represent common contractual provisions worth discussing rather than definitive determinations of unenforceability.
        </div>
      </div>

      {/* Concerns Cards List */}
      <div className="space-y-3 sm:space-y-3.5">
        {concerns.length === 0 ? (
          <div className="p-8 text-center rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground-muted)] text-xs">
            No specific high-severity review concerns were detected in this document.
          </div>
        ) : (
          concerns.map((concern) => (
            <Card
              key={concern.id}
              density="compact"
              className="p-4 sm:p-4.5 bg-[var(--surface)] hover:border-[var(--border-strong)] transition-all space-y-2.5"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-[var(--surface-muted)] text-[var(--foreground)] shrink-0">
                    {concern.clauseReference}
                  </span>
                  <h3 className="text-sm font-semibold text-[var(--foreground)]">
                    {concern.title}
                  </h3>
                </div>

                <RiskIndicator severity={concern.severity} size="sm" />
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

              <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-1.5 pt-2 border-t border-[var(--border-muted)] text-xs text-[var(--foreground-muted)]">
                <span className="font-mono text-[11px]">
                  {concern.clauseReference} · Page {concern.pageNumber} · {concern.verified ? "✓ Verified citation" : "Citation attached"}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    onViewEvidence({
                      id: concern.id,
                      documentTitle: analysisResult?.documentName || "Employment_Agreement_2026.pdf",
                      sectionReference: concern.clauseReference || "Clause",
                      pageNumber: concern.pageNumber || 1,
                      excerpt: concern.evidenceSnippet || "",
                      contextNote: concern.verified ? "✓ Verified against source text" : "Unverified citation",
                    })
                  }
                  className="inline-flex items-center gap-1.5 text-[var(--primary)] hover:underline font-medium text-xs cursor-pointer py-1 px-1.5 -mr-1.5 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] self-start xs:self-auto"
                >
                  <span>View Exact Clause Text</span>
                  <ExternalLink className="h-3 w-3" aria-hidden="true" />
                </button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
