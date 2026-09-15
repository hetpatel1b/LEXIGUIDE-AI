"use client";

import * as React from "react";
import { Calendar } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ImportantDateType } from "@/types";
import type { AnalysisResult } from "@/lib/ai/types";

export interface DatesTabProps {
  analysisResult?: AnalysisResult | null;
}

export function DatesTab({ analysisResult }: DatesTabProps) {
  const dates = React.useMemo(() => {
    if (!analysisResult) return [];
    return analysisResult.importantDates.map((dt) => ({
      id: dt.id,
      event: dt.label,
      dateOrDuration: dt.dateOrDuration,
      type: dt.type as ImportantDateType,
      sourceSection: dt.source.sectionTitle || dt.source.sectionId || "Agreement",
      pageNumber: dt.source.pageNumber || 1,
      description: dt.source.quote ? `Referenced text: "${dt.source.quote}"` : undefined,
      verified: dt.verified,
    }));
  }, [analysisResult]);

  const renderTypeBadge = (type: ImportantDateType) => {
    switch (type) {
      case "calendar_date":
        return <Badge variant="brand" size="sm">Calendar Date</Badge>;
      case "notice_period":
        return <Badge variant="warning" size="sm">Notice Period</Badge>;
      case "renewal_period":
        return <Badge variant="neutral" size="sm">Review Milestone</Badge>;
      case "duration":
        return <Badge variant="neutral" size="sm">Duration Window</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 text-left w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[var(--border)]">
        <div>
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            Important Dates, Milestones &amp; Durations
          </h2>
          <p className="text-xs text-[var(--foreground-muted)]">
            Structured chronological milestones, contractual notice periods, and appraisal windows
          </p>
        </div>

        <Badge variant={analysisResult ? "brand" : "neutral"} size="sm">
          {dates.length} Identified Milestones
        </Badge>
      </div>

      {/* Dates Grid / Table Cards */}
      <div className="space-y-3.5">
        {dates.length === 0 ? (
          <div className="p-8 text-center rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground-muted)] text-xs">
            No specific dates or notice periods identified in this document.
          </div>
        ) : (
          dates.map((dateItem, index) => (
            <Card
              key={`${dateItem.id || "date"}_${index}`}
              density="compact"
              className="p-4 bg-[var(--surface)] hover:border-[var(--border-strong)] transition-all space-y-2.5"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-[var(--surface-muted)] text-[var(--primary)] shrink-0">
                    <Calendar className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[var(--foreground)]">
                      {dateItem.event}
                    </h3>
                    <p className="font-mono text-[11px] text-[var(--foreground-muted)]">
                      {dateItem.sourceSection} · Page {dateItem.pageNumber}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {renderTypeBadge(dateItem.type)}
                  <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-md bg-[var(--color-brand-blue)]/10 text-[var(--primary)] whitespace-nowrap">
                    {dateItem.dateOrDuration}
                  </span>
                </div>
              </div>

              {dateItem.description && (
                <p className="text-xs text-[var(--foreground-secondary)] leading-relaxed pl-0 sm:pl-10 mt-1">
                  {dateItem.description}
                </p>
              )}
            </Card>
          ))
        )}
      </div>

      {/* Guidance Note */}
      <div className="p-4 rounded-[var(--radius-lg)] bg-[var(--surface-subtle)] border border-[var(--border)] text-xs text-[var(--foreground-muted)] space-y-1">
        <p className="font-semibold text-[var(--foreground)]">
          Distinguishing Calendar Dates vs. Relative Durations
        </p>
        <p className="leading-relaxed">
          LexiGuide AI explicitly separates fixed calendar milestones from conditional relative durations (such as 30-day or 90-day notification periods). Ensure notice calculations account for contractual business-day definitions.
        </p>
      </div>
    </div>
  );
}
