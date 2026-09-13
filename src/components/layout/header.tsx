"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { BrandLogo } from "@/components/shared";
import { Button, ThemeToggle } from "@/components/ui";

export function AppHeader() {
  const pathname = usePathname();

  const isWorkspaceRoute =
    pathname?.startsWith("/analyze") ||
    pathname?.startsWith("/compare") ||
    pathname?.startsWith("/qa") ||
    pathname?.startsWith("/action-center");

  if (isWorkspaceRoute) {
    return null;
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[var(--border)] bg-[var(--surface)]/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-3">
          <BrandLogo variant="auto" width={180} height={50} priority />
        </div>

        {/* Center / Right: Nav Anchors + Primary CTA + Theme Toggle */}
        <div className="flex items-center gap-2 sm:gap-6">
          <nav aria-label="Main Navigation" className="hidden md:flex items-center gap-5">
            <Link
              href="#capabilities"
              className="text-xs sm:text-sm font-medium text-[var(--foreground-secondary)] hover:text-[var(--primary)] transition-colors"
            >
              Capabilities
            </Link>
            <Link
              href="#how-it-works"
              className="text-xs sm:text-sm font-medium text-[var(--foreground-secondary)] hover:text-[var(--primary)] transition-colors"
            >
              How It Works
            </Link>
            <Link
              href="#safety"
              className="text-xs sm:text-sm font-medium text-[var(--foreground-secondary)] hover:text-[var(--primary)] transition-colors"
            >
              Safety &amp; Trust
            </Link>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              href="#upload-section"
              variant="primary"
              size="sm"
              rightIcon={<ArrowRight className="h-3.5 w-3.5 hidden sm:inline-block" />}
              className="shadow-[var(--shadow-subtle)] text-xs sm:text-sm"
            >
              Analyze a Document
            </Button>

            <div className="border-l border-[var(--border)] pl-1.5 sm:pl-2">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
