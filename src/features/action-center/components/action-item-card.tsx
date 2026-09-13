"use client";

import * as React from "react";
import {
  Check,
  Calendar,
  Sparkles,
  ExternalLink,
  Copy,
  Info,
  HelpCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ActionItem } from "@/types";

export interface ActionItemCardProps {
  item: ActionItem;
  onToggleCheck: (id: string) => void;
  onViewEvidence: (item: ActionItem) => void;
}

export function ActionItemCard({
  item,
  onToggleCheck,
  onViewEvidence,
}: ActionItemCardProps) {
  const [copiedQuestion, setCopiedQuestion] = React.useState(false);

  const handleCopyQuestion = async () => {
    if (!item.suggestedQuestion) return;
    try {
      await navigator.clipboard.writeText(item.suggestedQuestion);
      setCopiedQuestion(true);
      setTimeout(() => setCopiedQuestion(false), 2000);
    } catch {
      setCopiedQuestion(true);
      setTimeout(() => setCopiedQuestion(false), 2000);
    }
  };

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case "review":
        return <Badge variant="warning" size="sm">Needs Review</Badge>;
      case "upcoming":
        return <Badge variant="brand" size="sm">Upcoming Date</Badge>;
      case "confirm":
        return <Badge variant="neutral" size="sm">Confirm Term</Badge>;
      case "discuss":
        return <Badge variant="brand" size="sm">Discuss with Advocate</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card
      density="spacious"
      className={`bg-[var(--surface)] border-[var(--border)] transition-all p-4 sm:p-5 rounded-[var(--radius-xl)] space-y-3.5 text-left shadow-2xs w-full ${
        item.isChecked
          ? "bg-[var(--surface-subtle)] border-[var(--border-muted)]"
          : "hover:border-[var(--border-strong)]"
      }`}
    >
      {/* 1. Header Row: Checkbox, Title, Metadata & Status Badge */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-1">
        <div className="flex items-start gap-2.5 sm:gap-3 min-w-0 flex-1">
          {/* Accessible Checkbox */}
          <button
            type="button"
            role="checkbox"
            aria-checked={item.isChecked}
            aria-label={`Mark "${item.title}" as reviewed`}
            onClick={() => onToggleCheck(item.id)}
            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-[var(--radius-sm)] border transition-all cursor-pointer mt-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] ${
              item.isChecked
                ? "bg-[var(--primary)] border-[var(--primary)] text-white shadow-xs"
                : "border-[var(--border-strong)] bg-[var(--background)] hover:border-[var(--primary)]"
            }`}
          >
            {item.isChecked && <Check className="h-3.5 w-3.5 stroke-[2.5]" />}
          </button>

          <div className="min-w-0 space-y-1 flex-1 pr-1">
            <h3
              className={`text-sm sm:text-base font-semibold tracking-tight leading-snug break-words ${
                item.isChecked
                  ? "line-through text-[var(--foreground-muted)]"
                  : "text-[var(--foreground)]"
              }`}
            >
              {item.title}
            </h3>

            {/* Section / Page / Target Date Metadata */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--foreground-muted)] font-mono">
              {item.sourceSection && (
                <span>{item.sourceSection} &bull; Page {item.pageNumber}</span>
              )}
              {item.dueDate && (
                <>
                  <span aria-hidden="true">&bull;</span>
                  <span className="flex items-center gap-1 text-[var(--primary)] font-medium font-sans">
                    <Calendar className="h-3 w-3" />
                    Target: {item.dueDate}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="shrink-0 self-start sm:self-auto">
          {item.isChecked ? (
            <Badge variant="success" size="sm" dot>
              Reviewed
            </Badge>
          ) : (
            getCategoryBadge(item.category)
          )}
        </div>
      </div>

      {/* 2. Action Item Description */}
      <p className="text-xs sm:text-sm text-[var(--foreground-secondary)] leading-relaxed pl-0 sm:pl-8 max-w-4xl">
        {item.description}
      </p>

      {/* 3. Why This Matters Callout */}
      {item.whyItMatters && (
        <div className="ml-0 sm:ml-8 p-3 sm:p-3.5 rounded-[var(--radius-lg)] bg-[var(--surface-muted)] border border-[var(--border)] space-y-1.5 text-xs">
          <div className="flex items-center gap-2 font-semibold text-[var(--foreground)]">
            <Info className="h-4 w-4 text-[var(--primary)] shrink-0" aria-hidden="true" />
            <span>Why This Matters:</span>
          </div>
          <p className="text-xs text-[var(--foreground-secondary)] leading-relaxed pl-0 sm:pl-6 max-w-4xl">
            {item.whyItMatters}
          </p>
        </div>
      )}

      {/* 4. Suggested Question for Legal Advisor (if present) */}
      {item.suggestedQuestion && (
        <div className="ml-0 sm:ml-8 p-3 sm:p-3.5 rounded-[var(--radius-lg)] bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/70 dark:border-blue-900/50 space-y-2 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 font-semibold text-blue-950 dark:text-blue-100">
              <HelpCircle className="h-4 w-4 text-[var(--primary)] shrink-0" />
              <span>Suggested Question for Legal Advisor:</span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyQuestion}
              className="text-[11px] h-7 px-2.5 shrink-0 self-start sm:self-auto"
            >
              {copiedQuestion ? "Copied!" : "Copy Question"}
            </Button>
          </div>

          <p className="italic text-xs text-blue-900 dark:text-blue-200 leading-relaxed font-serif pl-3 py-0.5 border-l-2 border-[var(--primary)] max-w-4xl">
            &ldquo;{item.suggestedQuestion}&rdquo;
          </p>
        </div>
      )}

      {/* 5. Footer Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[var(--border-muted)] text-xs ml-0 sm:ml-8">
        {item.evidenceSnippet ? (
          <button
            type="button"
            onClick={() => onViewEvidence(item)}
            className="inline-flex items-center gap-1.5 text-[var(--primary)] hover:underline font-semibold cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] rounded py-1"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span>View Source Clause</span>
          </button>
        ) : (
          <span />
        )}

        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
          {/* Discuss with Copilot */}
          <Button
            href={`/qa?q=${encodeURIComponent(item.suggestedQuestion || item.title)}`}
            variant="outline"
            size="sm"
            leftIcon={<Sparkles className="h-3.5 w-3.5 text-[var(--primary)]" />}
            className="text-xs shrink-0 w-full sm:w-auto"
          >
            Discuss with Copilot
          </Button>
        </div>
      </div>
    </Card>
  );
}
