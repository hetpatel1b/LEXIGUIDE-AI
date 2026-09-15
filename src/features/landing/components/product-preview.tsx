import * as React from "react";
import { FileText, Sparkles, BookOpen, AlertCircle, CheckCircle2 } from "lucide-react";
import { Card, Badge } from "@/components/ui";
import { RiskIndicator } from "@/components/shared";

export function ProductPreview() {
  return (
    <section className="w-full py-10 sm:py-14 lg:py-18">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[var(--primary)]">
              Workspace Preview
            </span>
            <Badge variant="neutral" size="sm">
              Illustrative Demo UI
            </Badge>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--foreground)]">
            How LexiGuide presents your documents
          </h2>
          <p className="text-sm sm:text-base text-[var(--foreground-muted)] leading-relaxed">
            A structured, calm interface designed for clarity. Information is categorized by key provisions, potential concerns, and direct textual citations.
          </p>
        </div>

        {/* Large Static Product Preview Container */}
        <Card className="max-w-5xl mx-auto border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-raised)] rounded-[var(--radius-xl)] overflow-hidden text-left">
          {/* Mock Window Titlebar */}
          <div className="bg-slate-100 px-3.5 sm:px-6 py-2.5 sm:py-3 border-b border-[var(--border)] flex flex-wrap items-center justify-between gap-2.5 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <span className="hidden xs:flex gap-1.5 shrink-0" aria-hidden="true">
                <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
              </span>
              <span className="font-semibold text-[var(--foreground)] flex items-center gap-1.5 min-w-0">
                <FileText className="h-3.5 w-3.5 text-[var(--primary)] shrink-0" />
                <span className="truncate max-w-[180px] sm:max-w-xs">
                  Commercial_Service_Agreement.pdf
                </span>
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 font-mono text-[11px] text-[var(--foreground-muted)]">
              <span>Status: Analyzed</span>
              <span aria-hidden="true">&bull;</span>
              <span>18 Pages</span>
              <span aria-hidden="true">&bull;</span>
              <span className="text-[var(--primary)] font-sans font-medium">Illustrative Preview</span>
            </div>
          </div>

          {/* Workspace Body Grid */}
          <div className="p-4 sm:p-6 lg:p-8 space-y-5 sm:space-y-6">
            {/* Top Workspace Bar: Document Summary */}
            <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-subtle)] p-3.5 sm:p-5 space-y-2">
              <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2">
                <span className="text-xs font-semibold text-[var(--foreground)] flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-[var(--primary)] shrink-0" />
                  Executive Document Overview
                </span>
                <Badge variant="brand" size="sm" className="self-start xs:self-auto">
                  Full-time Employment Contract
                </Badge>
              </div>
              <p className="text-xs sm:text-sm text-[var(--foreground-secondary)] leading-relaxed">
                This agreement outlines the terms of employment, compensation benchmarks, non-disclosure commitments, post-employment restrictive covenants, and intellectual property ownership rights.
              </p>
            </div>

            {/* Two-Column Mock Workspace Display */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
              {/* Left Column: Key Provisions & Obligations */}
              <div className="lg:col-span-6 space-y-3.5">
                <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-[var(--foreground-muted)]">
                  Key Clauses &amp; Obligations
                </h4>

                <div className="space-y-3">
                  <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-3 sm:p-3.5 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-[var(--foreground)]">
                        Section 3: Compensation &amp; Review Cycle
                      </span>
                      <span className="text-[11px] font-mono text-[var(--foreground-muted)] shrink-0">Page 4</span>
                    </div>
                    <p className="text-xs text-[var(--foreground-secondary)] leading-relaxed">
                      Annual compensation reviews conducted at the discretion of the management committee. Bonuses are milestone-dependent.
                    </p>
                  </div>

                  <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-3 sm:p-3.5 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-[var(--foreground)]">
                        Section 6: Confidentiality &amp; Proprietary Rights
                      </span>
                      <span className="text-[11px] font-mono text-[var(--foreground-muted)] shrink-0">Page 8</span>
                    </div>
                    <p className="text-xs text-[var(--foreground-secondary)] leading-relaxed">
                      Perpetual non-disclosure requirements for proprietary source code, internal business metrics, and customer rosters.
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Column: Potential Concerns & Grounded Evidence */}
              <div className="lg:col-span-6 space-y-3.5">
                <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-[var(--foreground-muted)]">
                  Potential Concerns &amp; Evidence
                </h4>

                <div className="space-y-3">
                  {/* Concern Card */}
                  <div className="rounded-[var(--radius-md)] border border-amber-200/80 dark:border-amber-900/60 bg-[var(--warning-subtle)] p-3 sm:p-3.5 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-[var(--foreground)] truncate">
                        Section 8.2: Termination &amp; Notice Period
                      </span>
                      <RiskIndicator severity="medium" size="sm" />
                    </div>
                    <p className="text-xs text-[var(--foreground-muted)] leading-relaxed">
                      Review the termination language carefully. The employer holds immediate termination rights with pay in lieu, while employee voluntary resignation requires 90 calendar days.
                    </p>
                  </div>

                  {/* Grounded Citation Card */}
                  <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-muted)] p-3 sm:p-3.5 space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-[var(--color-brand-blue)] font-semibold gap-2">
                      <span className="flex items-center gap-1 truncate">
                        <BookOpen className="h-3 w-3 shrink-0" />
                        Grounded Citation &bull; Section 8.2
                      </span>
                      <Badge variant="neutral" size="sm" className="shrink-0">Page 12</Badge>
                    </div>
                    <p className="text-xs text-[var(--foreground-secondary)] italic leading-relaxed pl-2 border-l-2 border-[var(--color-brand-blue)]/60">
                      &ldquo;Employee shall provide no less than ninety (90) days prior written notice of resignation. Company may waive such notice period in its sole discretion.&rdquo;
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}
