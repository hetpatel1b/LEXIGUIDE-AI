"use client";

import * as React from "react";
import { FileText, ArrowRight, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { COMPARISON_DOC_A, COMPARISON_DOC_B } from "../fixtures/comparison-fixture";
import type { ComparisonDocument } from "@/types";

export interface DocumentPairProps {
  docA?: ComparisonDocument;
  docB?: ComparisonDocument;
  onChangeDocA?: () => void;
  onChangeDocB?: () => void;
}

export function DocumentPair({
  docA = COMPARISON_DOC_A,
  docB = COMPARISON_DOC_B,
  onChangeDocA,
  onChangeDocB,
}: DocumentPairProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 text-left items-stretch w-full">
      {/* Document A Card */}
      <Card
        density="compact"
        className="p-4 sm:p-5 bg-[var(--surface)] border-[var(--border)] relative overflow-hidden flex flex-col justify-between h-full space-y-3.5 shadow-2xs rounded-[var(--radius-lg)]"
      >
        {/* Top Row: Document Label & Version Badge */}
        <div className="flex items-center justify-between gap-3 min-w-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-500/10 border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400">
              <FileText className="h-4.5 w-4.5" aria-hidden="true" />
            </div>

            <div className="flex items-center gap-2 flex-wrap min-w-0">
              <span className="text-[11px] font-mono uppercase font-semibold text-[var(--foreground-muted)] tracking-wider">
                Document A
              </span>
              <Badge variant="neutral" size="sm">
                {docA.versionLabel}
              </Badge>
            </div>
          </div>

          {onChangeDocA && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onChangeDocA}
              leftIcon={<RefreshCw className="h-3 w-3" />}
              className="text-[11px] text-[var(--foreground-muted)] hover:text-[var(--foreground)] shrink-0 h-7 px-2"
              title="Change Document A"
            >
              Change
            </Button>
          )}
        </div>

        {/* Middle: Document Filename */}
        <div className="min-w-0 py-0.5">
          <h3
            className="text-sm sm:text-base font-semibold text-[var(--foreground)] truncate tracking-tight"
            title={docA.name}
          >
            {docA.name}
          </h3>
        </div>

        {/* Divider & Bottom: Format, Pages, Size and Status Baseline */}
        <div className="flex items-center justify-between gap-2 pt-3 border-t border-[var(--border-muted)] text-[11px] font-mono text-[var(--foreground-muted)]">
          <div className="flex items-center gap-2 truncate min-w-0">
            <span className="font-semibold text-[var(--foreground-secondary)]">{docA.type}</span>
            <span aria-hidden="true">&bull;</span>
            <span>{docA.pageCount} pages</span>
            <span aria-hidden="true">&bull;</span>
            <span>{(docA.sizeBytes / (1024 * 1024)).toFixed(1)} MB</span>
          </div>
          <span className="shrink-0 text-emerald-600 dark:text-emerald-400 font-sans font-medium text-xs">
            Base Contract
          </span>
        </div>
      </Card>

      {/* Document B Card */}
      <Card
        density="compact"
        className="p-4 sm:p-5 bg-[var(--surface)] border-[var(--primary)]/40 relative overflow-hidden flex flex-col justify-between h-full space-y-3.5 shadow-2xs rounded-[var(--radius-lg)]"
      >
        {/* Top Row: Document Label & Version Badge */}
        <div className="flex items-center justify-between gap-3 min-w-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--primary)]/10 border border-[var(--primary)]/20 text-[var(--primary)]">
              <FileText className="h-4.5 w-4.5" aria-hidden="true" />
            </div>

            <div className="flex items-center gap-2 flex-wrap min-w-0">
              <span className="text-[11px] font-mono uppercase font-semibold text-[var(--primary)] tracking-wider">
                Document B
              </span>
              <Badge variant="brand" size="sm">
                {docB.versionLabel}
              </Badge>
            </div>
          </div>

          {onChangeDocB && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onChangeDocB}
              leftIcon={<RefreshCw className="h-3 w-3" />}
              className="text-[11px] text-[var(--foreground-muted)] hover:text-[var(--foreground)] shrink-0 h-7 px-2"
              title="Change Document B"
            >
              Change
            </Button>
          )}
        </div>

        {/* Middle: Document Filename */}
        <div className="min-w-0 py-0.5">
          <h3
            className="text-sm sm:text-base font-semibold text-[var(--foreground)] truncate tracking-tight"
            title={docB.name}
          >
            {docB.name}
          </h3>
        </div>

        {/* Divider & Bottom: Format, Pages, Size and Status Baseline */}
        <div className="flex items-center justify-between gap-2 pt-3 border-t border-[var(--border-muted)] text-[11px] font-mono text-[var(--foreground-muted)]">
          <div className="flex items-center gap-2 truncate min-w-0">
            <span className="font-semibold text-[var(--primary)]">{docB.type}</span>
            <span aria-hidden="true">&bull;</span>
            <span>{docB.pageCount} pages</span>
            <span aria-hidden="true">&bull;</span>
            <span>{(docB.sizeBytes / (1024 * 1024)).toFixed(1)} MB</span>
          </div>
          <span className="shrink-0 text-[var(--primary)] font-sans font-medium text-xs">
            Comparison Target
          </span>
        </div>
      </Card>
    </div>
  );
}
