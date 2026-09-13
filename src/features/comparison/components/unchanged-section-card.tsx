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
      className="p-3.5 bg-[var(--surface)] border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left hover:border-[var(--border-strong)] transition-all"
    >
      <div className="flex items-start gap-2.5 min-w-0">
        <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" aria-hidden="true" />
        <div className="min-w-0 space-y-0.5">
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-semibold text-[var(--foreground)] truncate">
              {section.title}
            </h4>
            <span className="font-mono text-[11px] px-1.5 py-0.2 rounded bg-[var(--surface-muted)] text-[var(--foreground-muted)]">
              {section.sectionReference}
            </span>
          </div>
          <p className="text-xs text-[var(--foreground-muted)] leading-relaxed">
            {section.note}
          </p>
        </div>
      </div>

      <div className="text-[11px] font-mono text-[var(--foreground-muted)] shrink-0 self-end sm:self-center">
        Page {section.pageNumber} · Identical
      </div>
    </Card>
  );
}
