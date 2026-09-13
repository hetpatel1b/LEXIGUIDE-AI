import * as React from "react";
import { Check, X, Shield, Lock, Scale } from "lucide-react";
import { Card, Badge } from "@/components/ui";
import { BRAND } from "@/lib/constants";

export function TrustSafety() {
  const whatWeDo = [
    "Clarify dense legal terminology into straightforward language",
    "Identify key obligations, deadlines, and rights for each party",
    "Surface clauses that may warrant closer inspection or renegotiation",
    "Help you formulate structured questions for your legal counsel",
  ];

  const whatWeDoNotDo = [
    "We do not provide binding legal advice or attorney representation",
    "We do not create an attorney-client relationship",
    "We do not guarantee judicial, regulatory, or transactional outcomes",
    "We do not replace licensed attorneys or advocate in disputes",
  ];

  return (
    <section id="safety" className="w-full py-10 sm:py-14 lg:py-18 border-t border-[var(--border-muted)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <Badge variant="brand" size="sm" dot>
            Trust &amp; Legal Responsibility
          </Badge>

          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--foreground)]">
            Built to help you understand—not replace professional legal advice.
          </h2>

          <p className="text-sm sm:text-base text-[var(--foreground-muted)] leading-relaxed">
            LexiGuide AI is designed to empower you with clarity before you sign, negotiate, or consult legal counsel. Transparency is foundational to our mission.
          </p>
        </div>

        {/* Two-Column Comparison: Desktop 2 Columns, Mobile/Tablet 1 Column */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 max-w-5xl mx-auto text-left">
          {/* What LexiGuide Does */}
          <Card className="p-4 sm:p-6 md:p-7 border-[var(--border)] bg-[var(--surface)] space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-[var(--border-muted)]">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 shrink-0">
                <Check className="h-4 w-4 stroke-[2.5]" />
              </div>
              <h3 className="text-base font-semibold text-[var(--foreground)]">
                What LexiGuide AI Does
              </h3>
            </div>

            <ul className="space-y-3 text-xs sm:text-sm text-[var(--foreground-secondary)]">
              {whatWeDo.map((item, i) => (
                <li key={i} className="flex items-start gap-2.5 leading-relaxed">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0 mt-2" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </Card>

          {/* What LexiGuide Does NOT Do */}
          <Card className="p-4 sm:p-6 md:p-7 border-[var(--border)] bg-[var(--surface)] space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-[var(--border-muted)]">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-[var(--foreground-muted)] shrink-0">
                <X className="h-4 w-4 stroke-[2.5]" />
              </div>
              <h3 className="text-base font-semibold text-[var(--foreground)]">
                What LexiGuide AI Does Not Do
              </h3>
            </div>

            <ul className="space-y-3 text-xs sm:text-sm text-[var(--foreground-muted)]">
              {whatWeDoNotDo.map((item, i) => (
                <li key={i} className="flex items-start gap-2.5 leading-relaxed">
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0 mt-2" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        {/* Prominent Legal Safety Banner */}
        <div className="max-w-4xl mx-auto rounded-[var(--radius-lg)] border border-amber-200/80 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/20 p-4 sm:p-5 text-left text-xs text-amber-950 dark:text-amber-200 space-y-1.5">
          <div className="flex items-center gap-2 font-semibold">
            <Scale className="h-4 w-4 text-amber-700 dark:text-amber-400 shrink-0" />
            <span>Legal Information Assistant &bull; Not an AI Lawyer</span>
          </div>
          <p className="leading-relaxed opacity-95">
            {BRAND.disclaimer}
          </p>
        </div>
      </div>
    </section>
  );
}
