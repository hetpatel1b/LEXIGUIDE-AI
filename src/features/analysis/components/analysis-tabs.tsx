"use client";

import * as React from "react";
import {
  LayoutDashboard,
  FileText,
  Scale,
  AlertTriangle,
  CheckSquare,
  Calendar,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type AnalysisTabId =
  | "overview"
  | "summary"
  | "clauses"
  | "concerns"
  | "obligations"
  | "dates";

export interface AnalysisTabsProps {
  activeTab: AnalysisTabId;
  onSelectTab: (tabId: AnalysisTabId) => void;
  className?: string;
}

export const TAB_ITEMS: Array<{
  id: AnalysisTabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  countBadge?: string;
  badgeVariant?: "neutral" | "brand" | "warning";
}> = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "summary", label: "Summary", icon: FileText },
  { id: "clauses", label: "Key Clauses", icon: Scale, countBadge: "12", badgeVariant: "neutral" },
  { id: "concerns", label: "Potential Concerns", icon: AlertTriangle, countBadge: "5", badgeVariant: "warning" },
  { id: "obligations", label: "Obligations", icon: CheckSquare, countBadge: "8", badgeVariant: "neutral" },
  { id: "dates", label: "Important Dates", icon: Calendar, countBadge: "4", badgeVariant: "neutral" },
];

export function AnalysisTabs({
  activeTab,
  onSelectTab,
  className,
}: AnalysisTabsProps) {
  const tabsRef = React.useRef<(HTMLButtonElement | null)[]>([]);

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    let targetIndex = -1;
    if (e.key === "ArrowRight") {
      targetIndex = (index + 1) % TAB_ITEMS.length;
    } else if (e.key === "ArrowLeft") {
      targetIndex = (index - 1 + TAB_ITEMS.length) % TAB_ITEMS.length;
    } else if (e.key === "Home") {
      targetIndex = 0;
    } else if (e.key === "End") {
      targetIndex = TAB_ITEMS.length - 1;
    }

    if (targetIndex !== -1) {
      e.preventDefault();
      const nextTab = TAB_ITEMS[targetIndex];
      onSelectTab(nextTab.id);
      tabsRef.current[targetIndex]?.focus();
    }
  };

  return (
    <div
      role="tablist"
      aria-label="Document Analysis Navigation"
      className={cn(
        "flex items-center gap-1.5 overflow-x-auto no-scrollbar border-b border-[var(--border)] px-4 sm:px-6 bg-[var(--surface)] shrink-0",
        className
      )}
    >
      {TAB_ITEMS.map((tab, idx) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            ref={(el) => {
              tabsRef.current[idx] = el;
            }}
            role="tab"
            aria-selected={isActive}
            aria-controls={`panel-${tab.id}`}
            id={`tab-${tab.id}`}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onSelectTab(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            className={cn(
              "group relative flex items-center gap-2 py-3.5 px-3 text-xs sm:text-sm font-medium whitespace-nowrap transition-colors cursor-pointer border-b-2 -mb-[2px]",
              isActive
                ? "border-[var(--primary)] text-[var(--primary)] font-semibold"
                : "border-transparent text-[var(--foreground-secondary)] hover:text-[var(--foreground)] hover:border-[var(--border-strong)]"
            )}
          >
            <Icon
              className={cn(
                "h-4 w-4 shrink-0 transition-colors",
                isActive ? "text-[var(--primary)]" : "text-[var(--foreground-muted)] group-hover:text-[var(--foreground)]"
              )}
            />
            <span>{tab.label}</span>

            {tab.countBadge && (
              <span
                className={cn(
                  "ml-0.5 rounded-full px-1.5 py-0.2 text-[10px] font-mono font-semibold transition-colors",
                  isActive
                    ? "bg-[var(--primary)]/10 text-[var(--primary)] dark:bg-[var(--primary)]/20"
                    : "bg-[var(--surface-muted)] text-[var(--foreground-muted)]"
                )}
              >
                {tab.countBadge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
