"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface TabItem {
  id: string;
  label: string;
  count?: number | string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (id: string) => void;
  density?: "spacious" | "compact";
  className?: string;
}

export function Tabs({
  tabs,
  activeTab,
  onTabChange,
  density = "spacious",
  className,
}: TabsProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    let nextIndex = index;
    if (e.key === "ArrowRight") {
      nextIndex = (index + 1) % tabs.length;
    } else if (e.key === "ArrowLeft") {
      nextIndex = (index - 1 + tabs.length) % tabs.length;
    } else if (e.key === "Home") {
      nextIndex = 0;
    } else if (e.key === "End") {
      nextIndex = tabs.length - 1;
    } else {
      return;
    }

    e.preventDefault();
    const nextTab = tabs[nextIndex];
    if (nextTab && !nextTab.disabled) {
      onTabChange(nextTab.id);
    }
  };

  return (
    <div
      role="tablist"
      aria-orientation="horizontal"
      className={cn(
        "flex items-center gap-1 border-b border-[var(--border)] w-full overflow-x-auto no-scrollbar",
        className
      )}
    >
      {tabs.map((tab, idx) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            role="tab"
            type="button"
            id={`tab-${tab.id}`}
            aria-controls={`tabpanel-${tab.id}`}
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            disabled={tab.disabled}
            onClick={() => onTabChange(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            className={cn(
              "relative inline-flex items-center gap-2 font-medium transition-colors border-b-2 -mb-px outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 select-none whitespace-nowrap cursor-pointer",
              density === "compact"
                ? "px-3 py-2 text-xs"
                : "px-4 py-3 text-sm",
              isActive
                ? "border-[var(--primary)] text-[var(--primary)] font-semibold"
                : "border-transparent text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:border-[var(--border-strong)]"
            )}
          >
            {tab.icon && <span className="shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.2 text-[10px] font-mono",
                  isActive
                    ? "bg-blue-100 dark:bg-blue-950 text-[var(--primary)]"
                    : "bg-[var(--surface-muted)] text-[var(--foreground-subtle)]"
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
