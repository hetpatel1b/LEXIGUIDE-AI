"use client";

import * as React from "react";
import { ListFilter, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { DOCUMENT_SECTIONS } from "../fixtures/analysis-fixture";
import type { DocumentSectionItem } from "@/types";

export interface SectionListProps {
  selectedSectionId?: string;
  onSelectSection?: (section: DocumentSectionItem) => void;
  className?: string;
}

export function SectionList({
  selectedSectionId,
  onSelectSection,
  className,
}: SectionListProps) {
  return (
    <div className={cn("space-y-2 text-left", className)}>
      <div className="flex items-center justify-between pb-1 border-b border-[var(--border-muted)]">
        <span className="font-semibold text-[11px] uppercase tracking-wider text-[var(--foreground-muted)] flex items-center gap-1.5">
          <ListFilter className="h-3 w-3" aria-hidden="true" />
          Document Sections
        </span>
        <span className="text-[10px] text-[var(--foreground-muted)]">
          {DOCUMENT_SECTIONS.length} sections
        </span>
      </div>

      <nav aria-label="Document Sections Navigation" className="space-y-0.5 max-h-56 overflow-y-auto pr-1">
        {DOCUMENT_SECTIONS.map((section) => {
          const isSelected = selectedSectionId === section.id;
          return (
            <button
              key={section.id}
              type="button"
              onClick={() => onSelectSection?.(section)}
              className={cn(
                "w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-[var(--radius-md)] text-xs text-left transition-colors cursor-pointer",
                isSelected
                  ? "bg-[var(--primary)] text-white font-medium shadow-[var(--shadow-subtle)]"
                  : "text-[var(--foreground-secondary)] hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)]"
              )}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={cn(
                    "font-mono text-[11px] shrink-0 font-medium",
                    isSelected ? "text-white/80" : "text-[var(--foreground-muted)]"
                  )}
                >
                  {section.sectionNumber}
                </span>
                <span className="truncate" title={section.title}>
                  {section.title}
                </span>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <span
                  className={cn(
                    "text-[10px] font-mono",
                    isSelected ? "text-white/80" : "text-[var(--foreground-muted)]"
                  )}
                >
                  p.{section.pageNumber}
                </span>
                <ChevronRight
                  className={cn("h-3 w-3", isSelected ? "text-white/80" : "text-[var(--foreground-muted)]")}
                  aria-hidden="true"
                />
              </div>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
