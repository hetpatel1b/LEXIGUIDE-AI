"use client";

import * as React from "react";
import { FileText, RefreshCw, UploadCloud } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ComparisonDocument } from "@/types/comparison";

export interface DocumentPairProps {
  docA: ComparisonDocument;
  docB: ComparisonDocument | null;
  onUploadDocB: () => void;
  onReplaceDocB: () => void;
  isProcessingB?: boolean;
}

export function DocumentPair({
  docA,
  docB,
  onUploadDocB,
  onReplaceDocB,
  isProcessingB = false,
}: DocumentPairProps) {
  return (
    <div className="relative w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 text-left items-stretch w-full">
        {/* Document A Card (Baseline / Current Active Document) */}
        <Card
          density="compact"
          className="p-4 sm:p-5 bg-[var(--surface)] border-[var(--border)] relative overflow-hidden flex flex-col justify-between h-full space-y-3.5 shadow-2xs rounded-[var(--radius-lg)]"
        >
          {/* Top Row: Document Label & Baseline Badge */}
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
                  Baseline Document
                </Badge>
              </div>
            </div>

            <span className="shrink-0 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              Active Document
            </span>
          </div>

          {/* Middle: Document Filename */}
          <div className="min-w-0 py-1">
            <h3
              className="text-sm sm:text-base font-semibold text-[var(--foreground)] truncate tracking-tight"
              title={docA.name}
            >
              {docA.name}
            </h3>
          </div>

          {/* Divider & Bottom: Format, Pages, Size */}
          <div className="flex items-center justify-between gap-2 pt-3 border-t border-[var(--border-muted)] text-[11px] font-mono text-[var(--foreground-muted)]">
            <div className="flex items-center gap-2 truncate min-w-0">
              <span className="font-semibold text-[var(--foreground-secondary)]">{docA.type}</span>
              <span aria-hidden="true">&bull;</span>
              <span>{docA.pageCount || 1} pages</span>
              <span aria-hidden="true">&bull;</span>
              <span>{(docA.sizeBytes / (1024 * 1024)).toFixed(1)} MB</span>
            </div>
            <span className="shrink-0 text-[11px] text-[var(--foreground-muted)] font-sans">
              Original Version
            </span>
          </div>
        </Card>

        {/* Document B Card (Comparison Target - Ephemeral Upload) */}
        <Card
          density="compact"
          className={`p-4 sm:p-5 relative overflow-hidden flex flex-col justify-between h-full space-y-3.5 shadow-2xs rounded-[var(--radius-lg)] transition-colors ${
            docB
              ? "bg-[var(--surface)] border-[var(--primary)]/40"
              : "bg-[var(--surface-subtle)] border-dashed border-2 border-[var(--border-strong)]"
          }`}
        >
          {docB ? (
            /* Document B Ready State */
            <>
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
                      Comparison Target
                    </Badge>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={onReplaceDocB}
                  leftIcon={<RefreshCw className="h-3 w-3" />}
                  className="text-xs shrink-0"
                >
                  Replace Document
                </Button>
              </div>

              {/* Middle: Document Filename */}
              <div className="min-w-0 py-1">
                <h3
                  className="text-sm sm:text-base font-semibold text-[var(--foreground)] truncate tracking-tight text-[var(--primary)]"
                  title={docB.name}
                >
                  {docB.name}
                </h3>
              </div>

              {/* Divider & Bottom: Format, Pages, Size */}
              <div className="flex items-center justify-between gap-2 pt-3 border-t border-[var(--border-muted)] text-[11px] font-mono text-[var(--foreground-muted)]">
                <div className="flex items-center gap-2 truncate min-w-0">
                  <span className="font-semibold text-[var(--primary)]">{docB.type}</span>
                  <span aria-hidden="true">&bull;</span>
                  <span>{docB.pageCount || 1} pages</span>
                  <span aria-hidden="true">&bull;</span>
                  <span>{(docB.sizeBytes / (1024 * 1024)).toFixed(1)} MB</span>
                </div>
                <span className="shrink-0 text-[var(--primary)] font-sans font-medium text-xs">
                  Target Version
                </span>
              </div>
            </>
          ) : (
            /* Document B Empty State */
            <div className="flex flex-col justify-between h-full py-1 space-y-3 text-center sm:text-left">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--surface-muted)] text-[var(--foreground-muted)]">
                    <UploadCloud className="h-4.5 w-4.5" aria-hidden="true" />
                  </div>
                  <span className="text-[11px] font-mono uppercase font-semibold text-[var(--foreground-muted)] tracking-wider">
                    Document B
                  </span>
                </div>
                <Badge variant="neutral" size="sm">
                  Fresh Upload Needed
                </Badge>
              </div>

              <div className="space-y-1 py-1">
                <h4 className="text-sm font-semibold text-[var(--foreground)]">
                  No second document selected
                </h4>
                <p className="text-xs text-[var(--foreground-muted)] leading-relaxed">
                  Upload a revised contract, counterpart, or amendment to compare side-by-side with {docA.name}.
                </p>
              </div>

              <div className="pt-2 border-t border-[var(--border-muted)] flex items-center justify-start">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={onUploadDocB}
                  disabled={isProcessingB}
                  leftIcon={<UploadCloud className="h-3.5 w-3.5" />}
                  className="w-full sm:w-auto text-xs justify-center"
                >
                  Upload Second Document
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Central VS Badge */}
      <div className="hidden md:flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none">
        <div className="h-7 w-7 rounded-full bg-[var(--surface)] border border-[var(--border-strong)] shadow-sm flex items-center justify-center font-mono font-bold text-[10px] text-[var(--foreground-muted)]">
          VS
        </div>
      </div>
    </div>
  );
}
