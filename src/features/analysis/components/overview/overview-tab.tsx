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
import type { EvidenceDetail } from "@/types";
import type { AnalysisTabId } from "../analysis-tabs";

import type { AnalysisResult } from "@/lib/ai/types";

export interface OverviewTabProps {
  analysisResult?: AnalysisResult | null;
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

export function OverviewTab({ analysisResult, onNavigateTab, onViewEvidence }: OverviewTabProps) {
  // Dynamically derive metric cards from real analysis or fallback to empty state
  const metrics = React.useMemo(() => {
    if (!analysisResult) {
      return [
        {
          id: "doc-type",
          label: "Document Type",
          value: "Not loaded",
          secondary: "Upload a document to analyze",
          iconName: "FileText",
        },
        {
          id: "parties",
          label: "Identified Parties",
          value: "—",
          secondary: "No parties extracted",
          iconName: "Users",
        },
        {
          id: "effective-date",
          label: "Effective Date",
          value: "—",
          secondary: "Governing law not specified",
          iconName: "Calendar",
        },
        {
          id: "clauses-count",
          label: "Analyzed Clauses",
          value: "0 Clauses",
          secondary: "Awaiting document analysis",
          iconName: "Scale",
        },
        {
          id: "concerns-count",
          label: "Review Priorities",
          value: "0 Points",
          secondary: "No review flags",
          iconName: "AlertTriangle",
        },
        {
          id: "obligations-count",
          label: "Tracked Obligations",
          value: "0 Duties",
          secondary: "No duties extracted",
          iconName: "CheckSquare",
        },
      ];
    }

    const partiesStr =
      analysisResult.metadata.parties.length > 0
        ? analysisResult.metadata.parties.map((p) => p.name).join(" & ")
        : "Not found in uploaded document";

    return [
      {
        id: "doc-type",
        label: "Document Type",
        value: analysisResult.metadata.documentType || "Legal Document",
        secondary: analysisResult.documentName,
        iconName: "FileText",
      },
      {
        id: "parties",
        label: "Identified Parties",
        value: `${analysisResult.metadata.parties.length} Parties Identified`,
        secondary: partiesStr,
        iconName: "Users",
      },
      {
        id: "effective-date",
        label: "Effective Date",
        value: analysisResult.metadata.effectiveDate || "Not found in document",
        secondary: analysisResult.metadata.governingLaw ? `Governing: ${analysisResult.metadata.governingLaw}` : "Governing law not specified",
        iconName: "Calendar",
      },
      {
        id: "clauses-count",
        label: "Analyzed Clauses",
        value: `${analysisResult.keyClauses.length} Clauses Extracted`,
        secondary: "Structured legal terms",
        iconName: "Scale",
      },
      {
        id: "concerns-count",
        label: "Review Priorities",
        value: `${analysisResult.potentialConcerns.length} Review Points`,
        secondary: "Areas warranting attention",
        iconName: "AlertTriangle",
      },
      {
        id: "obligations-count",
        label: "Tracked Obligations",
        value: `${analysisResult.obligations.length} Duties Identified`,
        secondary: "Actionable contractual duties",
        iconName: "CheckSquare",
      },
    ];
  }, [analysisResult]);

  const execSummary = React.useMemo(() => {
    if (!analysisResult) {
      return {
        overview: "No document analysis available.",
        bulletPoints: [],
      };
    }
    return {
      overview: analysisResult.executiveSummary.overview,
      bulletPoints:
        analysisResult.executiveSummary.keyThemes.length > 0
          ? analysisResult.executiveSummary.keyThemes
          : analysisResult.executiveSummary.reviewPriorities,
    };
  }, [analysisResult]);

  const displayConcerns = React.useMemo(() => {
    if (!analysisResult) return [];
    return analysisResult.potentialConcerns.slice(0, 3).map((c) => ({
      id: c.id,
      title: c.title,
      severity: c.severity,
      description: c.explanation,
      clauseReference: c.source.sectionTitle || c.source.sectionId || "Section",
      pageNumber: c.source.pageNumber || 1,
      evidenceSnippet: c.source.quote,
      verified: c.verified,
    }));
  }, [analysisResult]);

  const displayClauses = React.useMemo(() => {
    if (!analysisResult) return [];
    return analysisResult.keyClauses.slice(0, 3).map((cl) => ({
      id: cl.id,
      title: cl.title,
      sectionReference: cl.source.sectionTitle || cl.source.sectionId || cl.category,
      category: cl.category,
      summary: cl.summary,
      importance: cl.importance,
      pageNumber: cl.source.pageNumber || 1,
      evidenceSnippet: cl.source.quote,
      verified: cl.verified,
    }));
  }, [analysisResult]);

  const displayObligations = React.useMemo(() => {
    if (!analysisResult) return [];
    return analysisResult.obligations.slice(0, 3).map((ob) => ({
      id: ob.id,
      party: ob.party,
      duty: ob.description,
      clauseReference: ob.source.sectionTitle || ob.source.sectionId || "Section",
      pageNumber: ob.source.pageNumber || 1,
      evidenceSnippet: ob.source.quote,
      verified: ob.verified,
    }));
  }, [analysisResult]);

  const displayDates = React.useMemo(() => {
    if (!analysisResult) return [];
    return analysisResult.importantDates.slice(0, 4).map((dt) => ({
      id: dt.id,
      event: dt.label,
      dateOrDuration: dt.dateOrDuration,
      type: dt.type,
      sourceSection: dt.source.sectionTitle || dt.source.sectionId || "Agreement",
      pageNumber: dt.source.pageNumber || 1,
      evidenceSnippet: dt.source.quote,
      verified: dt.verified,
    }));
  }, [analysisResult]);
  return (
    <div className="space-y-5 sm:space-y-6 text-left w-full">
      {/* 1. Metric Summary Cards (6 Cards: Desktop 3x2, Tablet 2x3, Mobile 1-2 Col) */}
      <section aria-labelledby="overview-metrics-heading">
        <h2 id="overview-metrics-heading" className="sr-only">
          Document Intelligence Metrics
        </h2>
        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
          {metrics.map((metric) => {
            const Icon = ICON_MAP[metric.iconName as keyof typeof ICON_MAP] || FileText;
            return (
              <Card
                key={metric.id}
                density="compact"
                className="p-3 sm:p-3.5 bg-[var(--surface)] hover:border-[var(--border-strong)] transition-all shadow-[var(--shadow-subtle)] flex flex-col justify-between"
              >
                <div className="flex items-center justify-between gap-1 mb-1.5">
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

      {/* 2. Executive Summary Block (High-density, Natural Content Height) */}
      <section aria-labelledby="exec-summary-heading">
        <Card className="bg-[var(--surface)] border-[var(--border)] relative overflow-hidden p-4 sm:p-5">
          {/* Subtle top accent bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--color-brand-blue)] via-[var(--color-accent-cyan)] to-indigo-600" />

          <div className="space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-[var(--color-brand-blue)]/10 text-[var(--primary)] shrink-0">
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                </div>
                <div>
                  <h2 id="exec-summary-heading" className="text-sm sm:text-base font-semibold text-[var(--foreground)]">
                    Executive Summary
                  </h2>
                  <p className="text-[11px] text-[var(--foreground-muted)]">
                    AI-distilled plain-language breakdown of key contract terms
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant={analysisResult ? "brand" : "neutral"} size="sm" dot>
                  {analysisResult ? "Real AI Analysis • NVIDIA Nemotron" : "No Analysis Loaded"}
                </Badge>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-[var(--foreground-secondary)] leading-relaxed">
              {execSummary.overview}
            </p>

            <div className="pt-2.5 border-t border-[var(--border-muted)]">
              <h3 className="text-[11px] font-semibold text-[var(--foreground)] uppercase tracking-wider mb-2">
                Plain-Language Takeaways
              </h3>
              <ul className="space-y-1.5">
                {execSummary.bulletPoints.map((point, index) => (
                  <li key={index} className="flex items-start gap-2 text-xs text-[var(--foreground-secondary)] leading-relaxed">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--primary)] mt-1.5 shrink-0" aria-hidden="true" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex items-center justify-end pt-1">
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        {/* Left: Potential Concerns Preview */}
        <section aria-labelledby="concerns-preview-heading">
          <Card className="bg-[var(--surface)] border-[var(--border)] p-4 sm:p-5 flex flex-col justify-between space-y-3.5">
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[var(--border-muted)]">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" aria-hidden="true" />
                  <h2 id="concerns-preview-heading" className="text-sm font-semibold text-[var(--foreground)]">
                    Potential Concerns
                  </h2>
                </div>
                <Badge variant="warning" size="sm">
                  {analysisResult ? `${analysisResult.potentialConcerns.length} Review Points` : "0 Flagged"}
                </Badge>
              </div>

              <p className="text-[11px] text-[var(--foreground-muted)]">
                Areas flagged for closer review. Non-assertive informational guidance.
              </p>

              <div className="space-y-2.5">
                {displayConcerns.length === 0 ? (
                  <div className="p-4 text-center rounded-[var(--radius-md)] border border-dashed border-[var(--border)] text-xs text-[var(--foreground-muted)]">
                    No concerns flagged for this document.
                  </div>
                ) : (
                  displayConcerns.map((concern) => (
                    <div
                      key={concern.id}
                      className="p-2.5 sm:p-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-subtle)] space-y-1.5 hover:border-[var(--border-strong)] transition-all"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-xs font-semibold text-[var(--foreground)] truncate">
                          {concern.title}
                        </h4>
                        <RiskIndicator severity={concern.severity} size="sm" />
                      </div>

                      <p className="text-xs text-[var(--foreground-secondary)] line-clamp-2 leading-relaxed">
                        {concern.description}
                      </p>

                      <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-1 pt-1 text-[11px] text-[var(--foreground-muted)]">
                        <span className="font-mono text-[10px]">
                          {concern.clauseReference} &bull; Page {concern.pageNumber}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            onViewEvidence({
                              id: concern.id,
                              documentTitle: analysisResult?.documentName || "Document",
                              sectionReference: concern.clauseReference || "Clause",
                              pageNumber: concern.pageNumber || 1,
                              excerpt: concern.evidenceSnippet || "",
                              contextNote: concern.verified ? "✓ Verified against source text" : "Unverified citation",
                            })
                          }
                          className="inline-flex items-center gap-1 text-[var(--primary)] hover:underline font-medium text-[11px] cursor-pointer self-start xs:self-auto"
                        >
                          <span>View Evidence</span>
                          <ExternalLink className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-[var(--border-muted)] flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
                onClick={() => onNavigateTab("concerns")}
                className="text-xs"
              >
                View All {analysisResult ? analysisResult.potentialConcerns.length : 0} Concerns
              </Button>
            </div>
          </Card>
        </section>

        {/* Right: Key Clauses Preview */}
        <section aria-labelledby="clauses-preview-heading">
          <Card className="bg-[var(--surface)] border-[var(--border)] p-4 sm:p-5 flex flex-col justify-between space-y-3.5">
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[var(--border-muted)]">
                <div className="flex items-center gap-2">
                  <Scale className="h-4 w-4 text-[var(--primary)] shrink-0" aria-hidden="true" />
                  <h2 id="clauses-preview-heading" className="text-sm font-semibold text-[var(--foreground)]">
                    Key Clauses
                  </h2>
                </div>
                <Badge variant="neutral" size="sm">
                  {analysisResult ? `${analysisResult.keyClauses.length} Extracted` : "0 Identified"}
                </Badge>
              </div>

              <p className="text-[11px] text-[var(--foreground-muted)]">
                Core provisions identified across compensation, intellectual property, and separation.
              </p>

              <div className="space-y-2.5">
                {displayClauses.length === 0 ? (
                  <div className="p-4 text-center rounded-[var(--radius-md)] border border-dashed border-[var(--border)] text-xs text-[var(--foreground-muted)]">
                    No clauses identified for this document.
                  </div>
                ) : (
                  displayClauses.map((clause) => (
                    <div
                      key={clause.id}
                      className="p-2.5 sm:p-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-subtle)] space-y-1.5 hover:border-[var(--border-strong)] transition-all"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-xs font-semibold text-[var(--foreground)] truncate">
                          {clause.title}
                        </h4>
                        <Badge variant="brand" size="sm">
                          {clause.sectionReference}
                        </Badge>
                      </div>

                      <p className="text-xs text-[var(--foreground-secondary)] line-clamp-2 leading-relaxed">
                        {clause.summary}
                      </p>

                      <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-1 pt-1 text-[11px] text-[var(--foreground-muted)]">
                        <span className="font-mono text-[10px]">
                          Page {clause.pageNumber} &bull; {clause.category}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            onViewEvidence({
                              id: clause.id,
                              documentTitle: analysisResult?.documentName || "Document",
                              sectionReference: clause.sectionReference || "Clause",
                              pageNumber: clause.pageNumber || 1,
                              excerpt: clause.evidenceSnippet || "",
                              contextNote: clause.verified ? "✓ Verified against source text" : "Unverified citation",
                            })
                          }
                          className="inline-flex items-center gap-1 text-[var(--primary)] hover:underline font-medium text-[11px] cursor-pointer self-start xs:self-auto"
                        >
                          <span>View Evidence</span>
                          <ExternalLink className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-[var(--border-muted)] flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
                onClick={() => onNavigateTab("clauses")}
                className="text-xs"
              >
                View All {analysisResult ? analysisResult.keyClauses.length : 0} Key Clauses
              </Button>
            </div>
          </Card>
        </section>
      </div>

      {/* 4. Two-Column Grid: Obligations & Important Dates Previews */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        {/* Obligations Snapshot */}
        <section aria-labelledby="obligations-preview-heading">
          <Card className="bg-[var(--surface)] border-[var(--border)] p-4 sm:p-5 flex flex-col justify-between space-y-3.5">
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[var(--border-muted)]">
                <div className="flex items-center gap-2">
                  <CheckSquare className="h-4 w-4 text-emerald-600 shrink-0" aria-hidden="true" />
                  <h2 id="obligations-preview-heading" className="text-sm font-semibold text-[var(--foreground)]">
                    Important Obligations
                  </h2>
                </div>
                <Badge variant="neutral" size="sm">
                  {analysisResult ? `${analysisResult.obligations.length} Duties` : "0 Identified"}
                </Badge>
              </div>

              <div className="space-y-2">
                {displayObligations.length === 0 ? (
                  <div className="p-4 text-center rounded-[var(--radius-md)] border border-dashed border-[var(--border)] text-xs text-[var(--foreground-muted)]">
                    No obligations tracked for this document.
                  </div>
                ) : (
                  displayObligations.map((ob) => (
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
                  ))
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-[var(--border-muted)] flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
                onClick={() => onNavigateTab("obligations")}
                className="text-xs"
              >
                View All {analysisResult ? analysisResult.obligations.length : 0} Obligations
              </Button>
            </div>
          </Card>
        </section>

        {/* Important Dates Snapshot */}
        <section aria-labelledby="dates-preview-heading">
          <Card className="bg-[var(--surface)] border-[var(--border)] p-4 sm:p-5 flex flex-col justify-between space-y-3.5">
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[var(--border-muted)]">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-[var(--primary)] shrink-0" aria-hidden="true" />
                  <h2 id="dates-preview-heading" className="text-sm font-semibold text-[var(--foreground)]">
                    Important Dates &amp; Milestones
                  </h2>
                </div>
                <Badge variant="neutral" size="sm">
                  {analysisResult ? `${analysisResult.importantDates.length} Dates` : "0 Identified"}
                </Badge>
              </div>

              <div className="space-y-2">
                {displayDates.length === 0 ? (
                  <div className="p-4 text-center rounded-[var(--radius-md)] border border-dashed border-[var(--border)] text-xs text-[var(--foreground-muted)]">
                    No important dates found for this document.
                  </div>
                ) : (
                  displayDates.map((dt) => (
                    <div
                      key={dt.id}
                      className="flex items-center justify-between p-2.5 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-subtle)] gap-2"
                    >
                      <div className="min-w-0">
                        <h4 className="text-xs font-semibold text-[var(--foreground)] truncate">
                          {dt.event}
                        </h4>
                        <p className="text-[10px] text-[var(--foreground-muted)] font-mono">
                          {dt.sourceSection} &bull; Page {dt.pageNumber}
                        </p>
                      </div>

                      <Badge variant="brand" size="sm" className="font-mono shrink-0 text-[10px]">
                        {dt.dateOrDuration}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-[var(--border-muted)] flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
                onClick={() => onNavigateTab("dates")}
                className="text-xs"
              >
                View All {analysisResult ? analysisResult.importantDates.length : 0} Key Dates
              </Button>
            </div>
          </Card>
        </section>
      </div>

      {/* Safety Notice Footer Banner */}
      <div className="rounded-[var(--radius-lg)] border border-blue-200/70 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/20 p-3 sm:p-3.5 flex items-start gap-2.5 text-xs text-blue-900 dark:text-blue-100">
        <Info className="h-4 w-4 shrink-0 mt-0.5 text-[var(--primary)]" aria-hidden="true" />
        <div>
          <p className="font-semibold mb-0.5 text-xs">Informational Document Intelligence</p>
          <p className="text-[11px] text-[var(--foreground-secondary)] leading-relaxed">
            LexiGuide AI highlights key clauses, obligations, and potential areas of concern for informational convenience. It does not provide formal legal advice or substitute for consultation with a licensed advocate.
          </p>
        </div>
      </div>
    </div>
  );
}
