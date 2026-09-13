"use client";

import * as React from "react";
import {
  ArrowRight,
  ExternalLink,
  Sparkles,
  CheckSquare,
  FileText,
  AlertTriangle,
  Info,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ComparisonChange } from "@/types";

export interface ComparisonChangeCardProps {
  change: ComparisonChange;
  onViewEvidence: (change: ComparisonChange) => void;
  onAddToActionCenter?: (change: ComparisonChange) => void;
}

export function ComparisonChangeCard({
  change,
  onViewEvidence,
  onAddToActionCenter,
}: ComparisonChangeCardProps) {
  // Mobile tab toggle: "a" vs "b" vs "both"
  const [mobileTab, setMobileTab] = React.useState<"a" | "b">("b");
  const [addedToAction, setAddedToAction] = React.useState(false);

  const severityBadge = (sev: string) => {
    switch (sev) {
      case "major":
        return (
          <Badge variant="warning" size="sm" dot>
            Major Change
          </Badge>
        );
      case "moderate":
        return (
          <Badge variant="brand" size="sm" dot>
            Moderate Change
          </Badge>
        );
      default:
        return (
          <Badge variant="neutral" size="sm">
            Minor Change
          </Badge>
        );
    }
  };

  const handleAddToActions = () => {
    onAddToActionCenter?.(change);
    setAddedToAction(true);
    setTimeout(() => setAddedToAction(false), 3000);
  };

  return (
    <Card
      density="spacious"
      className="bg-[var(--surface)] border-[var(--border)] hover:border-[var(--border-strong)] transition-all space-y-4 text-left shadow-2xs"
    >
      {/* 1. Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[var(--border-muted)]">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold text-[var(--primary)] px-2 py-0.5 rounded bg-[var(--surface-muted)]">
              {change.sectionA}
            </span>
            <h3 className="text-sm sm:text-base font-semibold text-[var(--foreground)]">
              {change.clauseTitle}
            </h3>
          </div>
          <p className="text-xs text-[var(--foreground-muted)] font-mono">
            Source: Doc A ({change.sectionA}, p.{change.pageA}) &rarr; Doc B ({change.sectionB}, p.{change.pageB})
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="neutral" size="sm">
            {change.category}
          </Badge>
          {severityBadge(change.changeSeverity)}
        </div>
      </div>

      {/* 2. Change Summary Banner */}
      <div className="p-3 rounded-[var(--radius-md)] bg-[var(--surface-muted)] border border-[var(--border)] flex items-start gap-2 text-xs">
        <div className="p-1 rounded bg-[var(--primary)]/10 text-[var(--primary)] shrink-0 mt-0.5">
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </div>
        <div>
          <span className="font-semibold text-[var(--foreground)] mr-1">Summary of Change:</span>
          <span className="text-[var(--foreground-secondary)] font-medium leading-relaxed">
            {change.summaryChange}
          </span>
        </div>
      </div>

      {/* 3. Mobile View Switcher (< md) */}
      <div className="md:hidden flex items-center justify-center gap-2 bg-[var(--surface-subtle)] p-1 rounded-[var(--radius-md)] border border-[var(--border)] text-xs">
        <button
          type="button"
          onClick={() => setMobileTab("a")}
          className={`flex-1 py-1 rounded text-center font-medium transition-colors ${
            mobileTab === "a"
              ? "bg-[var(--surface)] text-[var(--foreground)] shadow-xs font-semibold"
              : "text-[var(--foreground-muted)]"
          }`}
        >
          Document A (Original)
        </button>
        <button
          type="button"
          onClick={() => setMobileTab("b")}
          className={`flex-1 py-1 rounded text-center font-medium transition-colors ${
            mobileTab === "b"
              ? "bg-[var(--primary)] text-white shadow-xs font-semibold"
              : "text-[var(--foreground-muted)]"
          }`}
        >
          Document B (Updated)
        </button>
      </div>

      {/* 4. Two-Column Visual Diff (Desktop) & Mobile Toggle */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        {/* Document A Column */}
        <div
          className={`p-3.5 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-subtle)] space-y-2 ${
            mobileTab === "b" ? "hidden md:block" : "block"
          }`}
        >
          <div className="flex items-center justify-between text-[11px] font-semibold text-[var(--foreground-muted)]">
            <span className="flex items-center gap-1">
              <FileText className="h-3 w-3 text-red-500" />
              Document A (Original)
            </span>
            <span className="font-mono">Page {change.pageA}</span>
          </div>

          <p className="text-xs text-[var(--foreground-secondary)] leading-relaxed italic border-l-2 border-red-400/50 pl-2.5">
            &ldquo;{change.docAContent}&rdquo;
          </p>
        </div>

        {/* Document B Column */}
        <div
          className={`p-3.5 rounded-[var(--radius-lg)] border border-[var(--primary)]/30 bg-blue-50/40 dark:bg-blue-950/20 space-y-2 ${
            mobileTab === "a" ? "hidden md:block" : "block"
          }`}
        >
          <div className="flex items-center justify-between text-[11px] font-semibold text-[var(--primary)]">
            <span className="flex items-center gap-1">
              <FileText className="h-3 w-3 text-[var(--primary)]" />
              Document B (Updated)
            </span>
            <span className="font-mono">Page {change.pageB}</span>
          </div>

          <p className="text-xs text-[var(--foreground)] leading-relaxed italic border-l-2 border-[var(--primary)] pl-2.5 font-medium">
            &ldquo;{change.docBContent}&rdquo;
          </p>
        </div>
      </div>

      {/* 5. Legal Risk & Context */}
      {change.whyItMatters && (
        <div className="p-3 rounded-[var(--radius-md)] bg-[var(--surface-subtle)] border border-[var(--border-muted)] space-y-1 text-xs">
          <div className="flex items-center gap-1.5 font-semibold text-[var(--foreground)]">
            <Info className="h-3.5 w-3.5 text-[var(--primary)] shrink-0" aria-hidden="true" />
            <span>Why It Matters &amp; Review Context:</span>
          </div>
          <p className="text-[11px] text-[var(--foreground-secondary)] leading-relaxed pl-5">
            {change.whyItMatters}
          </p>
        </div>
      )}

      {/* 6. Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[var(--border-muted)] text-xs">
        <button
          type="button"
          onClick={() => onViewEvidence(change)}
          className="inline-flex items-center gap-1 text-[var(--primary)] hover:underline font-medium cursor-pointer"
        >
          <ExternalLink className="h-3 w-3" />
          <span>View Side-by-Side Evidence</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Ask About This Change (navigates to Q&A) */}
          <Button
            href={`/qa?q=${encodeURIComponent(`Why did the ${change.clauseTitle} change between Document A and B?`)}`}
            variant="outline"
            size="sm"
            leftIcon={<Sparkles className="h-3 w-3 text-[var(--primary)]" />}
            className="text-xs"
          >
            Ask About Change
          </Button>

          {/* Add to Action Center */}
          <Button
            variant={addedToAction ? "secondary" : "ghost"}
            size="sm"
            onClick={handleAddToActions}
            leftIcon={<CheckSquare className="h-3 w-3" />}
            className="text-xs"
          >
            {addedToAction ? "Added to Actions!" : "Add to Action Center"}
          </Button>
        </div>
      </div>
    </Card>
  );
}
