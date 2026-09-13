"use client";

import * as React from "react";
import { Filter } from "lucide-react";
import type { ActionCategory } from "@/types";

export interface ActionFiltersProps {
  selectedCategory: "all" | ActionCategory;
  onSelectCategory: (category: "all" | ActionCategory) => void;
  counts: Record<"all" | ActionCategory, number>;
}

export const ACTION_FILTER_OPTIONS: Array<{
  id: "all" | ActionCategory;
  label: string;
}> = [
  { id: "all", label: "All Items" },
  { id: "review", label: "Review" },
  { id: "upcoming", label: "Upcoming" },
  { id: "confirm", label: "Confirm" },
  { id: "discuss", label: "Discuss" },
];

export function ActionFilters({
  selectedCategory,
  onSelectCategory,
  counts,
}: ActionFiltersProps) {
  return (
    <div
      role="toolbar"
      aria-label="Filter action items"
      className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1.5 px-0.5 w-full -mx-0.5"
    >
      <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--foreground-muted)] mr-1 shrink-0 select-none">
        <Filter className="h-3.5 w-3.5 text-[var(--primary)]" aria-hidden="true" />
        <span>Category:</span>
      </div>

      <div className="flex items-center gap-1.5 flex-nowrap shrink-0">
        {ACTION_FILTER_OPTIONS.map((opt) => {
          const isSelected = selectedCategory === opt.id;
          const count = counts[opt.id] ?? 0;

          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onSelectCategory(opt.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap cursor-pointer shrink-0 flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] ${
                isSelected
                  ? "bg-[var(--primary)] text-white font-semibold shadow-xs"
                  : "bg-[var(--surface)] border border-[var(--border)] text-[var(--foreground-secondary)] hover:border-[var(--primary)]/60 hover:text-[var(--foreground)]"
              }`}
            >
              <span>{opt.label}</span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono leading-tight ${
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
    </div>
  );
}
