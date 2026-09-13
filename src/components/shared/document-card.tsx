import * as React from "react";
import { FileText, FileCode, File, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { DocumentType, ProcessingStatus } from "@/types";

export interface DocumentCardProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string;
  type: DocumentType;
  sizeBytes: number;
  pageCount?: number;
  status?: ProcessingStatus;
  isSelected?: boolean;
  density?: "spacious" | "compact";
  onSelect?: () => void;
}

export function DocumentCard({
  name,
  type,
  sizeBytes,
  pageCount,
  status = "uploaded",
  isSelected = false,
  density = "spacious",
  onSelect,
  className,
  ...props
}: DocumentCardProps) {
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const typeConfig = {
    pdf: {
      icon: <FileText className="h-5 w-5 text-red-500 dark:text-red-400" aria-hidden="true" />,
      badge: "PDF",
      badgeColor: "danger" as const,
    },
    docx: {
      icon: <File className="h-5 w-5 text-blue-500 dark:text-blue-400" aria-hidden="true" />,
      badge: "DOCX",
      badgeColor: "brand" as const,
    },
    txt: {
      icon: <FileCode className="h-5 w-5 text-slate-500 dark:text-slate-400" aria-hidden="true" />,
      badge: "TXT",
      badgeColor: "neutral" as const,
    },
  };

  const statusConfig = {
    pending: { label: "Pending", variant: "neutral" as const, icon: Clock },
    uploading: { label: "Uploading", variant: "brand" as const, icon: Clock },
    uploaded: { label: "Uploaded", variant: "brand" as const, icon: CheckCircle2 },
    processing: { label: "Processing", variant: "info" as const, icon: Clock },
    analyzed: { label: "Analyzed", variant: "success" as const, icon: CheckCircle2 },
    failed: { label: "Failed", variant: "danger" as const, icon: AlertCircle },
  };

  const typeInfo = typeConfig[type] || typeConfig.pdf;
  const statusInfo = statusConfig[status] || statusConfig.uploaded;

  return (
    <div
      role={onSelect ? "button" : undefined}
      tabIndex={onSelect ? 0 : undefined}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (onSelect && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onSelect();
        }
      }}
      className={cn(
        "group relative flex items-center justify-between rounded-[var(--radius-lg)] border bg-[var(--surface)] transition-all duration-150 text-[var(--foreground)]",
        density === "compact" ? "p-3 gap-3" : "p-4 gap-4",
        isSelected
          ? "border-[var(--primary)] ring-1 ring-[var(--primary)] bg-[var(--surface-subtle)]"
          : "border-[var(--border)] hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-subtle)]",
        onSelect && "cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--surface-muted)] border border-[var(--border-muted)]">
          {typeInfo.icon}
        </div>

        <div className="min-w-0 text-left">
          <p className="text-sm font-medium text-[var(--foreground)] truncate max-w-[220px] sm:max-w-xs" title={name}>
            {name}
          </p>
          <div className="flex items-center gap-2 text-xs text-[var(--foreground-muted)] font-mono">
            <span>{formatSize(sizeBytes)}</span>
            {pageCount !== undefined && (
              <>
                <span aria-hidden="true">&bull;</span>
                <span>{pageCount} {pageCount === 1 ? "page" : "pages"}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Badge variant={typeInfo.badgeColor} size="sm">
          {typeInfo.badge}
        </Badge>
        <Badge variant={statusInfo.variant} size="sm" dot>
          {statusInfo.label}
        </Badge>
      </div>
    </div>
  );
}
