import * as React from "react";
import { BrandLogo } from "@/components/shared";
import { Badge } from "@/components/ui";
import { NAV_LINKS } from "@/lib/constants";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <BrandLogo variant="light" width={180} height={50} priority />
          <Badge variant="brand" className="hidden sm:inline-flex">
            Phase 1A Active
          </Badge>
        </div>

        <nav aria-label="Main Navigation" className="flex items-center gap-1 sm:gap-2">
          {NAV_LINKS.map((link) => (
            <span
              key={link.label}
              className={`text-xs sm:text-sm px-2.5 py-1.5 rounded-md font-medium transition-colors ${
                link.disabled
                  ? "text-slate-400 dark:text-slate-600 cursor-not-allowed"
                  : "text-slate-700 dark:text-slate-200 hover:text-[var(--color-brand-blue)]"
              }`}
              title={link.disabled ? `Available in ${link.tag}` : undefined}
            >
              {link.label}
              {link.tag && (
                <span className="ml-1.5 hidden md:inline-block text-[10px] uppercase font-mono tracking-wider opacity-60">
                  {link.tag}
                </span>
              )}
            </span>
          ))}
        </nav>
      </div>
    </header>
  );
}
