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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
      {/* Document A Card */}
      <Card
        density="compact"
        className="p-4 bg-[var(--surface)] border-[var(--border)] relative overflow-hidden flex flex-col justify-between space-y-3"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400">
              <FileText className="h-5 w-5" aria-hidden="true" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono uppercase font-semibold text-[var(--foreground-muted)]">
                  Document A
                </span>
                <Badge variant="neutral" size="sm">
                  {docA.versionLabel}
                </Badge>
              </div>

              <h3 className="text-xs sm:text-sm font-semibold text-[var(--foreground)] truncate mt-0.5" title={docA.name}>
                {docA.name}
              </h3>
            </div>
          </div>

          {onChangeDocA && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onChangeDocA}
              leftIcon={<RefreshCw className="h-3 w-3" />}
              className="text-[11px] text-[var(--foreground-muted)] hover:text-[var(--foreground)] shrink-0"
              title="Change Document A"
            >
              Change
            </Button>
          )}
        </div>

        <div className="flex items-center gap-3 pt-2 border-t border-[var(--border-muted)] text-[11px] font-mono text-[var(--foreground-muted)]">
          <span>{docA.type} · {docA.pageCount} pages</span>
          <span aria-hidden="true">&bull;</span>
          <span>{(docA.sizeBytes / (1024 * 1024)).toFixed(1)} MB</span>
          <span aria-hidden="true">&bull;</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-sans font-medium">Base Contract</span>
        </div>
      </Card>

      {/* Document B Card */}
      <Card
        density="compact"
        className="p-4 bg-[var(--surface)] border-[var(--primary)]/40 relative overflow-hidden flex flex-col justify-between space-y-3 shadow-xs"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/40 text-[var(--primary)]">
              <FileText className="h-5 w-5" aria-hidden="true" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono uppercase font-semibold text-[var(--primary)]">
                  Document B
                </span>
                <Badge variant="brand" size="sm">
                  {docB.versionLabel}
                </Badge>
              </div>

              <h3 className="text-xs sm:text-sm font-semibold text-[var(--foreground)] truncate mt-0.5" title={docB.name}>
                {docB.name}
              </h3>
            </div>
          </div>

          {onChangeDocB && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onChangeDocB}
              leftIcon={<RefreshCw className="h-3 w-3" />}
              className="text-[11px] text-[var(--foreground-muted)] hover:text-[var(--foreground)] shrink-0"
              title="Change Document B"
            >
              Change
            </Button>
          )}
        </div>

        <div className="flex items-center gap-3 pt-2 border-t border-[var(--border-muted)] text-[11px] font-mono text-[var(--foreground-muted)]">
          <span>{docB.type} · {docB.pageCount} pages</span>
          <span aria-hidden="true">&bull;</span>
          <span>{(docB.sizeBytes / (1024 * 1024)).toFixed(1)} MB</span>
          <span aria-hidden="true">&bull;</span>
          <span className="text-[var(--primary)] font-sans font-medium">Comparison Target</span>
        </div>
      </Card>
    </div>
  );
}
