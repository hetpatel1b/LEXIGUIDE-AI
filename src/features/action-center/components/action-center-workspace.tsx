"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  CheckSquare,
  FileText,
  Info,
  BookOpen,
  Copy,
  RotateCcw,
} from "lucide-react";
import { WorkspaceNav } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ActionSummary } from "./action-summary";
import { ActionFilters } from "./action-filters";
import { ActionItemCard } from "./action-item-card";
import { WorkspaceEmpty } from "@/features/analysis/components/states/workspace-empty";
import { getActiveDocument, getCachedAnalysis } from "@/lib/document-storage";
import type { ActionCategory, ActionItem } from "@/types";
import type { NormalizedDocument } from "@/types/document";
import type { AnalysisResult } from "@/lib/ai/types";

const emptySubscribe = () => () => {};

export function ActionCenterWorkspace() {
  const router = useRouter();
  const hasMounted = React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
  const [checkedIds, setCheckedIds] = React.useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = React.useState<"all" | ActionCategory>("all");
  const [activeEvidenceItem, setActiveEvidenceItem] = React.useState<ActionItem | null>(null);
  const [isEvidenceOpen, setIsEvidenceOpen] = React.useState(false);
  const [copiedCitation, setCopiedCitation] = React.useState(false);

  // Storage synchronization version
  const [storageVersion, setStorageVersion] = React.useState(0);

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

  const activeDoc = React.useMemo(() => {
    if (!hasMounted) return null;
    void storageVersion;
    return getActiveDocument();
  }, [hasMounted, storageVersion]);

  // Reset Action Center state when document changes or is cleared
  const currentDocId = activeDoc?.id || null;
  const prevDocIdRef = React.useRef<string | null>(currentDocId);
  React.useEffect(() => {
    if (prevDocIdRef.current !== currentDocId) {
      prevDocIdRef.current = currentDocId;
      setCheckedIds(new Set());
      setSelectedCategory("all");
      setActiveEvidenceItem(null);
      setIsEvidenceOpen(false);
    }
  }, [currentDocId]);

  const analysis = React.useMemo(() => {
    if (!activeDoc) return null;
    void storageVersion;
    return getCachedAnalysis(activeDoc.id);
  }, [activeDoc, storageVersion]);

  // Derive dynamic action items from real analysis
  const items: ActionItem[] = React.useMemo(() => {
    if (!analysis) return [];
    const generatedItems: ActionItem[] = [];

    // 1. From Potential Concerns -> "review" or "discuss"
    analysis.potentialConcerns.forEach((c, idx) => {
      const id = `act-concern-${idx}`;
      generatedItems.push({
        id,
        category: c.severity === "high" ? "review" : "discuss",
        status: c.severity === "high" ? "needs_review" : "discuss",
        title: c.title,
        description: c.suggestedReviewQuestion || c.whyItMatters || c.explanation,
        whyItMatters: c.whyItMatters,
        sourceSection: c.source.sectionTitle || c.source.sectionId || "Section",
        pageNumber: c.source.pageNumber || 1,
        evidenceSnippet: c.source.quote,
        isChecked: checkedIds.has(id),
      });
    });

    // 2. From Obligations -> "upcoming" (if deadline) or "confirm"
    analysis.obligations.forEach((o, idx) => {
      const id = `act-ob-${idx}`;
      generatedItems.push({
        id,
        category: o.deadline ? "upcoming" : "confirm",
        status: o.deadline ? "upcoming" : "confirm",
        title: `Obligation: ${o.party}`,
        description: `${o.description}${o.deadline ? ` (Due: ${o.deadline})` : ""}`,
        sourceSection: o.source.sectionTitle || o.source.sectionId || "Section",
        pageNumber: o.source.pageNumber || 1,
        evidenceSnippet: o.source.quote,
        isChecked: checkedIds.has(id),
      });
    });

    // 3. From Important Dates -> "upcoming"
    analysis.importantDates.forEach((dt, idx) => {
      const id = `act-date-${idx}`;
      generatedItems.push({
        id,
        category: "upcoming",
        status: "upcoming",
        title: dt.label,
        description: `Contractual timeline: ${dt.dateOrDuration}`,
        sourceSection: dt.source.sectionTitle || dt.source.sectionId || "Dates",
        pageNumber: dt.source.pageNumber || 1,
        evidenceSnippet: dt.source.quote,
        isChecked: checkedIds.has(id),
      });
    });

    // 4. From Review Priorities -> "discuss"
    analysis.executiveSummary.reviewPriorities.forEach((rp, idx) => {
      const id = `act-rp-${idx}`;
      generatedItems.push({
        id,
        category: "discuss",
        status: "discuss",
        title: `Review Consideration ${idx + 1}`,
        description: rp,
        sourceSection: "Executive Review",
        pageNumber: 1,
        evidenceSnippet: rp,
        isChecked: checkedIds.has(id),
      });
    });

    // 5. From comparison custom action items in sessionStorage
    try {
      if (typeof window !== "undefined") {
        const rawCustom = window.sessionStorage.getItem("lexiguide_custom_action_items");
        if (rawCustom) {
          const customList = JSON.parse(rawCustom) as ActionItem[];
          customList.forEach((c) => {
            generatedItems.push({
              ...c,
              isChecked: checkedIds.has(c.id),
            });
          });
        }
      }
    } catch {}

    return generatedItems;
  }, [analysis, checkedIds]);

  // Toggle checklist item
  const handleToggleCheck = (id: string) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleResetChecklist = () => {
    setCheckedIds(new Set());
  };

  // Compute counts
  const counts = React.useMemo(() => {
    return {
      all: items.length,
      review: items.filter((i) => i.category === "review").length,
      upcoming: items.filter((i) => i.category === "upcoming").length,
      confirm: items.filter((i) => i.category === "confirm").length,
      discuss: items.filter((i) => i.category === "discuss").length,
    };
  }, [items]);

  // Compute dynamic metrics
  const completedCount = items.filter((i) => i.isChecked).length;
  const metrics = React.useMemo(() => {
    return {
      total: items.length,
      completed: completedCount,
      reviewCount: counts.review,
      upcomingCount: counts.upcoming,
      confirmCount: counts.confirm,
      discussCount: counts.discuss,
    };
  }, [items, completedCount, counts]);

  // Filtered items
  const filteredItems = React.useMemo(() => {
    if (selectedCategory === "all") return items;
    return items.filter((i) => i.category === selectedCategory);
  }, [items, selectedCategory]);

  const handleOpenEvidence = (item: ActionItem) => {
    setActiveEvidenceItem(item);
    setIsEvidenceOpen(true);
  };

  const handleCopyCitation = async () => {
    if (!activeEvidenceItem || !activeDoc) return;
    const text = `Action Reference: ${activeEvidenceItem.title}\nSource: ${activeDoc.displayName}, ${activeEvidenceItem.sourceSection}, Page ${activeEvidenceItem.pageNumber}\nExcerpt: "${activeEvidenceItem.evidenceSnippet}"`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCitation(true);
      setTimeout(() => setCopiedCitation(false), 2000);
    } catch {
      setCopiedCitation(true);
      setTimeout(() => setCopiedCitation(false), 2000);
    }
  };

  // Prevent flash during hydration
  if (!hasMounted) {
    return (
      <div className="flex flex-col min-h-screen w-full bg-[var(--background)] text-[var(--foreground)]">
        <WorkspaceNav />
        <div className="flex-1 flex items-center justify-center p-6 text-xs text-[var(--foreground-muted)]">
          Loading Action Center…
        </div>
      </div>
    );
  }

  // 1. No Active Document
  if (!activeDoc) {
    return (
      <div className="flex flex-col min-h-screen w-full bg-[var(--background)] text-[var(--foreground)]">
        <WorkspaceNav />
        <div className="flex-1 flex items-center justify-center p-6">
          <WorkspaceEmpty
            title="No document available for Action Center"
            description="Upload a legal document in the Analysis workspace first to generate actionable checklists and review points."
            onUploadClick={() => router.push("/analyze")}
          />
        </div>
      </div>
    );
  }

  // 2. Active Document Present but not yet analyzed
  if (!analysis) {
    return (
      <div className="flex flex-col min-h-screen w-full bg-[var(--background)] text-[var(--foreground)]">
        <WorkspaceNav
          documentName={activeDoc.displayName}
          documentType={activeDoc.format.toUpperCase()}
        />
        <div className="flex-1 flex items-center justify-center p-6">
          <WorkspaceEmpty
            title="Document analysis required"
            description={`"${activeDoc.displayName}" is ready, but has not yet been analyzed. Run document analysis to generate structured review tasks and obligations.`}
            onUploadClick={() => router.push("/analyze")}
          />
        </div>
      </div>
    );
  }

  // 3. Active Document Analyzed
  return (
    <div className="flex flex-col min-h-screen w-full bg-[var(--background)] text-[var(--foreground)] overflow-x-hidden">
      {/* 1. Shared Workspace Navigation */}
      <WorkspaceNav
        documentName={activeDoc.displayName}
        documentType={analysis.metadata.documentType || "Legal Document"}
      />

      {/* 2. Main Wide Action Center Workspace */}
      <main className="flex-1 w-full max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-5 sm:py-6 space-y-6 text-left">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[var(--border)]">
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] shrink-0">
                <CheckSquare className="h-4 w-4" aria-hidden="true" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--foreground)]">
                Action Center
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-[var(--foreground-muted)] max-w-4xl leading-relaxed">
              Actionable review items, compliance duties, and milestones derived from {activeDoc.displayName}.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetChecklist}
              leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
              className="text-xs font-medium"
              title="Reset checklist progress"
            >
              Reset Checklist
            </Button>
          </div>
        </div>

        {/* Action Summary Cards & Progress */}
        <section aria-label="Action Summary" className="w-full">
          <ActionSummary
            metrics={metrics}
            completedCount={completedCount}
            totalCount={items.length}
          />
        </section>

        {/* Category Filters */}
        <div className="pt-1 w-full">
          <ActionFilters
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            counts={counts}
          />
        </div>

        {/* Action Items List */}
        <section aria-label="Action Items Checklist" className="space-y-3.5 pt-1 w-full">
          {filteredItems.map((item, index) => (
            <ActionItemCard
              key={`${item.id || "item"}_${index}`}
              item={item}
              onToggleCheck={handleToggleCheck}
              onViewEvidence={handleOpenEvidence}
            />
          ))}

          {filteredItems.length === 0 && (
            <div className="p-8 text-center rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] text-xs text-[var(--foreground-muted)] w-full">
              No action items found in this category.
            </div>
          )}
        </section>

        {/* Statutory Legal Disclaimer */}
        <div className="rounded-[var(--radius-lg)] border border-amber-200/80 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/20 p-4 flex items-start gap-3 text-xs text-amber-950 dark:text-amber-200 shadow-2xs w-full">
          <Info className="h-4.5 w-4.5 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
          <div className="leading-relaxed max-w-5xl">
            <span className="font-bold mr-1.5 text-amber-950 dark:text-amber-100">Action Center Guidance:</span>
            Findings are grounded in the uploaded document. Action items are structured informational review points, not legal conclusions or formal legal advice. Always consult qualified legal counsel for binding legal decisions.
          </div>
        </div>
      </main>

      {/* Evidence Modal Dialog */}
      <Dialog
        isOpen={isEvidenceOpen}
        onClose={() => setIsEvidenceOpen(false)}
        title="Action Source Evidence"
        description="Contractual passage grounding this action item."
        className="max-w-2xl"
      >
        {activeEvidenceItem && (
          <div className="space-y-4 text-left">
            <div className="flex items-center justify-between gap-2 p-2.5 rounded-[var(--radius-md)] bg-[var(--surface-muted)] text-xs font-mono">
              <span className="font-semibold text-[var(--foreground)] truncate max-w-[280px]">
                {activeEvidenceItem.title}
              </span>
              <div className="flex items-center gap-1.5 shrink-0">
                <Badge variant="brand" size="sm">
                  {activeEvidenceItem.sourceSection}
                </Badge>
                <Badge variant="neutral" size="sm">
                  Page {activeEvidenceItem.pageNumber}
                </Badge>
              </div>
            </div>

            <div className="p-4 rounded-[var(--radius-lg)] border-l-4 border-[var(--primary)] bg-[var(--surface-subtle)] border border-[var(--border)]">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--primary)] mb-2">
                <BookOpen className="h-3.5 w-3.5" />
                <span>Extracted Contract Text</span>
              </div>
              <p className="text-sm italic leading-relaxed text-[var(--foreground)] font-serif">
                &ldquo;{activeEvidenceItem.evidenceSnippet}&rdquo;
              </p>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[var(--border-muted)]">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyCitation}
                className="text-xs"
              >
                {copiedCitation ? "Citation Copied!" : "Copy Citation"}
              </Button>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsEvidenceOpen(false)}
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
