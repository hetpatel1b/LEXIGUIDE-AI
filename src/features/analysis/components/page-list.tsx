"use client";

import * as React from "react";
import { BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { DOCUMENT_PAGES } from "../fixtures/analysis-fixture";

export interface PageListProps {
  selectedPage?: number;
  onSelectPage?: (pageNumber: number) => void;
  className?: string;
}

export function PageList({
  selectedPage = 1,
  onSelectPage,
  className,
}: PageListProps) {
  return (
    <div className={cn("space-y-2 text-left", className)}>
      <div className="flex items-center justify-between pb-1 border-b border-[var(--border-muted)]">
        <span className="font-semibold text-[11px] uppercase tracking-wider text-[var(--foreground-muted)] flex items-center gap-1.5">
          <BookOpen className="h-3 w-3" aria-hidden="true" />
          Page Navigator
        </span>
        <span className="text-[10px] text-[var(--foreground-muted)]">
          18 Pages
        </span>
      </div>

      <div className="grid grid-cols-6 sm:grid-cols-6 gap-1.5 max-h-36 overflow-y-auto pr-1">
        {DOCUMENT_PAGES.map((page) => {
          const isSelected = selectedPage === page.pageNumber;
          return (
            <button
              key={page.pageNumber}
              type="button"
              onClick={() => onSelectPage?.(page.pageNumber)}
              title={`${page.title} — ${page.subtitle}`}
              aria-label={`Jump to page ${page.pageNumber}`}
              className={cn(
                "flex flex-col items-center justify-center h-8 rounded-[var(--radius-md)] border text-xs font-mono transition-colors cursor-pointer",
                isSelected
                  ? "bg-[var(--primary)] text-white border-[var(--primary)] font-bold shadow-[var(--shadow-subtle)] ring-2 ring-[var(--focus-ring)]/30"
                  : "border-[var(--border)] bg-[var(--surface)] text-[var(--foreground-secondary)] hover:border-[var(--primary)]/60 hover:text-[var(--foreground)]"
              )}
            >
              {page.pageNumber}
            </button>
          );
        })}
      </div>
    </div>
  );
}
