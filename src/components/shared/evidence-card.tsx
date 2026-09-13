import * as React from "react";
import { Quote, BookOpen, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface EvidenceCardProps extends React.HTMLAttributes<HTMLDivElement> {
  excerpt: string;
  documentTitle?: string;
  pageNumber?: number;
  sectionTitle?: string;
  onViewSource?: () => void;
}

export function EvidenceCard({
  excerpt,
  documentTitle,
  pageNumber,
  sectionTitle,
  onViewSource,
  className,
  ...props
}: EvidenceCardProps) {
  return (
    <div
      className={cn(
        "relative rounded-[var(--radius-lg)] border border-slate-200 bg-slate-50/70 p-4 text-left transition-all duration-150 hover:border-slate-300",
        className
      )}
      {...props}
    >
      {/* Grounding Source Header */}
      <div className="flex items-center justify-between gap-2 mb-2.5 pb-2 border-b border-slate-200/60">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-brand-blue)]">
          <BookOpen className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>Grounded Source Citation</span>
        </div>

        <div className="flex items-center gap-1.5 font-mono text-[11px] text-[var(--foreground-muted)]">
          {pageNumber !== undefined && (
            <Badge variant="neutral" size="sm">
              Page {pageNumber}
            </Badge>
          )}
          {sectionTitle && (
            <span className="hidden sm:inline-block truncate max-w-[150px]" title={sectionTitle}>
              {sectionTitle}
            </span>
          )}
        </div>
      </div>

      {/* Verbatim Excerpt */}
      <div className="relative pl-3 border-l-2 border-[var(--color-brand-blue)]/50 my-2">
        <p className="text-xs sm:text-sm text-[var(--foreground-secondary)] italic leading-relaxed">
          &ldquo;{excerpt}&rdquo;
        </p>
      </div>

      {/* Footer / Context */}
      <div className="flex items-center justify-between pt-2 mt-2 text-[11px] text-[var(--foreground-muted)]">
        {documentTitle ? (
          <span className="truncate max-w-[200px]" title={documentTitle}>
            Doc: {documentTitle}
          </span>
        ) : (
          <span />
        )}

        {onViewSource && (
          <button
            onClick={onViewSource}
            className="inline-flex items-center gap-1 text-[var(--primary)] hover:underline font-medium cursor-pointer"
          >
            <span>Jump to text</span>
            <ExternalLink className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
}
