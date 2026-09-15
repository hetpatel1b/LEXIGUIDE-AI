"use client";

import * as React from "react";
import {
  LayoutDashboard,
  FileText,
  Scale,
  AlertTriangle,
  CheckSquare,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type AnalysisTabId =
  | "overview"
  | "summary"
  | "clauses"
  | "concerns"
  | "obligations"
  | "dates";

export interface TabCounts {
  clauses?: number;
  concerns?: number;
  obligations?: number;
  dates?: number;
}

export interface AnalysisTabsProps {
  activeTab: AnalysisTabId;
  onSelectTab: (tabId: AnalysisTabId) => void;
  counts?: TabCounts;
  className?: string;
}

export const TAB_ITEMS: Array<{
  id: AnalysisTabId;
  label: string;
  shortLabel?: string;
  icon: React.ComponentType<{ className?: string }>;
  countBadge?: string;
  badgeVariant?: "neutral" | "brand" | "warning";
}> = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "summary", label: "Summary", icon: FileText },
  { id: "clauses", label: "Key Clauses", shortLabel: "Clauses", icon: Scale, countBadge: "12", badgeVariant: "neutral" },
  { id: "concerns", label: "Potential Concerns", shortLabel: "Concerns", icon: AlertTriangle, countBadge: "5", badgeVariant: "warning" },
  { id: "obligations", label: "Obligations", icon: CheckSquare, countBadge: "8", badgeVariant: "neutral" },
  { id: "dates", label: "Important Dates", shortLabel: "Dates", icon: Calendar, countBadge: "4", badgeVariant: "neutral" },
];

export function AnalysisTabs({
  activeTab,
  onSelectTab,
  counts,
  className,
}: AnalysisTabsProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const tabsRef = React.useRef<(HTMLButtonElement | null)[]>([]);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(false);

  const checkScroll = React.useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 2);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 2);
  }, []);

  // Monitor scrollability without triggering layout re-measurement loops
  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    checkScroll();
    el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll, { passive: true });

    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [checkScroll]);

  // Keep active tab visible inside container without scrolling ancestor containers or the window
  React.useEffect(() => {
    const activeIndex = TAB_ITEMS.findIndex((t) => t.id === activeTab);
    const container = containerRef.current;
    const tabEl = tabsRef.current[activeIndex];
    if (container && tabEl) {
      const cLeft = container.scrollLeft;
      const cRight = cLeft + container.clientWidth;
      const tLeft = tabEl.offsetLeft;
      const tRight = tLeft + tabEl.clientWidth;
      if (tLeft < cLeft) {
        container.scrollTo({ left: tLeft, behavior: "smooth" });
      } else if (tRight > cRight) {
        container.scrollTo({ left: tRight - container.clientWidth, behavior: "smooth" });
      }
    }
  }, [activeTab]);

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
      const targetEl = tabsRef.current[targetIndex];
      targetEl?.focus();
      const container = containerRef.current;
      if (container && targetEl) {
        const cLeft = container.scrollLeft;
        const cRight = cLeft + container.clientWidth;
        const tLeft = targetEl.offsetLeft;
        const tRight = tLeft + targetEl.clientWidth;
        if (tLeft < cLeft) {
          container.scrollTo({ left: tLeft, behavior: "smooth" });
        } else if (tRight > cRight) {
          container.scrollTo({ left: tRight - container.clientWidth, behavior: "smooth" });
        }
      }
    }
  };

  return (
    <div className={cn("relative w-full bg-[var(--surface)] border-b border-[var(--border)] shrink-0", className)}>
      {/* Scroll Left Button & Gradient */}
      {canScrollLeft && (
        <>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[var(--surface)] to-transparent z-10"
          />
          <button
            type="button"
            onClick={() => containerRef.current?.scrollBy({ left: -160, behavior: "smooth" })}
            aria-label="Scroll tabs left"
            className="absolute left-1 top-1/2 -translate-y-1/2 z-20 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--surface)] border border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-muted)] shadow-xs transition-colors"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
        </>
      )}

      {/* Scroll Right Button & Gradient */}
      {canScrollRight && (
        <>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[var(--surface)] to-transparent z-10"
          />
          <button
            type="button"
            onClick={() => containerRef.current?.scrollBy({ left: 160, behavior: "smooth" })}
            aria-label="Scroll tabs right"
            className="absolute right-1 top-1/2 -translate-y-1/2 z-20 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--surface)] border border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-muted)] shadow-xs transition-colors"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </>
      )}

      {/* Horizontally scrollable tablist container */}
      <div
        ref={containerRef}
        role="tablist"
        aria-label="Document Analysis Navigation"
        className="flex items-center overflow-x-auto no-scrollbar scroll-smooth w-full px-2 sm:px-4 lg:px-6"
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
              aria-label={tab.label}
              id={`tab-${tab.id}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onSelectTab(tab.id)}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              className={cn(
                "group relative flex-1 flex items-center justify-center transition-colors cursor-pointer border-b-2 -mb-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] rounded-t-sm whitespace-nowrap shrink-0 xs:shrink xs:min-w-0 gap-1.5 sm:gap-2 py-2.5 sm:py-3 px-1.5 xs:px-2 sm:px-3 text-xs sm:text-sm font-medium",
                isActive
                  ? "border-[var(--primary)] text-[var(--primary)] font-semibold"
                  : "border-transparent text-[var(--foreground-secondary)] hover:text-[var(--foreground)] hover:border-[var(--border-strong)]"
              )}
            >
              <Icon
                className={cn(
                  "shrink-0 transition-colors h-3.5 w-3.5 sm:h-4 sm:w-4",
                  isActive ? "text-[var(--primary)]" : "text-[var(--foreground-muted)] group-hover:text-[var(--foreground)]"
                )}
              />

              {/* Responsive Label - CSS driven without JS measurements */}
              <span className="truncate">
                {tab.shortLabel ? (
                  <>
                    <span className="hidden md:inline">{tab.label}</span>
                    <span className="md:hidden">{tab.shortLabel}</span>
                  </>
                ) : (
                  tab.label
                )}
              </span>

              {/* Count Badge */}
              {(() => {
                const countVal = counts ? counts[tab.id as keyof TabCounts] : undefined;
                const displayBadge = countVal !== undefined ? String(countVal) : tab.countBadge;
                if (!displayBadge) return null;
                return (
                  <span
                    className={cn(
                      "ml-0.5 rounded-full px-1.5 py-0.2 text-[10px] font-mono font-semibold shrink-0 transition-colors",
                      isActive
                        ? "bg-[var(--primary)]/10 text-[var(--primary)]"
                        : "bg-[var(--surface-muted)] text-[var(--foreground-muted)]"
                    )}
                  >
                    {displayBadge}
                  </span>
                );
              })()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
