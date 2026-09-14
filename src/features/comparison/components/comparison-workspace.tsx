"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  GitCompare,
  FileText,
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
import { WorkspaceEmpty } from "@/features/analysis/components/states/workspace-empty";
import { getSessionDocuments } from "@/lib/document-storage";
import type { NormalizedDocument } from "@/types/document";
import type {
  ComparisonCategory,
  ComparisonChange,
  ComparisonDocument,
  ComparisonSummaryMetrics,
} from "@/types";

interface ComparisonUnchangedItem {
  id: string;
  title: string;
  sectionReference: string;
  pageNumber: number;
  note: string;
}

function getSectionText(doc: NormalizedDocument, sec: NormalizedDocument["sections"][0]): string {
  const chunkText = (doc.chunks || [])
    .filter((c) => c.sectionId === sec.sectionId)
    .map((c) => c.text)
    .join(" ")
    .trim();
  return chunkText || sec.title;
}

const emptySubscribe = () => () => {};

export function ComparisonWorkspace() {
  const router = useRouter();
  const hasMounted = React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
  const [selectedDocAId, setSelectedDocAId] = React.useState<string>("");
  const [selectedDocBId, setSelectedDocBId] = React.useState<string>("");
  const [selectedCategory, setSelectedCategory] = React.useState<ComparisonCategory>("All");
  const [activeEvidenceChange, setActiveEvidenceChange] = React.useState<ComparisonChange | null>(null);
  const [isEvidenceModalOpen, setIsEvidenceModalOpen] = React.useState(false);
  const [copiedCitation, setCopiedCitation] = React.useState(false);

  const sessionDocs = React.useMemo(() => {
    if (!hasMounted) return [];
    return getSessionDocuments();
  }, [hasMounted]);

  const docA = React.useMemo(() => {
    if (!sessionDocs.length) return null;
    return sessionDocs.find((d) => d.id === selectedDocAId) || sessionDocs[0] || null;
  }, [sessionDocs, selectedDocAId]);

  const docB = React.useMemo(() => {
    if (sessionDocs.length < 2) return null;
    return sessionDocs.find((d) => d.id === selectedDocBId) || sessionDocs[1] || null;
  }, [sessionDocs, selectedDocBId]);

  // Compute clause-level differences and unchanged sections dynamically between docA and docB
  const { changes, unchangedSections, metrics } = React.useMemo(() => {
    if (!docA || !docB) {
      return {
        changes: [] as ComparisonChange[],
        unchangedSections: [] as ComparisonUnchangedItem[],
        metrics: {
          sectionsCompared: 0,
          changesIdentified: 0,
          majorChanges: 0,
          moderateChanges: 0,
          minorChanges: 0,
          unchangedCount: 0,
        } as ComparisonSummaryMetrics,
      };
    }

    const calculatedChanges: ComparisonChange[] = [];
    const calculatedUnchanged: ComparisonUnchangedItem[] = [];

    const sectionsA = docA.sections || [];
    const sectionsB = docB.sections || [];

    // Map sections from docB by normalized title for quick comparison
    const bMap = new Map(sectionsB.map((s) => [s.title.toLowerCase().trim(), s]));

    sectionsA.forEach((secA, idx) => {
      const matchKey = secA.title.toLowerCase().trim();
      const secB = bMap.get(matchKey);

      if (secB) {
        // Both documents have this section title
        const textA = getSectionText(docA, secA);
        const textB = getSectionText(docB, secB);

        if (textA === textB) {
          calculatedUnchanged.push({
            id: `unchanged-${idx}`,
            title: secA.title,
            sectionReference: secA.sectionNumber ? `Section ${secA.sectionNumber}` : `Section ${idx + 1}`,
            pageNumber: secA.pageReferences[0] || 1,
            note: "Identical substantive wording preserved across both document versions.",
          });
        } else {
          // Content differed
          const isFinancial =
            matchKey.includes("compensat") ||
            matchKey.includes("salary") ||
            matchKey.includes("fee") ||
            matchKey.includes("bonus") ||
            matchKey.includes("pay");
          const isDates =
            matchKey.includes("term") ||
            matchKey.includes("date") ||
            matchKey.includes("notice") ||
            matchKey.includes("duration");
          const isObligations =
            matchKey.includes("duty") ||
            matchKey.includes("obligation") ||
            matchKey.includes("service") ||
            matchKey.includes("compliance");

          const category: "Financial" | "Obligations" | "Dates" | "Risks" = isFinancial
            ? "Financial"
            : isDates
            ? "Dates"
            : isObligations
            ? "Obligations"
            : "Risks";

          const lengthDelta = Math.abs(textA.length - textB.length);
          const changeSeverity: "major" | "moderate" =
            lengthDelta > 150 ? "major" : "moderate";

          calculatedChanges.push({
            id: `change-${idx}`,
            clauseTitle: secA.title,
            category,
            changeSeverity,
            sectionA: secA.sectionNumber ? `Section ${secA.sectionNumber}` : `Section ${idx + 1}`,
            sectionB: secB.sectionNumber ? `Section ${secB.sectionNumber}` : `Section ${secB.title}`,
            pageA: secA.pageReferences[0] || 1,
            pageB: secB.pageReferences[0] || 1,
            docAContent: textA.slice(0, 300) || "Original section provision.",
            docBContent: textB.slice(0, 300) || "Updated section provision.",
            summaryChange: `Revisions identified between ${docA.displayName} and ${docB.displayName}.`,
            whyItMatters:
              changeSeverity === "major"
                ? "Substantive length and language modification. Review obligations closely."
                : undefined,
          });
        }
      } else {
        // Section exists in A but not directly matched by title in B
        const textA = getSectionText(docA, secA);
        calculatedChanges.push({
          id: `diff-removed-${idx}`,
          clauseTitle: secA.title,
          category: "Obligations",
          changeSeverity: "major",
          sectionA: secA.sectionNumber ? `Section ${secA.sectionNumber}` : `Section ${idx + 1}`,
          sectionB: "Omitted / Replaced",
          pageA: secA.pageReferences[0] || 1,
          pageB: 1,
          docAContent: textA.slice(0, 300),
          docBContent: "Provision not directly found under this section header in target version.",
          summaryChange: `Section "${secA.title}" is present in Document A but omitted or relocated in Document B.`,
          whyItMatters: "Verify whether omitted provisions were consolidated into another clause or intentionally removed.",
        });
      }
    });

    // Check for sections in B that were not in A
    const aMap = new Map(sectionsA.map((s) => [s.title.toLowerCase().trim(), s]));
    sectionsB.forEach((secB, idx) => {
      const matchKey = secB.title.toLowerCase().trim();
      if (!aMap.has(matchKey)) {
        const textB = getSectionText(docB, secB);
        calculatedChanges.push({
          id: `diff-added-${idx}`,
          clauseTitle: secB.title,
          category: "Risks",
          changeSeverity: "major",
          sectionA: "Not in Document A",
          sectionB: secB.sectionNumber ? `Section ${secB.sectionNumber}` : `Section ${idx + 1}`,
          pageA: 1,
          pageB: secB.pageReferences[0] || 1,
          docAContent: "Provision was not present in the original document baseline.",
          docBContent: textB.slice(0, 300),
          summaryChange: `New section "${secB.title}" added to Document B.`,
          whyItMatters: "Carefully inspect new clauses for newly imposed covenants or liabilities.",
        });
      }
    });

    const calculatedMetrics: ComparisonSummaryMetrics = {
      sectionsCompared: Math.max(sectionsA.length, sectionsB.length),
      changesIdentified: calculatedChanges.length,
      majorChanges: calculatedChanges.filter((c) => c.changeSeverity === "major").length,
      moderateChanges: calculatedChanges.filter((c) => c.changeSeverity === "moderate").length,
      minorChanges: 0,
      unchangedCount: calculatedUnchanged.length,
    };

    return {
      changes: calculatedChanges,
      unchangedSections: calculatedUnchanged,
      metrics: calculatedMetrics,
    };
  }, [docA, docB]);

  // Compute category counts
  const counts: Record<ComparisonCategory, number> = React.useMemo(() => {
    return {
      All: changes.length + unchangedSections.length,
      "Major Changes": changes.filter((c) => c.changeSeverity === "major").length,
      "Moderate Changes": changes.filter((c) => c.changeSeverity === "moderate").length,
      Unchanged: unchangedSections.length,
      Financial: changes.filter((c) => c.category === "Financial").length,
      Obligations: changes.filter((c) => c.category === "Obligations").length,
      Dates: changes.filter((c) => c.category === "Dates").length,
      Risks: changes.filter((c) => c.category === "Risks").length,
    };
  }, [changes, unchangedSections]);

  // Filtered change list
  const filteredChanges = React.useMemo(() => {
    if (selectedCategory === "All") return changes;
    if (selectedCategory === "Major Changes") {
      return changes.filter((c) => c.changeSeverity === "major");
    }
    if (selectedCategory === "Moderate Changes") {
      return changes.filter((c) => c.changeSeverity === "moderate");
    }
    if (selectedCategory === "Unchanged") return [];
    return changes.filter((c) => c.category === selectedCategory);
  }, [changes, selectedCategory]);

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

  // Prevent flash of empty state during hydration
  if (!hasMounted) {
    return (
      <div className="flex flex-col min-h-screen w-full bg-[var(--background)] text-[var(--foreground)]">
        <WorkspaceNav />
        <div className="flex-1 flex items-center justify-center p-6 text-xs text-[var(--foreground-muted)]">
          Loading comparison workspace…
        </div>
      </div>
    );
  }

  // 0 Documents State
  if (sessionDocs.length === 0) {
    return (
      <div className="flex flex-col min-h-screen w-full bg-[var(--background)] text-[var(--foreground)]">
        <WorkspaceNav />
        <div className="flex-1 flex items-center justify-center p-6">
          <WorkspaceEmpty
            title="Documents needed for comparison"
            description="Upload at least two legal documents in the Analysis workspace to compare clauses, duties, and terms side by side."
            onUploadClick={() => router.push("/analyze")}
          />
        </div>
      </div>
    );
  }

  // 1 Document State
  if (sessionDocs.length === 1) {
    const singleDoc = sessionDocs[0];
    return (
      <div className="flex flex-col min-h-screen w-full bg-[var(--background)] text-[var(--foreground)]">
        <WorkspaceNav
          documentName={singleDoc.displayName}
          documentType={singleDoc.format.toUpperCase()}
        />
        <div className="flex-1 flex items-center justify-center p-6">
          <WorkspaceEmpty
            title="Second document needed for comparison"
            description={`"${singleDoc.displayName}" is active. Upload a second document in the Analysis workspace to compare them side by side.`}
            onUploadClick={() => router.push("/analyze")}
          />
        </div>
      </div>
    );
  }

  // 2+ Documents State
  const compDocA: ComparisonDocument = {
    id: docA!.id,
    name: docA!.displayName,
    versionLabel: "Document A",
    type: docA!.format.toUpperCase(),
    pageCount: docA!.pageCount || 1,
    sizeBytes: docA!.sizeBytes,
  };

  const compDocB: ComparisonDocument = {
    id: docB!.id,
    name: docB!.displayName,
    versionLabel: "Document B",
    type: docB!.format.toUpperCase(),
    pageCount: docB!.pageCount || 1,
    sizeBytes: docB!.sizeBytes,
  };

  const workspaceTitle = `${docA!.displayName} vs ${docB!.displayName}`;

  return (
    <div className="flex flex-col min-h-screen w-full bg-[var(--background)] text-[var(--foreground)] overflow-x-hidden">
      {/* 1. Shared Workspace Navigation */}
      <WorkspaceNav
        documentName={workspaceTitle}
        documentType="Comparison"
      />

      {/* 2. Main Wide Comparison Workspace */}
      <main className="flex-1 w-full max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-5 sm:py-6 space-y-6 text-left">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[var(--border)]">
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] shrink-0">
                <GitCompare className="h-4 w-4" aria-hidden="true" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--foreground)]">
                Compare Documents
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-[var(--foreground-muted)] max-w-4xl leading-relaxed">
              Review clause-level differences between {docA!.displayName} and {docB!.displayName}.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
            <Badge variant="brand" size="sm" dot>
              Active Session ({sessionDocs.length} Documents)
            </Badge>
          </div>
        </div>

        {/* Document Pair Cards */}
        <section aria-label="Compared Documents" className="w-full">
          <DocumentPair
            docA={compDocA}
            docB={compDocB}
          />
        </section>

        {/* Comparison Summary Metrics */}
        <section aria-label="Comparison Summary Metrics" className="w-full">
          <ComparisonSummary metrics={metrics} />
        </section>

        {/* Filter Bar */}
        <div className="pt-1 w-full">
          <ComparisonFilters
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            counts={counts}
          />
        </div>

        {/* Clause-Level Differences List */}
        <section aria-label="Clause Differences" className="space-y-4 pt-1 w-full">
          {filteredChanges.length === 0 && (
            <div className="p-8 text-center rounded-[var(--radius-lg)] border border-dashed border-[var(--border)] text-xs text-[var(--foreground-muted)]">
              No clause differences detected for the selected filter category.
            </div>
          )}

          {filteredChanges.map((change) => (
            <ComparisonChangeCard
              key={change.id}
              change={change}
              onViewEvidence={handleOpenEvidence}
            />
          ))}

          {/* Unchanged Clauses Section */}
          {showUnchanged && unchangedSections.length > 0 && (
            <div className="space-y-3 pt-5 border-t border-[var(--border-muted)] w-full">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground-muted)]">
                  Unchanged Substantive Sections ({unchangedSections.length})
                </h3>
                <span className="text-[11px] text-[var(--foreground-muted)]">
                  Verified identical across Document A and B
                </span>
              </div>

              <div className="space-y-2.5 w-full">
                {unchangedSections.map((sec) => (
                  <UnchangedSectionCard key={sec.id} section={sec} />
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Statutory Informational Guidance Footer */}
        <div className="rounded-[var(--radius-lg)] border border-blue-200/80 dark:border-blue-900/60 bg-blue-50/60 dark:bg-blue-950/20 p-4 flex items-start gap-3 text-xs text-blue-950 dark:text-blue-200 shadow-2xs w-full">
          <Info className="h-4.5 w-4.5 shrink-0 mt-0.5 text-[var(--primary)]" aria-hidden="true" />
          <div className="leading-relaxed max-w-5xl">
            <span className="font-bold mr-1.5 text-blue-950 dark:text-blue-100">Comparison Guidance:</span>
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
        className="max-w-3xl"
      >
        {activeEvidenceChange && (
          <div className="space-y-4 text-left">
            <div className="flex items-center justify-between gap-2 p-2.5 rounded-[var(--radius-md)] bg-[var(--surface-muted)] text-xs">
              <span className="font-semibold text-[var(--foreground)]">
                {activeEvidenceChange.clauseTitle}
              </span>
              <span className="font-mono text-[11px] text-[var(--primary)] font-medium">
                {activeEvidenceChange.sectionA} &rarr; {activeEvidenceChange.sectionB}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs items-stretch">
              {/* Doc A */}
              <div className="p-3.5 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-subtle)] space-y-2 flex flex-col justify-between">
                <div className="flex items-center justify-between text-[11px] text-[var(--foreground-muted)] font-semibold pb-1.5 border-b border-[var(--border-muted)]">
                  <span>Document A ({docA!.displayName})</span>
                  <span className="font-mono">Page {activeEvidenceChange.pageA}</span>
                </div>
                <div className="flex-1 py-1">
                  <p className="italic leading-relaxed text-[var(--foreground-secondary)] font-serif border-l-2 border-red-400 dark:border-red-500/60 pl-2.5">
                    &ldquo;{activeEvidenceChange.docAContent}&rdquo;
                  </p>
                </div>
              </div>

              {/* Doc B */}
              <div className="p-3.5 rounded-[var(--radius-lg)] border border-[var(--primary)]/40 bg-blue-50/40 dark:bg-blue-950/20 space-y-2 flex flex-col justify-between">
                <div className="flex items-center justify-between text-[11px] text-[var(--primary)] font-semibold pb-1.5 border-b border-[var(--primary)]/20">
                  <span>Document B ({docB!.displayName})</span>
                  <span className="font-mono text-[var(--foreground-muted)]">Page {activeEvidenceChange.pageB}</span>
                </div>
                <div className="flex-1 py-1">
                  <p className="italic leading-relaxed text-[var(--foreground)] font-serif border-l-2 border-[var(--primary)] pl-2.5 font-medium">
                    &ldquo;{activeEvidenceChange.docBContent}&rdquo;
                  </p>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-[var(--radius-md)] bg-[var(--surface-muted)] text-[11px] text-[var(--foreground-secondary)] leading-relaxed">
              <span className="font-semibold text-[var(--foreground)] mr-1.5">Summary:</span>
              <span>{activeEvidenceChange.summaryChange}</span>
            </div>

            <div className="flex flex-col xs:flex-row items-stretch xs:items-center justify-between gap-2 pt-2 border-t border-[var(--border-muted)]">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyCitation}
                className="text-xs w-full xs:w-auto"
              >
                {copiedCitation ? "Citation Copied!" : "Copy Comparison Citation"}
              </Button>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsEvidenceModalOpen(false)}
                className="text-xs w-full xs:w-auto"
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
