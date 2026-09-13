"use client";

import * as React from "react";
import Link from "next/link";
import { FileText, File, FileCode, Trash2, CheckCircle2, Sparkles } from "lucide-react";
import { Button, IconButton, Badge } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { DocumentType } from "@/types";

export interface SelectedFileCardProps {
  file: File;
  onRemove: () => void;
  className?: string;
}

export function SelectedFileCard({
  file,
  onRemove,
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
      icon: <FileText className="h-6 w-6 text-red-500 dark:text-red-400" aria-hidden="true" />,
      badge: "PDF",
      badgeVariant: "danger" as const,
    },
    docx: {
      icon: <File className="h-6 w-6 text-blue-500 dark:text-blue-400" aria-hidden="true" />,
      badge: "DOCX",
      badgeVariant: "brand" as const,
    },
    txt: {
      icon: <FileCode className="h-6 w-6 text-slate-500 dark:text-slate-400" aria-hidden="true" />,
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
        "rounded-[var(--radius-xl)] border border-[var(--primary)]/40 bg-[var(--surface)] p-6 sm:p-8 shadow-[var(--shadow-md)] text-[var(--foreground)] space-y-6 transition-all",
        className
      )}
    >
      {/* File Information Row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-muted)] border border-[var(--border)]">
            {currentType.icon}
          </div>

          <div className="min-w-0 text-left space-y-0.5">
            <h4
              className="text-base font-semibold text-[var(--foreground)] truncate max-w-[240px] sm:max-w-md"
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
              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-sans font-medium">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Validated &amp; Ready
              </span>
            </div>
          </div>
        </div>

        {/* Remove Action */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <IconButton
            size="sm"
            variant="ghost"
            onClick={onRemove}
            aria-label="Remove selected document"
            className="text-[var(--danger)] hover:bg-red-50 dark:hover:bg-red-950/40"
            title="Remove file"
          >
            <Trash2 className="h-4 w-4" />
          </IconButton>
        </div>
      </div>

      {/* Analysis Action & Phase Notice */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-[var(--border-muted)]">
        <div className="text-xs text-[var(--foreground-muted)] text-left">
          <p className="font-medium text-[var(--foreground-secondary)]">
            Document loaded into client workspace
          </p>
          <p className="text-[11px]">
            Ready for structured clause analysis, obligation breakdown, and grounded Q&amp;A.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRemove}
          >
            Select Different File
          </Button>

          <Link href="/analyze">
            <Button
              type="button"
              variant="primary"
              size="sm"
              leftIcon={<Sparkles className="h-3.5 w-3.5" />}
            >
              Start Analysis
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
