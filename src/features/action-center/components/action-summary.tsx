"use client";

import * as React from "react";
import { CheckSquare, Calendar, HelpCircle, MessageSquare } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { ActionSummaryMetrics } from "@/types";

export interface ActionSummaryProps {
  metrics: ActionSummaryMetrics;
  completedCount: number;
  totalCount: number;
}

export function ActionSummary({
  metrics,
  completedCount,
  totalCount,
}: ActionSummaryProps) {
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const cards = [
    {
      label: "Items to Review",
      count: metrics.reviewCount,
      secondary: "Clauses requiring scrutiny",
      icon: CheckSquare,
      accent: "text-amber-600",
    },
    {
      label: "Upcoming Dates",
      count: metrics.upcomingCount,
      secondary: "Contractual milestones",
      icon: Calendar,
      accent: "text-[var(--primary)]",
    },
    {
      label: "Questions to Confirm",
      count: metrics.confirmCount,
      secondary: "Carve-outs & benefits",
      icon: HelpCircle,
      accent: "text-blue-600",
    },
    {
      label: "Professional Topics",
      count: metrics.discussCount,
      secondary: "Questions for advocate",
      icon: MessageSquare,
      accent: "text-indigo-600",
    },
  ];

  return (
    <div className="space-y-4 text-left">
      {/* 4 Category Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Card
              key={c.label}
              density="compact"
              className="p-3.5 bg-[var(--surface)] border-[var(--border)] flex flex-col justify-between space-y-1 shadow-2xs"
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-[11px] font-medium text-[var(--foreground-muted)] truncate">
                  {c.label}
                </span>
                <div className="p-1 rounded bg-[var(--surface-muted)] text-[var(--foreground-muted)] shrink-0">
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                </div>
              </div>

              <div>
                <div className={`text-xl font-bold tracking-tight ${c.accent}`}>
                  {c.count}
                </div>
                <p className="text-[10px] text-[var(--foreground-muted)] truncate">
                  {c.secondary}
                </p>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Lightweight Session Checklist Progress Bar */}
      <div className="p-3.5 rounded-[var(--radius-lg)] bg-[var(--surface)] border border-[var(--border)] space-y-2">
        <div className="flex items-center justify-between text-xs font-medium">
          <span className="text-[var(--foreground)] font-semibold">
            Action Review Progress:
          </span>
          <span className="text-[var(--foreground-muted)] font-mono text-[11px]">
            {completedCount} of {totalCount} reviewed ({percentage}%)
          </span>
        </div>

        <Progress value={percentage} aria-label="Review checklist progress" />
      </div>
    </div>
  );
}
