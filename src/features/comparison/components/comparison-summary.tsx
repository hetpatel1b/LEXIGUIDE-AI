"use client";

import * as React from "react";
import { Layers, GitCompare, AlertCircle, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { ComparisonSummaryMetrics } from "@/types";

export interface ComparisonSummaryProps {
  metrics?: ComparisonSummaryMetrics;
}

const DEFAULT_METRICS: ComparisonSummaryMetrics = {
  sectionsCompared: 0,
  changesIdentified: 0,
  majorChanges: 0,
  moderateChanges: 0,
  minorChanges: 0,
  unchangedCount: 0,
};

export function ComparisonSummary({
  metrics = DEFAULT_METRICS,
}: ComparisonSummaryProps) {
  const cards = [
    {
      label: "Sections Compared",
      value: metrics.sectionsCompared,
      secondary: "Across both versions",
      icon: Layers,
      accent: "text-[var(--foreground)]",
    },
    {
      label: "Changes Identified",
      value: metrics.changesIdentified,
      secondary: "Clause-level diffs",
      icon: GitCompare,
      accent: "text-[var(--primary)]",
    },
    {
      label: "Major Changes",
      value: metrics.majorChanges,
      secondary: "Deserves closer review",
      icon: AlertCircle,
      accent: "text-amber-600",
    },
    {
      label: "Unchanged Sections",
      value: metrics.unchangedCount,
      secondary: "Identical substantive terms",
      icon: CheckCircle2,
      accent: "text-emerald-600",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 text-left items-stretch w-full">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card
            key={card.label}
            density="compact"
            className="p-3.5 sm:p-4 bg-[var(--surface)] border-[var(--border)] rounded-[var(--radius-lg)] flex flex-col justify-between h-full space-y-2.5 shadow-2xs"
          >
            {/* Top Row: Label & Icon */}
            <div className="flex items-center justify-between gap-2 min-w-0">
              <span className="text-xs font-medium text-[var(--foreground-muted)] truncate">
                {card.label}
              </span>
              <div className="p-1.5 rounded-md bg-[var(--surface-muted)] text-[var(--foreground-muted)] shrink-0 flex items-center justify-center">
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
              </div>
            </div>

            {/* Middle & Bottom: Prominent Metric Number & Secondary Description */}
            <div className="space-y-0.5">
              <div className={`text-2xl sm:text-3xl font-bold tracking-tight ${card.accent}`}>
                {card.value}
              </div>
              <p className="text-[11px] text-[var(--foreground-muted)] truncate">
                {card.secondary}
              </p>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
