"use client";

import * as React from "react";
import { Filter } from "lucide-react";
import type { ComparisonCategory } from "@/types";

export interface ComparisonFiltersProps {
  selectedCategory: ComparisonCategory;
  onSelectCategory: (category: ComparisonCategory) => void;
  counts: Record<ComparisonCategory, number>;
}

export const COMPARISON_FILTER_OPTIONS: ComparisonCategory[] = [
  "All",
  "Major Changes",
  "Moderate Changes",
  "Unchanged",
  "Financial",
  "Obligations",
  "Dates",
  "Risks",
];

export function ComparisonFilters({
  selectedCategory,
  onSelectCategory,
  counts,
}: ComparisonFiltersProps) {
  return (
    <div
      role="toolbar"
      aria-label="Filter comparison results"
      className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1"
    >
      <div className="flex items-center gap-1 text-xs font-semibold text-[var(--foreground-muted)] mr-1 shrink-0">
        <Filter className="h-3.5 w-3.5" aria-hidden="true" />
        <span>Filter:</span>
      </div>

      {COMPARISON_FILTER_OPTIONS.map((cat) => {
        const isSelected = selectedCategory === cat;
        const count = counts[cat] ?? 0;

        return (
          <button
            key={cat}
            type="button"
            onClick={() => onSelectCategory(cat)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              isSelected
                ? "bg-[var(--primary)] text-white font-semibold shadow-xs"
                : "bg-[var(--surface)] border border-[var(--border)] text-[var(--foreground-secondary)] hover:border-[var(--primary)]/60 hover:text-[var(--foreground)]"
            }`}
          >
            <span>{cat}</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
                isSelected
                  ? "bg-white/20 text-white"
                  : "bg-[var(--surface-muted)] text-[var(--foreground-muted)]"
              }`}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
