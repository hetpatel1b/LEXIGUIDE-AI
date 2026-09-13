import * as React from "react";
import { BrandLogo } from "@/components/shared";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Badge } from "@/components/ui";
import { BRAND, APP_METADATA } from "@/lib/constants";

export default function HomePage() {
  const architecturalPillars = [
    {
      title: "Clean Modular Boundaries",
      description: "Strict isolation between UI primitives, feature modules, domain types, and infrastructure.",
      tag: "Architected",
    },
    {
      title: "Accessibility from Day One",
      description: "Visible focus rings, semantic HTML structure, keyboard skip-links, and reduced-motion compliance.",
      tag: "Configured",
    },
    {
      title: "Official Brand Tokens",
      description: "Approved color palette (#0B1F44, #2563EB, #38BDF8, #F8FAFC) integrated into semantic CSS custom properties.",
      tag: "Established",
    },
    {
      title: "Zero Leakage Security",
      description: "Server secrets isolated from client bundles with type-checked environment validation.",
      tag: "Enforced",
    },
  ];

  return (
    <div className="flex-1 w-full flex flex-col items-center justify-center px-4 py-12 sm:py-20 lg:py-24">
      <div className="w-full max-w-4xl mx-auto flex flex-col items-center text-center space-y-8">
        {/* Brand Lockup Showcase */}
        <div className="flex flex-col items-center space-y-4">
          <BrandLogo variant="light" width={260} height={75} priority withLink={false} />
          
          <p className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-800 dark:text-slate-100">
            {BRAND.tagline}
          </p>

          <p className="max-w-2xl text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
            Legal document intelligence and information assistant. Built with an India-first vision and international contract support.
          </p>
        </div>

        {/* Phase 1A Foundation Status Banner */}
        <div className="w-full max-w-2xl rounded-xl border border-blue-200 bg-blue-50/60 dark:border-blue-900/40 dark:bg-blue-950/20 p-4 sm:p-5 text-left flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--color-brand-blue)]">
              Engineering Status
            </span>
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
              {APP_METADATA.phase}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Application structure, brand tokens, and architecture established. Ready for Phase 1B.
            </p>
          </div>
          <Badge variant="brand" className="shrink-0">
            Phase 1A Complete
          </Badge>
        </div>

        {/* Architectural Pillars Grid */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4 text-left pt-4">
          {architecturalPillars.map((pillar) => (
            <Card key={pillar.title} className="hover:border-slate-300 dark:hover:border-slate-700">
              <CardHeader className="p-5 pb-2">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-100">
                    {pillar.title}
                  </CardTitle>
                  <Badge variant="neutral" className="text-[10px]">
                    {pillar.tag}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-5 pt-0">
                <CardDescription className="text-xs sm:text-sm">
                  {pillar.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
