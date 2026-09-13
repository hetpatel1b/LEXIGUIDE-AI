"use client";

import * as React from "react";
import {
  GitCompare,
  FileText,
  AlertCircle,
  Check,
  Sparkles,
  Info,
} from "lucide-react";
import { WorkspaceNav } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DocumentPair } from "./document-pair";
import { ComparisonSummary } from "./comparison-summary";
import { ComparisonFilters } from "./comparison-filters";
import { ComparisonChangeCard } from "./comparison-change-card";
import { UnchangedSectionCard } from "./unchanged-section-card";
import {
  COMPARISON_DOC_A,
  COMPARISON_DOC_B,
  COMPARISON_METRICS,
  COMPARISON_CHANGES,
  UNCHANGED_SECTIONS,
} from "../fixtures/comparison-fixture";
import type { ComparisonCategory, ComparisonChange } from "@/types";

export function ComparisonWorkspace() {
  const [selectedCategory, setSelectedCategory] = React.useState<ComparisonCategory>("All");
  const [activeEvidenceChange, setActiveEvidenceChange] = React.useState<ComparisonChange | null>(null);
  const [isEvidenceModalOpen, setIsEvidenceModalOpen] = React.useState(false);
  const [copiedCitation, setCopiedCitation] = React.useState(false);

  // Compute category counts
  const counts: Record<ComparisonCategory, number> = React.useMemo(() => {
    return {
      All: COMPARISON_CHANGES.length + UNCHANGED_SECTIONS.length,
      "Major Changes": COMPARISON_CHANGES.filter((c) => c.changeSeverity === "major").length,
      "Moderate Changes": COMPARISON_CHANGES.filter((c) => c.changeSeverity === "moderate").length,
      Unchanged: UNCHANGED_SECTIONS.length,
      Financial: COMPARISON_CHANGES.filter((c) => c.category === "Financial").length,
      Obligations: COMPARISON_CHANGES.filter((c) => c.category === "Obligations").length,
      Dates: COMPARISON_CHANGES.filter((c) => c.category === "Dates").length,
      Risks: COMPARISON_CHANGES.filter((c) => c.category === "Risks").length,
    };
  }, []);

  // Filtered change list
  const filteredChanges = React.useMemo(() => {
    if (selectedCategory === "All") return COMPARISON_CHANGES;
    if (selectedCategory === "Major Changes") {
      return COMPARISON_CHANGES.filter((c) => c.changeSeverity === "major");
    }
    if (selectedCategory === "Moderate Changes") {
      return COMPARISON_CHANGES.filter((c) => c.changeSeverity === "moderate");
    }
    if (selectedCategory === "Unchanged") return [];
    return COMPARISON_CHANGES.filter((c) => c.category === selectedCategory);
  }, [selectedCategory]);

  const showUnchanged =
    selectedCategory === "All" || selectedCategory === "Unchanged";

  const handleOpenEvidence = (change: ComparisonChange) => {
    setActiveEvidenceChange(change);
    setIsEvidenceModalOpen(true);
  };

  const handleCopyCitation = async () => {
    if (!activeEvidenceChange) return;
    const text = `Comparison: ${activeEvidenceChange.clauseTitle}\nDoc A (${activeEvidenceChange.sectionA}, p.${activeEvidenceChange.pageA}): "${activeEvidenceChange.docAContent}"\nDoc B (${activeEvidenceChange.sectionB}, p.${activeEvidenceChange.pageB}): "${activeEvidenceChange.docBContent}"`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCitation(true);
      setTimeout(() => setCopiedCitation(false), 2000);
    } catch {
      setCopiedCitation(true);
      setTimeout(() => setCopiedCitation(false), 2000);
    }
  };

  return (
    <div className="flex flex-col min-h-screen w-full bg-[var(--background)] text-[var(--foreground)]">
      {/* 1. Shared Workspace Navigation */}
      <WorkspaceNav
        documentName="Employment_Agreement_2026.pdf"
        documentType="Employment Agreement"
      />

      {/* 2. Main Scrollable Container */}
      <main className="flex-1 max-w-[1600px] mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-6 text-left">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[var(--border)]">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)]">
                <GitCompare className="h-4 w-4" aria-hidden="true" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--foreground)]">
                Compare Documents
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-[var(--foreground-muted)]">
              Review clause-level differences between two revisions and identify changes that may deserve attention.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="neutral" size="sm" dot>
              Illustrative Fixtures · Dev Preview
            </Badge>
          </div>
        </div>

        {/* Document Pair Cards */}
        <section aria-label="Compared Documents">
          <DocumentPair />
        </section>

        {/* Comparison Summary Metrics */}
        <section aria-label="Comparison Summary Metrics">
          <ComparisonSummary metrics={COMPARISON_METRICS} />
        </section>

        {/* Filter Bar */}
        <div className="pt-2">
          <ComparisonFilters
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            counts={counts}
          />
        </div>

        {/* Clause-Level Differences List */}
        <section aria-label="Clause Differences" className="space-y-4 pt-1">
          {filteredChanges.map((change) => (
            <ComparisonChangeCard
              key={change.id}
              change={change}
              onViewEvidence={handleOpenEvidence}
            />
          ))}

          {/* Unchanged Clauses Section */}
          {showUnchanged && (
            <div className="space-y-3 pt-4 border-t border-[var(--border-muted)]">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground-muted)]">
                  Unchanged Substantive Sections ({UNCHANGED_SECTIONS.length})
                </h3>
                <span className="text-[11px] text-[var(--foreground-muted)]">
                  Verified identical across Document A and B
                </span>
              </div>

              <div className="space-y-2.5">
                {UNCHANGED_SECTIONS.map((sec) => (
                  <UnchangedSectionCard key={sec.id} section={sec} />
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Statutory Informational Guidance Footer */}
        <div className="rounded-[var(--radius-lg)] border border-blue-200/70 bg-blue-50/50 p-3.5 flex items-start gap-2.5 text-xs text-blue-900">
          <Info className="h-4 w-4 shrink-0 mt-0.5 text-[var(--primary)]" aria-hidden="true" />
          <div className="leading-relaxed">
            <span className="font-semibold mr-1">Comparison Guidance:</span>
            Differences highlighted indicate contractual revisions between the original document and the updated draft. LexiGuide AI provides comparative intelligence for informational convenience and does not provide formal legal counsel.
          </div>
        </div>
      </main>

      {/* Side-by-Side Evidence Modal Dialog */}
      <Dialog
        isOpen={isEvidenceModalOpen}
        onClose={() => setIsEvidenceModalOpen(false)}
        title="Side-by-Side Clause Comparison"
        description="Verbatim contract wording extracted from Document A and Document B."
        className="max-w-2xl"
      >
        {activeEvidenceChange && (
          <div className="space-y-4 text-left">
            <div className="flex items-center justify-between gap-2 p-2.5 rounded-[var(--radius-md)] bg-[var(--surface-muted)] text-xs">
              <span className="font-semibold text-[var(--foreground)]">
                {activeEvidenceChange.clauseTitle}
              </span>
              <span className="font-mono text-[11px] text-[var(--primary)]">
                {activeEvidenceChange.sectionA} &rarr; {activeEvidenceChange.sectionB}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Doc A */}
              <div className="p-3 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-subtle)] space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-[var(--foreground-muted)] font-semibold">
                  <span>Document A (Original)</span>
                  <span className="font-mono">Page {activeEvidenceChange.pageA}</span>
                </div>
                <p className="italic leading-relaxed text-[var(--foreground-secondary)] font-serif border-l-2 border-red-400 pl-2">
                  &ldquo;{activeEvidenceChange.docAContent}&rdquo;
                </p>
              </div>

              {/* Doc B */}
              <div className="p-3 rounded-[var(--radius-lg)] border border-[var(--primary)]/40 bg-blue-50/40 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-[var(--primary)] font-semibold">
                  <span>Document B (Updated)</span>
                  <span className="font-mono">Page {activeEvidenceChange.pageB}</span>
                </div>
                <p className="italic leading-relaxed text-[var(--foreground)] font-serif border-l-2 border-[var(--primary)] pl-2 font-medium">
                  &ldquo;{activeEvidenceChange.docBContent}&rdquo;
                </p>
              </div>
            </div>

            <div className="p-2.5 rounded-[var(--radius-md)] bg-[var(--surface-muted)] text-[11px] text-[var(--foreground-secondary)]">
              <span className="font-semibold text-[var(--foreground)] mr-1">Summary:</span>
              <span>{activeEvidenceChange.summaryChange}</span>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[var(--border-muted)]">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyCitation}
                className="text-xs"
              >
                {copiedCitation ? "Citation Copied!" : "Copy Comparison Citation"}
              </Button>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsEvidenceModalOpen(false)}
                className="text-xs"
              >
                Done
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
