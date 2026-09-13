"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLogo } from "@/components/shared";
import { BRAND } from "@/lib/constants";

export function AppFooter() {
  const pathname = usePathname();
  const currentYear = new Date().getFullYear();

  const isWorkspaceRoute =
    pathname?.startsWith("/analyze") ||
    pathname?.startsWith("/compare") ||
    pathname?.startsWith("/qa") ||
    pathname?.startsWith("/action-center");

  if (isWorkspaceRoute) {
    return null;
  }

  return (
    <footer className="w-full border-t border-[var(--border)] bg-[var(--surface-subtle)] py-10 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
        {/* Main Footer Row: 2-column on desktop, stacked on mobile */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 sm:pb-8 border-b border-[var(--border-muted)]">
          <div className="space-y-3 max-w-md text-left">
            <div className="flex items-center gap-3">
              <BrandLogo variant="icon" width={40} height={40} priority={false} />
              <div>
                <span className="text-sm font-bold text-[var(--foreground)] tracking-tight">
                  {BRAND.name}
                </span>
                <p className="text-[11px] text-[var(--foreground-muted)]">
                  {BRAND.tagline}
                </p>
              </div>
            </div>
            <p className="text-xs text-[var(--foreground-muted)] leading-relaxed">
              Legal document intelligence and legal information assistant. Built with an India-first vision and international contract support.
            </p>
          </div>

          <nav aria-label="Footer Navigation" className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-medium text-[var(--foreground-secondary)]">
            <Link
              href="#capabilities"
              className="py-2.5 px-1 inline-flex items-center min-h-[44px] hover:text-[var(--primary)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] rounded"
            >
              Capabilities
            </Link>
            <Link
              href="#how-it-works"
              className="py-2.5 px-1 inline-flex items-center min-h-[44px] hover:text-[var(--primary)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] rounded"
            >
              How It Works
            </Link>
            <Link
              href="#safety"
              className="py-2.5 px-1 inline-flex items-center min-h-[44px] hover:text-[var(--primary)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] rounded"
            >
              Safety &amp; Trust
            </Link>
            <Link
              href="#upload-section"
              className="py-2.5 px-1 inline-flex items-center min-h-[44px] hover:text-[var(--primary)] transition-colors text-[var(--primary)] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] rounded"
            >
              Analyze Document
            </Link>
          </nav>
        </div>

        {/* Mandatory Legal Information Disclaimer */}
        <div className="rounded-[var(--radius-lg)] border border-amber-200/80 bg-amber-50/70 p-4 text-xs leading-relaxed text-amber-950 text-left">
          <p className="font-semibold mb-1 flex items-center gap-1.5">
            <span aria-hidden="true">⚖️</span> Legal Information Disclaimer
          </p>
          <p>{BRAND.disclaimer}</p>
        </div>

        {/* Copyright & Tagline */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-[var(--foreground-muted)]">
          <p>
            &copy; {currentYear} {BRAND.name}. All rights reserved.
          </p>
          <p className="font-medium text-[var(--foreground-secondary)]">
            {BRAND.tagline}
          </p>
        </div>
      </div>
    </footer>
  );
}
