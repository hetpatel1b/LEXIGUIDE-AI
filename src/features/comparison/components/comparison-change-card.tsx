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
      className="bg-[var(--surface)] border-[var(--border)] hover:border-[var(--border-strong)] transition-all p-4 sm:p-5 lg:p-6 rounded-[var(--radius-xl)] space-y-4 text-left shadow-2xs w-full"
    >
      {/* 1. Header: Section, Title, Source Information + Category & Severity Badges */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-3 pb-3.5 border-b border-[var(--border-muted)]">
        <div className="space-y-1.5 min-w-0 flex-1 pr-2">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="font-mono text-xs font-bold text-[var(--primary)] px-2.5 py-0.5 rounded-md bg-[var(--primary)]/10 shrink-0">
              {change.sectionA}
            </span>
            <h3 className="text-sm sm:text-base font-bold text-[var(--foreground)] tracking-tight">
              {change.clauseTitle}
            </h3>
          </div>
          <p className="text-xs text-[var(--foreground-muted)] font-mono leading-relaxed break-words">
            Source: Doc A ({change.sectionA}, p.{change.pageA}) &rarr; Doc B ({change.sectionB}, p.{change.pageB})
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-start md:self-auto flex-wrap">
          <Badge variant="neutral" size="sm">
            {change.category}
          </Badge>
          {severityBadge(change.changeSeverity)}
        </div>
      </div>

      {/* 2. Summary of Change Banner */}
      <div className="p-3 sm:p-3.5 rounded-[var(--radius-lg)] bg-[var(--surface-muted)] border border-[var(--border)] flex items-start gap-2.5 text-xs">
        <div className="p-1 rounded-md bg-[var(--primary)]/10 text-[var(--primary)] shrink-0 mt-0.5 flex items-center justify-center">
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </div>
        <div className="min-w-0 leading-relaxed">
          <span className="font-semibold text-[var(--foreground)] mr-1.5">Summary of Change:</span>
          <span className="text-[var(--foreground-secondary)] font-medium">
            {change.summaryChange}
          </span>
        </div>
      </div>

      {/* 3. Mobile View Switcher (< md) */}
      <div className="md:hidden flex items-center justify-center gap-1.5 bg-[var(--surface-muted)] p-1 rounded-[var(--radius-lg)] border border-[var(--border)] text-xs">
        <button
          type="button"
          onClick={() => setMobileTab("a")}
          className={`flex-1 py-1.5 px-2 rounded-md text-center font-medium transition-colors ${
            mobileTab === "a"
              ? "bg-[var(--surface)] text-[var(--foreground)] shadow-xs font-semibold"
              : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
          }`}
        >
          Document A (Original)
        </button>
        <button
          type="button"
          onClick={() => setMobileTab("b")}
          className={`flex-1 py-1.5 px-2 rounded-md text-center font-medium transition-colors ${
            mobileTab === "b"
              ? "bg-[var(--primary)] text-white shadow-xs font-semibold"
              : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
          }`}
        >
          Document B (Updated)
        </button>
      </div>

      {/* 4. Side-by-Side Evidence Panels (Desktop) & Mobile Toggle */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4 lg:gap-5 text-xs items-stretch w-full">
        {/* Document A Column */}
        <div
          className={`p-3.5 sm:p-4 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-subtle)] flex flex-col justify-between space-y-2.5 h-full ${
            mobileTab === "b" ? "hidden md:flex" : "flex"
          }`}
        >
          <div className="flex items-center justify-between gap-2 text-[11px] font-semibold text-[var(--foreground-muted)] pb-2 border-b border-[var(--border-muted)]">
            <span className="flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-red-500 shrink-0" aria-hidden="true" />
              <span>Document A (Original)</span>
            </span>
            <span className="font-mono text-[var(--foreground-muted)]">Page {change.pageA}</span>
          </div>

          <div className="flex-1 py-1">
            <p className="text-xs text-[var(--foreground-secondary)] leading-relaxed italic font-serif border-l-2 border-red-400 dark:border-red-500/60 pl-3 py-0.5">
              &ldquo;{change.docAContent}&rdquo;
            </p>
          </div>
        </div>

        {/* Document B Column */}
        <div
          className={`p-3.5 sm:p-4 rounded-[var(--radius-lg)] border border-[var(--primary)]/30 bg-blue-50/40 dark:bg-blue-950/20 flex flex-col justify-between space-y-2.5 h-full ${
            mobileTab === "a" ? "hidden md:flex" : "flex"
          }`}
        >
          <div className="flex items-center justify-between gap-2 text-[11px] font-semibold text-[var(--primary)] pb-2 border-b border-[var(--primary)]/20">
            <span className="flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-[var(--primary)] shrink-0" aria-hidden="true" />
              <span>Document B (Updated)</span>
            </span>
            <span className="font-mono text-[var(--foreground-muted)]">Page {change.pageB}</span>
          </div>

          <div className="flex-1 py-1">
            <p className="text-xs text-[var(--foreground)] leading-relaxed italic font-serif border-l-2 border-[var(--primary)] pl-3 py-0.5 font-medium">
              &ldquo;{change.docBContent}&rdquo;
            </p>
          </div>
        </div>
      </div>

      {/* 5. Why It Matters & Review Context */}
      {change.whyItMatters && (
        <div className="p-3 sm:p-3.5 rounded-[var(--radius-lg)] bg-[var(--surface-subtle)] border border-[var(--border-muted)] space-y-1.5 text-xs">
          <div className="flex items-center gap-2 font-semibold text-[var(--foreground)]">
            <Info className="h-4 w-4 text-[var(--primary)] shrink-0" aria-hidden="true" />
            <span>Why It Matters &amp; Review Context:</span>
          </div>
          <p className="text-xs text-[var(--foreground-secondary)] leading-relaxed pl-6 max-w-4xl">
            {change.whyItMatters}
          </p>
        </div>
      )}

      {/* 6. Bottom Action Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[var(--border-muted)] text-xs">
        <button
          type="button"
          onClick={() => onViewEvidence(change)}
          className="inline-flex items-center gap-1.5 text-[var(--primary)] hover:underline font-semibold cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] rounded py-1"
        >
          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          <span>View Side-by-Side Evidence</span>
        </button>

        <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
          <Button
            href={`/qa?q=${encodeURIComponent(`Why did the ${change.clauseTitle} change between Document A and B?`)}`}
            variant="outline"
            size="sm"
            leftIcon={<Sparkles className="h-3 w-3 text-[var(--primary)]" />}
            className="text-xs shrink-0"
          >
            Ask About Change
          </Button>

          <Button
            variant={addedToAction ? "secondary" : "ghost"}
            size="sm"
            onClick={handleAddToActions}
            leftIcon={<CheckSquare className="h-3 w-3" />}
            className="text-xs shrink-0"
          >
            {addedToAction ? "Added to Actions!" : "Add to Action Center"}
          </Button>
        </div>
      </div>
    </Card>
  );
}
