"use client";

import * as React from "react";
import {
  FileText,
  Users,
  Calendar,
  Scale,
  AlertTriangle,
  CheckSquare,
  ArrowRight,
  Info,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RiskIndicator } from "@/components/shared/risk-indicator";
import {
  METADATA_SUMMARY_CARDS,
  EXECUTIVE_SUMMARY,
  KEY_CLAUSES,
  POTENTIAL_CONCERNS,
  IMPORTANT_OBLIGATIONS,
  IMPORTANT_DATES,
  type EvidenceDetail,
} from "../../fixtures/analysis-fixture";
import type { AnalysisTabId } from "../analysis-tabs";

export interface OverviewTabProps {
  onNavigateTab: (tabId: AnalysisTabId) => void;
  onViewEvidence: (evidence: EvidenceDetail) => void;
}

const ICON_MAP = {
  FileText,
  Users,
  Calendar,
  Scale,
  AlertTriangle,
  CheckSquare,
};

export function OverviewTab({ onNavigateTab, onViewEvidence }: OverviewTabProps) {
  return (
    <div className="space-y-8 text-left max-w-5xl mx-auto">
      {/* 1. Metric Summary Cards (6 Cards) */}
      <section aria-labelledby="overview-metrics-heading">
        <h2 id="overview-metrics-heading" className="sr-only">
          Document Intelligence Metrics
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 2xl:grid-cols-6 gap-3">
          {METADATA_SUMMARY_CARDS.map((metric) => {
            const Icon = ICON_MAP[metric.iconName as keyof typeof ICON_MAP] || FileText;
            return (
              <Card
                key={metric.id}
                density="compact"
                className="flex flex-col justify-between p-3.5 bg-[var(--surface)] hover:border-[var(--border-strong)] transition-all shadow-[var(--shadow-subtle)]"
              >
                <div className="flex items-center justify-between gap-1 mb-2">
                  <span className="text-[11px] font-medium text-[var(--foreground-muted)] truncate">
                    {metric.label}
                  </span>
                  <div className="p-1 rounded bg-[var(--surface-muted)] text-[var(--primary)] shrink-0">
                    <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                  </div>
                </div>

                <div>
                  <div className="text-sm font-semibold text-[var(--foreground)] tracking-tight">
                    {metric.value}
                  </div>
                  <p className="text-[10px] text-[var(--foreground-muted)] truncate mt-0.5" title={metric.secondary}>
                    {metric.secondary}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* 2. Executive Summary Block */}
      <section aria-labelledby="exec-summary-heading">
        <Card density="spacious" className="bg-[var(--surface)] border-[var(--border)] relative overflow-hidden">
          {/* Subtle top accent bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--color-brand-blue)] via-[var(--color-accent-cyan)] to-indigo-600" />

          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-[var(--color-brand-blue)]/10 text-[var(--primary)]">
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                </div>
                <div>
                  <h2 id="exec-summary-heading" className="text-base font-semibold text-[var(--foreground)]">
                    Executive Summary
                  </h2>
                  <p className="text-xs text-[var(--foreground-muted)]">
                    AI-distilled plain-language breakdown of key contract terms
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="neutral" size="sm" dot>
                  Illustrative analysis · Development preview
                </Badge>
              </div>
            </div>

            <p className="text-sm text-[var(--foreground-secondary)] leading-relaxed">
              {EXECUTIVE_SUMMARY.overview}
            </p>

            <div className="pt-2 border-t border-[var(--border-muted)]">
              <h3 className="text-xs font-semibold text-[var(--foreground)] uppercase tracking-wider mb-2.5">
                Plain-Language Takeaways
              </h3>
              <ul className="space-y-2">
                {EXECUTIVE_SUMMARY.bulletPoints.map((point, index) => (
                  <li key={index} className="flex items-start gap-2.5 text-xs text-[var(--foreground-secondary)]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--primary)] mt-1.5 shrink-0" aria-hidden="true" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex items-center justify-end pt-2">
              <Button
                variant="link"
                size="sm"
                rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
                onClick={() => onNavigateTab("summary")}
                className="text-xs text-[var(--primary)] font-medium p-0"
              >
                Read Complete Summary &amp; Context
              </Button>
            </div>
          </div>
        </Card>
      </section>

      {/* 3. Two-Column Grid: Potential Concerns & Key Clauses Previews */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Potential Concerns Preview */}
        <section aria-labelledby="concerns-preview-heading">
          <Card density="spacious" className="h-full flex flex-col justify-between bg-[var(--surface)]">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[var(--border-muted)]">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600" aria-hidden="true" />
                  <h2 id="concerns-preview-heading" className="text-sm font-semibold text-[var(--foreground)]">
                    Potential Concerns
                  </h2>
                </div>
                <Badge variant="warning" size="sm">
                  5 Flagged
                </Badge>
              </div>

              <p className="text-xs text-[var(--foreground-muted)]">
                Areas flagged for closer review. Non-assertive informational guidance.
              </p>

              <div className="space-y-3">
                {POTENTIAL_CONCERNS.slice(0, 3).map((concern) => (
                  <div
                    key={concern.id}
                    className="p-3 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-subtle)] space-y-2 hover:border-[var(--border-strong)] transition-all"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs font-semibold text-[var(--foreground)] truncate">
                        {concern.title}
                      </h4>
                      <RiskIndicator severity={concern.severity} size="sm" />
                    </div>

                    <p className="text-xs text-[var(--foreground-secondary)] line-clamp-2">
                      {concern.description}
                    </p>

                    <div className="flex items-center justify-between pt-1 text-[11px] text-[var(--foreground-muted)]">
                      <span className="font-mono">
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
                        className="inline-flex items-center gap-1 text-[var(--primary)] hover:underline font-medium cursor-pointer"
                      >
                        <span>View Evidence</span>
                        <ExternalLink className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 mt-2 border-t border-[var(--border-muted)] flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
                onClick={() => onNavigateTab("concerns")}
                className="text-xs"
              >
                View All 5 Concerns
              </Button>
            </div>
          </Card>
        </section>

        {/* Right: Key Clauses Preview */}
        <section aria-labelledby="clauses-preview-heading">
          <Card density="spacious" className="h-full flex flex-col justify-between bg-[var(--surface)]">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[var(--border-muted)]">
                <div className="flex items-center gap-2">
                  <Scale className="h-4 w-4 text-[var(--primary)]" aria-hidden="true" />
                  <h2 id="clauses-preview-heading" className="text-sm font-semibold text-[var(--foreground)]">
                    Key Clauses
                  </h2>
                </div>
                <Badge variant="neutral" size="sm">
                  12 Identified
                </Badge>
              </div>

              <p className="text-xs text-[var(--foreground-muted)]">
                Core provisions identified across compensation, intellectual property, and separation.
              </p>

              <div className="space-y-3">
                {KEY_CLAUSES.slice(0, 3).map((clause) => (
                  <div
                    key={clause.id}
                    className="p-3 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-subtle)] space-y-2 hover:border-[var(--border-strong)] transition-all"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs font-semibold text-[var(--foreground)] truncate">
                        {clause.title}
                      </h4>
                      <Badge variant="brand" size="sm">
                        {clause.sectionReference}
                      </Badge>
                    </div>

                    <p className="text-xs text-[var(--foreground-secondary)] line-clamp-2">
                      {clause.summary}
                    </p>

                    <div className="flex items-center justify-between pt-1 text-[11px] text-[var(--foreground-muted)]">
                      <span className="font-mono">
                        Page {clause.pageNumber} · {clause.category}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          onViewEvidence({
                            id: clause.id,
                            documentTitle: "Employment_Agreement_2026.pdf",
                            sectionReference: clause.sectionReference || "Clause",
                            pageNumber: clause.pageNumber || 1,
                            excerpt: clause.evidenceSnippet || "",
                          })
                        }
                        className="inline-flex items-center gap-1 text-[var(--primary)] hover:underline font-medium cursor-pointer"
                      >
                        <span>View Evidence</span>
                        <ExternalLink className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 mt-2 border-t border-[var(--border-muted)] flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
                onClick={() => onNavigateTab("clauses")}
                className="text-xs"
              >
                View All Key Clauses
              </Button>
            </div>
          </Card>
        </section>
      </div>

      {/* 4. Two-Column Grid: Obligations & Important Dates Previews */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Obligations Snapshot */}
        <section aria-labelledby="obligations-preview-heading">
          <Card density="spacious" className="h-full flex flex-col justify-between bg-[var(--surface)]">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[var(--border-muted)]">
                <div className="flex items-center gap-2">
                  <CheckSquare className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                  <h2 id="obligations-preview-heading" className="text-sm font-semibold text-[var(--foreground)]">
                    Important Obligations
                  </h2>
                </div>
                <Badge variant="neutral" size="sm">
                  8 Identified
                </Badge>
              </div>

              <div className="space-y-2.5">
                {IMPORTANT_OBLIGATIONS.slice(0, 3).map((ob) => (
                  <div
                    key={ob.id}
                    className="p-2.5 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-subtle)] space-y-1"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-[var(--foreground)] truncate max-w-[200px]">
                        {ob.party}
                      </span>
                      <span className="font-mono text-[10px] text-[var(--foreground-muted)]">
                        {ob.clauseReference}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--foreground-secondary)] line-clamp-1">
                      {ob.duty}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 mt-2 border-t border-[var(--border-muted)] flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
                onClick={() => onNavigateTab("obligations")}
                className="text-xs"
              >
                View Full Obligations Matrix
              </Button>
            </div>
          </Card>
        </section>

        {/* Important Dates Snapshot */}
        <section aria-labelledby="dates-preview-heading">
          <Card density="spacious" className="h-full flex flex-col justify-between bg-[var(--surface)]">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[var(--border-muted)]">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-[var(--primary)]" aria-hidden="true" />
                  <h2 id="dates-preview-heading" className="text-sm font-semibold text-[var(--foreground)]">
                    Important Dates &amp; Milestones
                  </h2>
                </div>
                <Badge variant="neutral" size="sm">
                  4 Identified
                </Badge>
              </div>

              <div className="space-y-2.5">
                {IMPORTANT_DATES.map((dt) => (
                  <div
                    key={dt.id}
                    className="flex items-center justify-between p-2.5 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-subtle)] gap-2"
                  >
                    <div className="min-w-0">
                      <h4 className="text-xs font-semibold text-[var(--foreground)] truncate">
                        {dt.event}
                      </h4>
                      <p className="text-[11px] text-[var(--foreground-muted)] font-mono">
                        {dt.sourceSection} · Page {dt.pageNumber}
                      </p>
                    </div>

                    <Badge variant="brand" size="sm" className="font-mono shrink-0">
                      {dt.dateOrDuration}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 mt-2 border-t border-[var(--border-muted)] flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
                onClick={() => onNavigateTab("dates")}
                className="text-xs"
              >
                View All Key Dates
              </Button>
            </div>
          </Card>
        </section>
      </div>

      {/* Safety Notice Footer Banner */}
      <div className="rounded-[var(--radius-lg)] border border-blue-200/70 bg-blue-50/50 p-3.5 flex items-start gap-2.5 text-xs text-blue-900">
        <Info className="h-4 w-4 shrink-0 mt-0.5 text-[var(--primary)]" aria-hidden="true" />
        <div>
          <p className="font-semibold mb-0.5">Informational Document Intelligence</p>
          <p className="text-[11px] text-[var(--foreground-secondary)] leading-relaxed">
            LexiGuide AI highlights key clauses, obligations, and potential areas of concern for informational convenience. It does not provide formal legal advice or substitute for consultation with a licensed advocate.
          </p>
        </div>
      </div>
    </div>
  );
}
