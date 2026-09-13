"use client";

import * as React from "react";
import { CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";

export interface UnchangedSectionProps {
  section: {
    id: string;
    title: string;
    sectionReference: string;
    pageNumber: number;
    note: string;
  };
}

export function UnchangedSectionCard({ section }: UnchangedSectionProps) {
  return (
    <Card
      density="compact"
      className="p-3.5 sm:p-4 bg-[var(--surface)] border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left hover:border-[var(--border-strong)] transition-all rounded-[var(--radius-lg)] shadow-2xs w-full"
    >
      <div className="flex items-start gap-3 min-w-0 flex-1">
        <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" aria-hidden="true" />
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-xs sm:text-sm font-semibold text-[var(--foreground)] tracking-tight">
              {section.title}
            </h4>
            <span className="font-mono text-[11px] px-2 py-0.5 rounded-md bg-[var(--surface-muted)] text-[var(--foreground-muted)] font-semibold shrink-0">
              {section.sectionReference}
            </span>
          </div>
          <p className="text-xs text-[var(--foreground-muted)] leading-relaxed max-w-4xl">
            {section.note}
          </p>
        </div>
      </div>

      <div className="text-[11px] font-mono text-[var(--foreground-muted)] shrink-0 self-end sm:self-center bg-[var(--surface-muted)] sm:bg-transparent px-2 sm:px-0 py-1 sm:py-0 rounded">
        Page {section.pageNumber} &bull;{" "}
        <span className="text-emerald-600 dark:text-emerald-400 font-sans font-medium">
          Identical
        </span>
      </div>
    </Card>
  );
}
