import * as React from "react";
import { BrandLogo, DesignSystemShowcase } from "@/components/shared";
import { Badge } from "@/components/ui";
import { BRAND } from "@/lib/constants";

export default function HomePage() {
  return (
    <div className="flex-1 w-full flex flex-col items-center px-4 py-8 sm:py-12 lg:py-16">
      <div className="w-full max-w-6xl mx-auto flex flex-col items-center space-y-10">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-3">
          <BrandLogo variant="auto" width={260} height={72} priority withLink={false} />

          <p className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--foreground)]">
            {BRAND.tagline}
          </p>

          <p className="max-w-2xl text-xs sm:text-sm text-[var(--foreground-muted)] leading-relaxed">
            Legal document intelligence and information assistant. Built with an India-first vision and international contract support.
          </p>

          <div className="pt-1 flex items-center gap-2">
            <Badge variant="brand" size="sm" dot>
              Phase 1B: Design System &amp; Visual Language
            </Badge>
            <Badge variant="neutral" size="sm">
              Light &amp; Dark Theme Ready
            </Badge>
          </div>
        </div>

        {/* Phase 1B Design System Inspector & Component Showcase */}
        <section
          aria-label="Design System Component Showcase"
          className="w-full rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8 shadow-[var(--shadow-subtle)]"
        >
          <div className="mb-6 space-y-1 text-left border-b border-[var(--border-muted)] pb-4">
            <h2 className="text-lg sm:text-xl font-bold text-[var(--foreground)]">
              Design System &amp; Component Foundation
            </h2>
            <p className="text-xs sm:text-sm text-[var(--foreground-muted)]">
              Interactive preview of Phase 1B tokens, accessible primitives, states, and legal document visual language.
            </p>
          </div>

          <DesignSystemShowcase />
        </section>

        {/* Legal Positioning Clarification */}
        <div className="w-full max-w-3xl rounded-[var(--radius-lg)] border border-amber-200 bg-amber-50/70 dark:border-amber-900/40 dark:bg-amber-950/20 p-4 text-xs text-amber-900 dark:text-amber-300 text-left flex items-start gap-3">
          <span className="text-base" aria-hidden="true">⚖️</span>
          <div className="space-y-1">
            <p className="font-semibold">Legal Information Assistant Boundary</p>
            <p className="leading-relaxed opacity-90">
              LexiGuide AI provides document intelligence, clause analysis, and comparison assistance. It is NOT an AI lawyer and does not substitute for licensed legal counsel.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
