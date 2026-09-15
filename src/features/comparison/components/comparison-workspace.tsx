"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  GitCompare,
  Info,
  Loader2,
  AlertTriangle,
  RefreshCw,
  UploadCloud,
  Sparkles,
} from "lucide-react";
import { WorkspaceNav } from "@/components/shared";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DocumentPair } from "./document-pair";
import { ComparisonSummary } from "./comparison-summary";
import { ComparisonFilters } from "./comparison-filters";
import { ComparisonChangeCard } from "./comparison-change-card";
import { UnchangedSectionCard } from "./unchanged-section-card";
import { InconsistencyCard } from "./inconsistency-card";
import { ComparisonUploadDialog } from "./comparison-upload-dialog";
import { WorkspaceEmpty } from "@/features/analysis/components/states/workspace-empty";
import { getActiveDocument } from "@/lib/document-storage";
import type { NormalizedDocument } from "@/types/document";
import type {
  ComparisonCategory,
  ComparisonChange,
  ComparisonDocument,
  ComparisonResult,
  ComparisonSummaryMetrics,
} from "@/types/comparison";

const emptySubscribe = () => () => {};

export function ComparisonWorkspace() {
  const router = useRouter();
  const hasMounted = React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  // Storage synchronization version
  const [storageVersion, setStorageVersion] = React.useState(0);

  // Document A: Always the current active user document
  const activeDoc = React.useMemo(() => {
    if (!hasMounted) return null;
    void storageVersion;
    return getActiveDocument();
  }, [hasMounted, storageVersion]);

  // Document B: Fresh, ephemeral upload scoped strictly to this comparison session
  const [tempDocB, setTempDocB] = React.useState<NormalizedDocument | null>(null);
  const [comparisonId, setComparisonId] = React.useState<string | undefined>(undefined);

  // Filter & Evidence Modal State
  const [selectedCategory, setSelectedCategory] = React.useState<ComparisonCategory>("All");
  const [activeEvidenceChange, setActiveEvidenceChange] = React.useState<ComparisonChange | null>(null);
  const [isEvidenceModalOpen, setIsEvidenceModalOpen] = React.useState(false);
  const [copiedCitation, setCopiedCitation] = React.useState(false);

  // In-Workspace Document B Upload Dialog State
  const [isUploadOpen, setIsUploadOpen] = React.useState(false);

  // Async Comparison State
  const [comparisonResult, setComparisonResult] = React.useState<ComparisonResult | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [loadingStage, setLoadingStage] = React.useState<string>("Preparing documents…");
  const [comparisonError, setComparisonError] = React.useState<string | null>(null);
  // Abort controller for in-flight comparison requests
  const compAbortControllerRef = React.useRef<AbortController | null>(null);

  // Listen for storage updates in other tabs/windows or local updates, plus bfcache restoration
  React.useEffect(() => {
    const handleStorage = () => {
      setStorageVersion((v) => v + 1);
    };
    window.addEventListener("storage", handleStorage);
    window.addEventListener("lexiguide-doc-update", handleStorage);
    window.addEventListener("lexiguide-workspace-reset", handleStorage);
    window.addEventListener("pageshow", handleStorage);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("lexiguide-doc-update", handleStorage);
      window.removeEventListener("lexiguide-workspace-reset", handleStorage);
      window.removeEventListener("pageshow", handleStorage);
    };
  }, []);

  // Stale state protection: Invalidate comparison if active Document A changes or is cleared
  const prevActiveDocIdRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    const currentId = activeDoc?.id || null;
    if (prevActiveDocIdRef.current !== currentId) {
      if (compAbortControllerRef.current) {
        compAbortControllerRef.current.abort();
        compAbortControllerRef.current = null;
      }
      setTempDocB(null);
      setComparisonResult(null);
      setComparisonError(null);
      setComparisonId(undefined);
      setIsUploadOpen(false);
      setActiveEvidenceChange(null);
      setIsEvidenceModalOpen(false);
      setSelectedCategory("All");
      prevActiveDocIdRef.current = currentId;
    }
  }, [activeDoc]);

  // Upload handler for Document B
  const handleUploadSuccess = (newDoc: NormalizedDocument, compId?: string) => {
    setTempDocB(newDoc);
    if (compId) {
      setComparisonId(compId);
    }
    setComparisonResult(null);
    setComparisonError(null);
  };

  // Replace Document B (clears only Document B, preserves Document A)
  const handleReplaceDocB = () => {
    setTempDocB(null);
    setComparisonResult(null);
    setComparisonError(null);
    setComparisonId(undefined);
  };

  // Compare With Another Document (clears B and opens fresh upload)
  const handleCompareWithAnother = () => {
    setTempDocB(null);
    setComparisonResult(null);
    setComparisonError(null);
    setComparisonId(undefined);
    setIsUploadOpen(true);
  };

  // Perform Real Comparison Pipeline via POST /api/comparison
  const runComparison = React.useCallback(
    async (targetA: NormalizedDocument, targetB: NormalizedDocument, compId?: string) => {
      if (!targetA || !targetB) return;
      if (targetA.id === targetB.id) {
        setComparisonError("Select two different documents to compare.");
        setComparisonResult(null);
        return;
      }

      if (compAbortControllerRef.current) {
        compAbortControllerRef.current.abort();
      }
      const controller = new AbortController();
      compAbortControllerRef.current = controller;

      setIsLoading(true);
      setComparisonError(null);
      setLoadingStage("Preparing documents…");

      const stageTimer1 = setTimeout(() => {
        setLoadingStage("Mapping corresponding sections…");
      }, 300);
      const stageTimer2 = setTimeout(() => {
        setLoadingStage("Checking clause changes…");
      }, 700);
      const stageTimer3 = setTimeout(() => {
        setLoadingStage("Reviewing significant differences…");
      }, 1400);

      try {
        const response = await fetch("/api/comparison", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            documentAId: targetA.id,
            documentBId: targetB.id,
            comparisonId: compId,
          }),
          signal: controller.signal,
        });

        const data = await response.json();

        // Late response guard: verify Document A is STILL the active document
        const currentActive = getActiveDocument();
        if (!currentActive || currentActive.id !== targetA.id) {
          return;
        }

        if (response.ok && data.success && data.data) {
          setComparisonResult(data.data as ComparisonResult);
        } else {
          const errMsg = data?.error?.message || "Unable to compare the selected documents.";
          setComparisonError(errMsg);
          setComparisonResult(null);
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }
        const currentActive = getActiveDocument();
        if (!currentActive || currentActive.id !== targetA.id) {
          return;
        }
        setComparisonError("Network error occurred while connecting to comparison engine.");
        setComparisonResult(null);
      } finally {
        clearTimeout(stageTimer1);
        clearTimeout(stageTimer2);
        clearTimeout(stageTimer3);
        setIsLoading(false);
      }
    },
    []
  );

  // Evidence Modal Handler
  const handleOpenEvidence = (change: ComparisonChange) => {
    setActiveEvidenceChange(change);
    setIsEvidenceModalOpen(true);
    setCopiedCitation(false);
  };

  const handleCopyCitation = () => {
    if (!activeEvidenceChange) return;
    const citation = `[Comparison Citation] ${activeEvidenceChange.clauseTitle} | Section ${activeEvidenceChange.sectionA} (Page ${activeEvidenceChange.pageA}) vs Section ${activeEvidenceChange.sectionB} (Page ${activeEvidenceChange.pageB}): "${activeEvidenceChange.docBContent}"`;
    navigator.clipboard.writeText(citation).then(() => {
      setCopiedCitation(true);
      setTimeout(() => setCopiedCitation(false), 2000);
    });
  };

  // Filtered Changes & Categorization
  const changes = React.useMemo(() => comparisonResult?.changes || [], [comparisonResult]);
  const inconsistencies = React.useMemo(() => comparisonResult?.inconsistencies || [], [comparisonResult]);
  const unchangedSections = React.useMemo(() => comparisonResult?.unchangedSections || [], [comparisonResult]);

  const filteredChanges = React.useMemo(() => {
    if (selectedCategory === "All") return changes;
    if (selectedCategory === "Major Changes") return changes.filter((c) => c.changeSeverity === "major");
    if (selectedCategory === "Moderate Changes") return changes.filter((c) => c.changeSeverity === "moderate");
    if (selectedCategory === "Minor Changes") return changes.filter((c) => c.changeSeverity === "minor");
    if (selectedCategory === "Unchanged") return [];
    return changes.filter((c) => c.category === selectedCategory);
  }, [changes, selectedCategory]);

  const showUnchanged = selectedCategory === "All" || selectedCategory === "Unchanged";

  const counts: Record<ComparisonCategory, number> = {
    All: changes.length,
    "Major Changes": changes.filter((c) => c.changeSeverity === "major").length,
    "Moderate Changes": changes.filter((c) => c.changeSeverity === "moderate").length,
    "Minor Changes": changes.filter((c) => c.changeSeverity === "minor").length,
    Unchanged: unchangedSections.length,
    Financial: changes.filter((c) => c.category === "Financial").length,
    Obligations: changes.filter((c) => c.category === "Obligations").length,
    Dates: changes.filter((c) => c.category === "Dates").length,
    Risks: changes.filter((c) => c.category === "Risks").length,
    Legal: changes.filter((c) => c.category === "Legal").length,
  };

  const metrics: ComparisonSummaryMetrics = comparisonResult?.metrics || {
    sectionsCompared: (activeDoc?.sections.length || 0) + (tempDocB?.sections.length || 0),
    changesIdentified: changes.length,
    majorChanges: changes.filter((c) => c.changeSeverity === "major").length,
    moderateChanges: changes.filter((c) => c.changeSeverity === "moderate").length,
    minorChanges: changes.filter((c) => c.changeSeverity === "minor").length,
    unchangedCount: unchangedSections.length,
    potentialInconsistencies: inconsistencies.length,
  };

  // STATE 0: No Active Document A
  if (!activeDoc) {
    return (
      <div className="flex flex-col min-h-screen w-full bg-[var(--background)] text-[var(--foreground)]">
        <WorkspaceNav />
        <WorkspaceEmpty
          title="No document selected"
          description="Upload a legal document first. It will become the document you can analyze and compare."
          actionText="Upload Document"
          actionHref="/#upload-section"
        />
      </div>
    );
  }

  // Prepared Comparison Document Objects
  const compDocA: ComparisonDocument = {
    id: activeDoc.id,
    name: activeDoc.displayName,
    versionLabel: "Document A (Baseline)",
    type: (activeDoc.format || "PDF").toUpperCase(),
    pageCount: activeDoc.pageCount || 1,
    sizeBytes: activeDoc.sizeBytes,
  };

  const compDocB: ComparisonDocument | null = tempDocB
    ? {
        id: tempDocB.id,
        name: tempDocB.displayName,
        versionLabel: "Document B (Target)",
        type: (tempDocB.format || "PDF").toUpperCase(),
        pageCount: tempDocB.pageCount || 1,
        sizeBytes: tempDocB.sizeBytes,
      }
    : null;

  const isSameDoc = tempDocB ? activeDoc.id === tempDocB.id : false;
  const workspaceTitle = tempDocB
    ? `${activeDoc.displayName} vs ${tempDocB.displayName}`
    : `Compare: ${activeDoc.displayName}`;

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
              Review clause-level differences and potential inconsistencies between your active document and a second document you upload.
            </p>
          </div>

          {tempDocB && comparisonResult && (
            <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCompareWithAnother}
                leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
                className="text-xs"
              >
                Compare With Another Document
              </Button>
            </div>
          )}
        </div>

        {/* Document Pair Cards (Active Baseline A vs Ephemeral Target B) */}
        <section aria-label="Compared Documents" className="w-full">
          <DocumentPair
            docA={compDocA}
            docB={compDocB}
            onUploadDocB={() => setIsUploadOpen(true)}
            onReplaceDocB={handleReplaceDocB}
            isProcessingB={isLoading}
          />
        </section>

        {/* Same Document Conflict Alert */}
        {isSameDoc && (
          <div className="p-4 rounded-[var(--radius-lg)] border border-amber-300 dark:border-amber-800/60 bg-amber-50/70 dark:bg-amber-950/20 text-xs text-amber-950 dark:text-amber-200 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" aria-hidden="true" />
              <span className="font-medium">
                Document A and Document B are identical. Please upload a different document version to detect changes.
              </span>
            </div>
          </div>
        )}

        {/* Ready to Compare Banner (When Document B is uploaded, but comparison not yet run) */}
        {tempDocB && !isSameDoc && !comparisonResult && !isLoading && (
          <div className="p-5 rounded-[var(--radius-xl)] border border-[var(--primary)]/30 bg-blue-50/50 dark:bg-blue-950/20 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <h3 className="text-sm font-semibold text-[var(--foreground)]">
                Second Document Ready for Comparison
              </h3>
              <p className="text-xs text-[var(--foreground-muted)]">
                Both documents are indexed. Run clause-level diff analysis and inconsistency detection.
              </p>
            </div>

            <Button
              variant="primary"
              size="md"
              onClick={() => runComparison(activeDoc, tempDocB, comparisonId)}
              leftIcon={<Sparkles className="h-4 w-4" />}
              className="w-full sm:w-auto px-6 justify-center shadow-sm"
            >
              Compare Documents
            </Button>
          </div>
        )}

        {/* Comparison Error State */}
        {comparisonError && !isSameDoc && (
          <div className="p-4 rounded-[var(--radius-lg)] border border-red-200 dark:border-red-900/60 bg-red-50/70 dark:bg-red-950/20 text-xs text-red-950 dark:text-red-200 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" aria-hidden="true" />
              <span>{comparisonError}</span>
            </div>
            {tempDocB && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => runComparison(activeDoc, tempDocB, comparisonId)}
                leftIcon={<RefreshCw className="h-3 w-3" />}
                className="text-xs shrink-0"
              >
                Retry
              </Button>
            )}
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="p-12 text-center rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface-muted)] space-y-3">
            <Loader2 className="h-6 w-6 animate-spin text-[var(--primary)] mx-auto" />
            <p className="text-xs font-medium text-[var(--foreground)]">{loadingStage}</p>
            <p className="text-[11px] text-[var(--foreground-muted)]">
              Identifying substantive clause modifications and potential cross-provision conflicts.
            </p>
          </div>
        )}

        {/* Comparison Results Content */}
        {!isLoading && !isSameDoc && comparisonResult && (
          <>
            {/* Comparison Summary Metrics */}
            <section aria-label="Comparison Summary Metrics" className="w-full">
              <ComparisonSummary metrics={metrics} />
            </section>

            {/* Potential Inconsistencies Section (when present) */}
            {inconsistencies.length > 0 && (
              <section aria-label="Potential Inconsistencies" className="space-y-3 pt-2 w-full">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <h2 className="text-sm font-bold tracking-tight text-[var(--foreground)]">
                      Potential Inconsistencies &amp; Conflicts ({inconsistencies.length})
                    </h2>
                  </div>
                  <span className="text-[11px] text-[var(--foreground-muted)]">
                    Discrepancies identified between contract provisions
                  </span>
                </div>

                <div className="space-y-3 w-full">
                  {inconsistencies.map((inc, index) => (
                    <InconsistencyCard key={`${inc.id || "inc"}_${index}`} inconsistency={inc} />
                  ))}
                </div>
              </section>
            )}

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
              {filteredChanges.length === 0 && selectedCategory !== "Unchanged" && (
                <div className="p-8 text-center rounded-[var(--radius-lg)] border border-dashed border-[var(--border)] text-xs text-[var(--foreground-muted)]">
                  {changes.length === 0
                    ? "No substantive changes detected. The compared documents appear identical in core terms."
                    : "No clause differences detected for the selected filter category."}
                </div>
              )}

              {filteredChanges.map((change, index) => (
                <ComparisonChangeCard
                  key={`${change.id || "change"}_${index}`}
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
                      Verified identical wording across Document A and B
                    </span>
                  </div>

                  <div className="space-y-2.5 w-full">
                    {unchangedSections.map((sec, index) => (
                      <UnchangedSectionCard key={`${sec.id || "sec"}_${index}`} section={sec} />
                    ))}
                  </div>
                </div>
              )}
            </section>
          </>
        )}

        {/* Statutory Informational Guidance Footer */}
        <div className="rounded-[var(--radius-lg)] border border-blue-200/80 dark:border-blue-900/60 bg-blue-50/60 dark:bg-blue-950/20 p-4 flex items-start gap-3 text-xs text-blue-950 dark:text-blue-200 shadow-2xs w-full">
          <Info className="h-4.5 w-4.5 shrink-0 mt-0.5 text-[var(--primary)]" aria-hidden="true" />
          <div className="leading-relaxed max-w-5xl">
            <span className="font-bold mr-1.5 text-blue-950 dark:text-blue-100">Comparison Guidance:</span>
            Findings are grounded in the uploaded document. Potential concerns and identified discrepancies are informational review points, not legal conclusions. Always consult qualified legal counsel for binding legal advice.
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
        {activeEvidenceChange && tempDocB && (
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
                  <span>Document A ({activeDoc.displayName})</span>
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
                  <span>Document B ({tempDocB.displayName})</span>
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

      {/* Ephemeral Document B Upload Dialog */}
      <ComparisonUploadDialog
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        existingDocName={activeDoc.displayName}
        comparisonId={comparisonId}
        onUploadSuccess={handleUploadSuccess}
      />
    </div>
  );
}
