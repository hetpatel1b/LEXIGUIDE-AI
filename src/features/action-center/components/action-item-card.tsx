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
      className={`bg-[var(--surface)] border-[var(--border)] transition-all space-y-3.5 text-left shadow-2xs ${
        item.isChecked ? "opacity-75 bg-[var(--surface-subtle)]" : "hover:border-[var(--border-strong)]"
      }`}
    >
      {/* Top Header Row with Checkbox & Status */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          {/* Accessible Checkbox */}
          <button
            type="button"
            role="checkbox"
            aria-checked={item.isChecked}
            aria-label={`Mark "${item.title}" as reviewed`}
            onClick={() => onToggleCheck(item.id)}
            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-[var(--radius-sm)] border transition-all cursor-pointer mt-0.5 ${
              item.isChecked
                ? "bg-[var(--primary)] border-[var(--primary)] text-white shadow-xs"
                : "border-[var(--border-strong)] bg-[var(--background)] hover:border-[var(--primary)]"
            }`}
          >
            {item.isChecked && <Check className="h-3.5 w-3.5 stroke-[2.5]" />}
          </button>

          <div className="min-w-0 space-y-0.5">
            <div className="flex items-center gap-2">
              <h3
                className={`text-sm font-semibold tracking-tight ${
                  item.isChecked
                    ? "line-through text-[var(--foreground-muted)]"
                    : "text-[var(--foreground)]"
                }`}
              >
                {item.title}
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--foreground-muted)] font-mono">
              {item.sourceSection && (
                <span>{item.sourceSection} · Page {item.pageNumber}</span>
              )}
              {item.dueDate && (
                <>
                  <span aria-hidden="true">&bull;</span>
                  <span className="flex items-center gap-1 text-[var(--primary)] font-medium">
                    <Calendar className="h-3 w-3" />
                    Target: {item.dueDate}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-1.5">
          {item.isChecked ? (
            <Badge variant="success" size="sm" dot>
              Reviewed
            </Badge>
          ) : (
            getCategoryBadge(item.category)
          )}
        </div>
      </div>

      {/* Description */}
      <p className="text-xs text-[var(--foreground-secondary)] leading-relaxed pl-8">
        {item.description}
      </p>

      {/* Why It Matters */}
      {item.whyItMatters && (
        <div className="ml-8 p-3 rounded-[var(--radius-md)] bg-[var(--surface-muted)] border border-[var(--border-muted)] space-y-1 text-xs">
          <div className="flex items-center gap-1.5 font-semibold text-[var(--foreground)]">
            <Info className="h-3.5 w-3.5 text-[var(--primary)] shrink-0" aria-hidden="true" />
            <span>Why This Matters:</span>
          </div>
          <p className="text-[11px] text-[var(--foreground-secondary)] leading-relaxed pl-5">
            {item.whyItMatters}
          </p>
        </div>
      )}

      {/* Suggested Question for Legal Advocate (if in discuss category) */}
      {item.suggestedQuestion && (
        <div className="ml-8 p-3 rounded-[var(--radius-md)] bg-blue-50/50 border border-blue-200/60 space-y-2 text-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold text-blue-950 flex items-center gap-1.5">
              <HelpCircle className="h-3.5 w-3.5 text-[var(--primary)]" />
              Suggested Question for Legal Advisor:
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyQuestion}
              className="text-[11px] h-6 px-2"
            >
              {copiedQuestion ? "Copied!" : "Copy Question"}
            </Button>
          </div>

          <p className="italic text-[11px] text-blue-900 leading-relaxed font-serif pl-2 border-l-2 border-[var(--primary)]">
            &ldquo;{item.suggestedQuestion}&rdquo;
          </p>
        </div>
      )}

      {/* Footer Actions */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[var(--border-muted)] text-xs pl-8">
        {item.evidenceSnippet ? (
          <button
            type="button"
            onClick={() => onViewEvidence(item)}
            className="inline-flex items-center gap-1 text-[var(--primary)] hover:underline font-medium cursor-pointer"
          >
            <ExternalLink className="h-3 w-3" />
            <span>View Source Clause</span>
          </button>
        ) : (
          <span />
        )}

        <div className="flex items-center gap-2">
          {/* Discuss with Copilot */}
          <Button
            href={`/qa?q=${encodeURIComponent(item.suggestedQuestion || item.title)}`}
            variant="outline"
            size="sm"
            leftIcon={<Sparkles className="h-3 w-3 text-[var(--primary)]" />}
            className="text-xs"
          >
            Discuss with Copilot
          </Button>
        </div>
      </div>
    </Card>
  );
}
