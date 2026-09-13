"use client";

import * as React from "react";
import { Calendar, Clock, RotateCcw, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { IMPORTANT_DATES } from "../../fixtures/analysis-fixture";
import type { ImportantDateType } from "@/types";

export function DatesTab() {
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

        <Badge variant="neutral" size="sm">
          4 Identified Milestones
        </Badge>
      </div>

      {/* Dates Grid / Table Cards */}
      <div className="space-y-3.5">
        {IMPORTANT_DATES.map((dateItem) => (
          <Card
            key={dateItem.id}
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

              <div className="flex items-center gap-2">
                {renderTypeBadge(dateItem.type)}
                <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-md bg-[var(--color-brand-blue)]/10 text-[var(--primary)]">
                  {dateItem.dateOrDuration}
                </span>
              </div>
            </div>

            {dateItem.description && (
              <p className="text-xs text-[var(--foreground-secondary)] leading-relaxed pl-10">
                {dateItem.description}
              </p>
            )}
          </Card>
        ))}
      </div>

      {/* Guidance Note */}
      <div className="p-4 rounded-[var(--radius-lg)] bg-[var(--surface-subtle)] border border-[var(--border)] text-xs text-[var(--foreground-muted)] space-y-1">
        <p className="font-semibold text-[var(--foreground)]">
          Distinguishing Calendar Dates vs. Relative Durations
        </p>
        <p className="leading-relaxed">
          LexiGuide AI explicitly separates fixed calendar milestones (such as the Effective Date of 01 April 2026) from conditional relative durations (such as the 90-day resignation notice period). Ensure your notification schedules take contractual calculation rules into account (e.g. business days vs calendar days).
        </p>
      </div>
    </div>
  );
}
