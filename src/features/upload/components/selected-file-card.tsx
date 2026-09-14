"use client";

import * as React from "react";
import { FileText, File, FileCode, Trash2, CheckCircle2, Sparkles, Loader2, ArrowRight } from "lucide-react";
import { Button, IconButton, Badge } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { DocumentType } from "@/types";

export interface SelectedFileCardProps {
  file: File;
  onRemove: () => void;
  isProcessing?: boolean;
  processingStageMessage?: string;
  isSuccess?: boolean;
  processedStats?: {
    sections: number;
    chunks: number;
    pages: number | null;
  };
  onStartProcessing?: () => void;
  onNavigateToAnalysis?: () => void;
  className?: string;
}

export function SelectedFileCard({
  file,
  onRemove,
  isProcessing = false,
  processingStageMessage,
  isSuccess = false,
  processedStats,
  onStartProcessing,
  onNavigateToAnalysis,
  className,
}: SelectedFileCardProps) {
  const getDocumentType = (fileName: string): DocumentType => {
    const ext = fileName.split(".").pop()?.toLowerCase();
    if (ext === "pdf") return "pdf";
    if (ext === "docx") return "docx";
    return "txt";
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const docType = getDocumentType(file.name);

  const typeConfig = {
    pdf: {
      icon: <FileText className="h-6 w-6 text-red-500" aria-hidden="true" />,
      badge: "PDF",
      badgeVariant: "danger" as const,
    },
    docx: {
      icon: <File className="h-6 w-6 text-blue-500" aria-hidden="true" />,
      badge: "DOCX",
      badgeVariant: "brand" as const,
    },
    txt: {
      icon: <FileCode className="h-6 w-6 text-slate-500" aria-hidden="true" />,
      badge: "TXT",
      badgeVariant: "neutral" as const,
    },
  };

  const currentType = typeConfig[docType];

  return (
    <div
      role="region"
      aria-label="Selected document preview"
      className={cn(
        "rounded-[var(--radius-xl)] border border-[var(--primary)]/40 bg-[var(--surface)] p-4 xs:p-6 sm:p-8 shadow-[var(--shadow-md)] text-[var(--foreground)] space-y-4 sm:space-y-6 transition-all",
        className
      )}
    >
      {/* File Information Row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <div className="flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-muted)] border border-[var(--border)]">
            {currentType.icon}
          </div>

          <div className="min-w-0 text-left space-y-0.5">
            <h4
              className="text-sm sm:text-base font-semibold text-[var(--foreground)] truncate max-w-[180px] xs:max-w-[240px] sm:max-w-md"
              title={file.name}
            >
              {file.name}
            </h4>

            <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--foreground-muted)] font-mono">
              <Badge variant={currentType.badgeVariant} size="sm">
                {currentType.badge}
              </Badge>
              <span>{formatSize(file.size)}</span>
              <span aria-hidden="true">&bull;</span>
              {isProcessing ? (
                <span className="inline-flex items-center gap-1 text-[var(--primary)] font-sans font-medium">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Processing Document...
                </span>
              ) : isSuccess ? (
                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-sans font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Ingestion Complete
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-sans font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Validated &amp; Ready
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Remove Action */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <IconButton
            size="sm"
            variant="ghost"
            onClick={onRemove}
            disabled={isProcessing}
            aria-label="Remove selected document"
            className="text-[var(--danger)] hover:bg-red-50 dark:hover:bg-red-950/30 min-h-[36px] min-w-[36px] disabled:opacity-40 disabled:cursor-not-allowed"
            title="Remove file"
          >
            <Trash2 className="h-4 w-4" />
          </IconButton>
        </div>
      </div>

      {/* Analysis Action & Phase Notice */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-[var(--border-muted)]">
        <div className="text-xs text-[var(--foreground-muted)] text-left">
          {isProcessing ? (
            <>
              <p className="font-medium text-[var(--primary)] animate-pulse">
                {processingStageMessage || "Extracting text, detecting sections, and chunking..."}
              </p>
              <p className="text-[11px]">
                Deterministic extraction running server-side. Preserving source page boundaries.
              </p>
            </>
          ) : isSuccess && processedStats ? (
            <>
              <p className="font-medium text-[var(--foreground-secondary)]">
                Document successfully normalized
              </p>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono">
                {processedStats.sections} sections detected &bull; {processedStats.chunks} retrieval chunks
                {processedStats.pages ? ` • ${processedStats.pages} pages` : ""}
              </p>
            </>
          ) : (
            <>
              <p className="font-medium text-[var(--foreground-secondary)]">
                Document ready for ingestion
              </p>
              <p className="text-[11px]">
                Real document engine extracts text, maps pages, discovers sections, and chunks content.
              </p>
            </>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRemove}
            disabled={isProcessing}
            className="w-full sm:w-auto justify-center"
          >
            Select Different File
          </Button>

          {isSuccess ? (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={onNavigateToAnalysis}
              rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
              className="w-full sm:w-auto justify-center bg-emerald-600 hover:bg-emerald-700"
            >
              Open in Analysis Workspace
            </Button>
          ) : (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={onStartProcessing}
              disabled={isProcessing}
              leftIcon={
                isProcessing ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )
              }
              className="w-full sm:w-auto justify-center"
            >
              {isProcessing ? "Processing Document..." : "Start Analysis"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
