import * as React from "react";
import { BRAND, APP_METADATA } from "@/lib/constants";

export function AppFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-10 mt-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Mandatory Legal Information Disclaimer */}
        <div className="rounded-lg border border-amber-200/80 bg-amber-50/70 p-4 text-xs leading-relaxed text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300">
          <p className="font-semibold mb-1 flex items-center gap-1.5">
            <span aria-hidden="true">⚠️</span> Legal Information Disclaimer
          </p>
          <p>{BRAND.disclaimer}</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div>
            <p className="font-medium text-slate-700 dark:text-slate-300">
              {BRAND.name} &bull; {BRAND.tagline}
            </p>
            <p className="mt-0.5">
              &copy; {currentYear} LexiGuide AI. All rights reserved.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <span className="inline-flex items-center gap-1 font-mono text-[11px] bg-slate-200/70 dark:bg-slate-800 px-2 py-0.5 rounded">
              {APP_METADATA.phase}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
