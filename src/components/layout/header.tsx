import * as React from "react";
import { BrandLogo } from "@/components/shared";
import { Badge, ThemeToggle } from "@/components/ui";
import { NAV_LINKS } from "@/lib/constants";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-[var(--border)] bg-[var(--surface)]/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 sm:gap-4">
          <BrandLogo variant="auto" width={180} height={50} priority />
          <Badge variant="brand" size="sm" className="hidden sm:inline-flex">
            Phase 1B Active
          </Badge>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <nav aria-label="Main Navigation" className="flex items-center gap-1 sm:gap-2">
            {NAV_LINKS.map((link) => (
              <span
                key={link.label}
                className={`text-xs sm:text-sm px-2.5 py-1.5 rounded-[var(--radius-md)] font-medium transition-colors ${
                  link.disabled
                    ? "text-[var(--foreground-subtle)] cursor-not-allowed"
                    : "text-[var(--foreground-secondary)] hover:text-[var(--primary)]"
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

          <div className="border-l border-[var(--border)] pl-2 sm:pl-3">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
