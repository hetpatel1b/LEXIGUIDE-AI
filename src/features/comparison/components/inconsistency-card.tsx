"use client";

import * as React from "react";
import { AlertTriangle, Sparkles, HelpCircle, FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ComparisonInconsistency } from "@/types/comparison";

export interface InconsistencyCardProps {
  inconsistency: ComparisonInconsistency;
  onAskAboutInconsistency?: (inconsistency: ComparisonInconsistency) => void;
}

export function InconsistencyCard({
  inconsistency,
  onAskAboutInconsistency,
}: InconsistencyCardProps) {
  const query = inconsistency.suggestedReviewQuestion ||
    `How should the conflict between "${inconsistency.provisionA.sectionTitle}" and "${inconsistency.provisionB.sectionTitle}" be resolved?`;

  return (
    <Card
      density="spacious"
      className="bg-[var(--surface)] border-amber-300 dark:border-amber-800/60 hover:border-amber-400 dark:hover:border-amber-700 transition-all p-4 sm:p-5 lg:p-6 rounded-[var(--radius-xl)] space-y-4 text-left shadow-2xs w-full"
    >
      {/* 1. Header with Warning Alert & Badges */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-[var(--border-muted)]">
        <div className="space-y-1 min-w-0 flex-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="p-1 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
              <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-[var(--foreground)] tracking-tight">
              {inconsistency.title}
            </h3>
          </div>
          <p className="text-xs text-[var(--foreground-muted)] font-mono">
            Document: {inconsistency.documentName} &bull; Internal Review Point
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Badge variant="warning" size="sm" dot>
            Potential Conflict Requiring Review
          </Badge>
        </div>
      </div>

      {/* 2. Conflicting Provisions Side-by-Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4 text-xs items-stretch w-full">
        {/* Provision A */}
        <div className="p-3.5 sm:p-4 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-subtle)] flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between text-[11px] font-semibold text-[var(--foreground-muted)] pb-1.5 border-b border-[var(--border-muted)]">
            <span className="flex items-center gap-1.5 truncate">
              <FileText className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" aria-hidden="true" />
              <span>{inconsistency.provisionA.sectionTitle}</span>
            </span>
            <span className="font-mono shrink-0">Page {inconsistency.provisionA.pageNumber}</span>
          </div>
          <div className="flex-1 py-1">
            <p className="italic leading-relaxed text-[var(--foreground-secondary)] font-serif border-l-2 border-amber-400 dark:border-amber-600 pl-2.5">
              &ldquo;{inconsistency.provisionA.quote}&rdquo;
            </p>
          </div>
        </div>

        {/* Provision B */}
        <div className="p-3.5 sm:p-4 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-subtle)] flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between text-[11px] font-semibold text-[var(--foreground-muted)] pb-1.5 border-b border-[var(--border-muted)]">
            <span className="flex items-center gap-1.5 truncate">
              <FileText className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" aria-hidden="true" />
              <span>{inconsistency.provisionB.sectionTitle}</span>
            </span>
            <span className="font-mono shrink-0">Page {inconsistency.provisionB.pageNumber}</span>
          </div>
          <div className="flex-1 py-1">
            <p className="italic leading-relaxed text-[var(--foreground-secondary)] font-serif border-l-2 border-amber-400 dark:border-amber-600 pl-2.5">
              &ldquo;{inconsistency.provisionB.quote}&rdquo;
            </p>
          </div>
        </div>
      </div>

      {/* 3. Explanation & Why This Matters */}
      <div className="space-y-2 text-xs">
        <div className="p-3 rounded-[var(--radius-md)] bg-[var(--surface-muted)] leading-relaxed">
          <span className="font-semibold text-[var(--foreground)] mr-1.5">Discrepancy:</span>
          <span className="text-[var(--foreground-secondary)]">{inconsistency.explanation}</span>
        </div>

        <div className="p-3 rounded-[var(--radius-md)] bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 text-amber-950 dark:text-amber-200 leading-relaxed">
          <span className="font-semibold mr-1.5">Why It Matters:</span>
          <span>{inconsistency.whyItMatters}</span>
        </div>
      </div>

      {/* 4. Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[var(--border-muted)] text-xs">
        <div className="flex items-center gap-2 text-[var(--foreground-muted)]">
          <HelpCircle className="h-3.5 w-3.5 text-[var(--primary)] shrink-0" aria-hidden="true" />
          <span className="italic truncate">{inconsistency.suggestedReviewQuestion}</span>
        </div>

        <Button
          href={`/qa?q=${encodeURIComponent(query)}&documentId=${encodeURIComponent(inconsistency.documentId)}`}
          variant="outline"
          size="sm"
          leftIcon={<Sparkles className="h-3 w-3 text-[var(--primary)]" />}
          className="text-xs shrink-0 self-start sm:self-auto"
        >
          Ask About Conflict
        </Button>
      </div>
    </Card>
  );
}
