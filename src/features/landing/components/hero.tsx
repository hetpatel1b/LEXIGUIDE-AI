import * as React from "react";
import { ArrowRight, ShieldCheck, Sparkles, FileText } from "lucide-react";
import { Button, Badge, Card } from "@/components/ui";
import { RiskIndicator } from "@/components/shared";

export function Hero() {
  return (
    <section className="w-full pt-4 sm:pt-10 lg:pt-14 pb-10 sm:pb-16 lg:pb-20 overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-10 items-center">
          {/* Left Column: Core Value Proposition */}
          <div className="lg:col-span-7 space-y-5 sm:space-y-6 text-left">
            {/* 1. Eyebrow */}
            <div className="inline-flex items-center gap-2">
              <Badge variant="brand" size="sm" dot>
                Legal Document Intelligence &bull; India-First
              </Badge>
            </div>

            {/* 2. Responsive Fluid Headline */}
            <h1
              style={{
                fontSize: "clamp(2rem, 5vw + 0.85rem, 4.35rem)",
                lineHeight: 1.12,
              }}
              className="font-bold tracking-tight text-[var(--foreground)]"
            >
              Understand. Compare. <br className="hidden sm:inline" />
              <span className="text-[var(--primary)]">Act with confidence.</span>
            </h1>

            {/* 3. Description */}
            <p className="max-w-2xl text-sm sm:text-base lg:text-lg text-[var(--foreground-secondary)] leading-relaxed">
              LexiGuide AI transforms dense agreements into plain-language clarity.
              Identify key provisions, surface clauses warranting closer review, understand obligations, and ask grounded questions directly from your documents.
            </p>

            {/* 4 & 5. Primary and Secondary CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
              <Button
                href="#upload-section"
                size="lg"
                variant="primary"
                fullWidth={false}
                rightIcon={<ArrowRight className="h-4 w-4" />}
                className="w-full sm:w-auto min-h-[48px] justify-center shadow-[var(--shadow-md)]"
              >
                Analyze a Document
              </Button>

              <Button
                href="#how-it-works"
                size="lg"
                variant="outline"
                fullWidth={false}
                className="w-full sm:w-auto min-h-[48px] justify-center"
              >
                See How It Works
              </Button>
            </div>

            {/* 6. Trust Micro-signals (Fluid natural wrapping) */}
            <div className="flex flex-wrap items-center gap-y-2 gap-x-2.5 sm:gap-x-4 pt-4 border-t border-[var(--border-muted)] text-xs text-[var(--foreground-muted)]">
              <span className="flex items-center gap-1.5 font-medium text-[var(--foreground-secondary)]">
                <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                Confidential &amp; Private
              </span>
              <span aria-hidden="true" className="opacity-40 hidden sm:inline">&bull;</span>
              <span>PDF, DOCX, TXT Support</span>
              <span aria-hidden="true" className="opacity-40 hidden sm:inline">&bull;</span>
              <span className="text-[var(--foreground-secondary)]">Legal information &bull; Not an AI lawyer</span>
            </div>
          </div>

          {/* 7. Right Column: Illustrative Preview (stacks cleanly on mobile) */}
          <div className="lg:col-span-5 relative w-full">
            <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
              {/* Soft decorative background glow */}
              <div
                aria-hidden="true"
                className="absolute -inset-2 rounded-3xl bg-gradient-to-tr from-blue-500/10 via-sky-400/10 to-transparent blur-xl pointer-events-none"
              />

              {/* Responsive Preview Card */}
              <Card className="relative w-full border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-raised)] overflow-hidden">
                <div className="bg-slate-100 dark:bg-slate-800/80 px-3.5 sm:px-4 py-2.5 border-b border-[var(--border)] flex items-center justify-between gap-2 text-xs text-[var(--foreground-muted)]">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="h-3.5 w-3.5 text-[var(--primary)] shrink-0" />
                    <span className="font-medium text-[var(--foreground)] truncate max-w-[140px] xs:max-w-[180px] sm:max-w-[210px]">
                      Services_Agreement_Draft.pdf
                    </span>
                  </div>
                  <Badge variant="neutral" size="sm" className="shrink-0">
                    Illustrative
                  </Badge>
                </div>

                <div className="p-4 sm:p-5 space-y-3.5 text-left">
                  {/* Summary Block */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--primary)]">
                      Executive Understanding
                    </span>
                    <p className="text-xs text-[var(--foreground-secondary)] leading-relaxed">
                      Commercial master services agreement establishing bilateral deliverables with a 24-month duration and milestone payment triggers.
                    </p>
                  </div>

                  {/* Clause Insight Card */}
                  <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-subtle)] p-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-[var(--foreground)] truncate">
                        Section 9.1: Limitation of Liability
                      </span>
                      <RiskIndicator severity="medium" size="sm" />
                    </div>
                    <p className="text-xs text-[var(--foreground-muted)] leading-relaxed">
                      Total liability is capped at 12 months fees, but IP indemnity is excluded from the ceiling.
                    </p>
                  </div>

                  {/* Grounded Evidence Tag */}
                  <div className="rounded-[var(--radius-md)] border border-blue-100 bg-blue-50/50 p-2.5 flex items-start gap-2 text-xs">
                    <Sparkles className="h-3.5 w-3.5 text-[var(--primary)] shrink-0 mt-0.5" />
                    <div className="space-y-0.5 min-w-0">
                      <p className="font-medium text-[var(--foreground)] text-[11px]">
                        Grounded Citation &bull; Page 14
                      </p>
                      <p className="text-[11px] text-[var(--foreground-secondary)] italic leading-relaxed">
                        &ldquo;Neither party shall be liable for indirect, incidental, or consequential damages...&rdquo;
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

