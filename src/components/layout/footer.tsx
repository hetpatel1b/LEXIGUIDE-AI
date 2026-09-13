import * as React from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/shared";
import { BRAND } from "@/lib/constants";

export function AppFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-[var(--border)] bg-[var(--surface-subtle)] py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Main Footer Row */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-[var(--border-muted)]">
          <div className="space-y-2 max-w-md text-left">
            <BrandLogo variant="auto" width={180} height={50} priority={false} />
            <p className="text-xs text-[var(--foreground-muted)] leading-relaxed">
              Legal document intelligence and legal information assistant. Built with an India-first vision and international contract support.
            </p>
          </div>

          <nav aria-label="Footer Navigation" className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-medium text-[var(--foreground-secondary)]">
            <Link href="#capabilities" className="hover:text-[var(--primary)] transition-colors">
              Capabilities
            </Link>
            <Link href="#how-it-works" className="hover:text-[var(--primary)] transition-colors">
              How It Works
            </Link>
            <Link href="#safety" className="hover:text-[var(--primary)] transition-colors">
              Safety &amp; Trust
            </Link>
            <Link href="#upload-section" className="hover:text-[var(--primary)] transition-colors text-[var(--primary)] font-semibold">
              Analyze Document
            </Link>
          </nav>
        </div>

        {/* Mandatory Legal Information Disclaimer */}
        <div className="rounded-[var(--radius-lg)] border border-amber-200/80 bg-amber-50/70 dark:border-amber-900/40 dark:bg-amber-950/20 p-4 text-xs leading-relaxed text-amber-950 dark:text-amber-300 text-left">
          <p className="font-semibold mb-1 flex items-center gap-1.5">
            <span aria-hidden="true">⚖️</span> Legal Information Disclaimer
          </p>
          <p>{BRAND.disclaimer}</p>
        </div>

        {/* Copyright & Tagline */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--foreground-muted)]">
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
