"use client";

import * as React from "react";
import { Layers, GitCompare, AlertCircle, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { COMPARISON_METRICS } from "../fixtures/comparison-fixture";
import type { ComparisonSummaryMetrics } from "@/types";

export interface ComparisonSummaryProps {
  metrics?: ComparisonSummaryMetrics;
}

export function ComparisonSummary({
  metrics = COMPARISON_METRICS,
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
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-left">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card
            key={card.label}
            density="compact"
            className="p-3.5 bg-[var(--surface)] border-[var(--border)] flex flex-col justify-between space-y-1 shadow-2xs"
          >
            <div className="flex items-center justify-between gap-1">
              <span className="text-[11px] font-medium text-[var(--foreground-muted)] truncate">
                {card.label}
              </span>
              <div className="p-1 rounded bg-[var(--surface-muted)] text-[var(--foreground-muted)] shrink-0">
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
              </div>
            </div>

            <div>
              <div className={`text-xl font-bold tracking-tight ${card.accent}`}>
                {card.value}
              </div>
              <p className="text-[10px] text-[var(--foreground-muted)] truncate">
                {card.secondary}
              </p>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
