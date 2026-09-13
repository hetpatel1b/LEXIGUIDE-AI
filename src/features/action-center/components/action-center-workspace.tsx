"use client";

import * as React from "react";
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
import {
  INITIAL_ACTION_ITEMS,
  ACTION_CENTER_METRICS,
} from "../fixtures/action-center-fixture";
import type { ActionCategory, ActionItem } from "@/types";

export function ActionCenterWorkspace() {
  const [items, setItems] = React.useState<ActionItem[]>(INITIAL_ACTION_ITEMS);
  const [selectedCategory, setSelectedCategory] = React.useState<"all" | ActionCategory>("all");
  const [activeEvidenceItem, setActiveEvidenceItem] = React.useState<ActionItem | null>(null);
  const [isEvidenceOpen, setIsEvidenceOpen] = React.useState(false);
  const [copiedCitation, setCopiedCitation] = React.useState(false);

  // Toggle checklist item
  const handleToggleCheck = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isChecked: !item.isChecked } : item
      )
    );
  };

  const handleResetChecklist = () => {
    setItems(INITIAL_ACTION_ITEMS);
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
    if (!activeEvidenceItem) return;
    const text = `Action Reference: ${activeEvidenceItem.title}\nSource: Employment_Agreement_2026.pdf, ${activeEvidenceItem.sourceSection}, Page ${activeEvidenceItem.pageNumber}\nExcerpt: "${activeEvidenceItem.evidenceSnippet}"`;
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

      {/* 2. Main Action Center Area */}
      <main className="flex-1 max-w-[1600px] mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-6 text-left">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[var(--border)]">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)]">
                <CheckSquare className="h-4 w-4" aria-hidden="true" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--foreground)]">
                Action Center
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-[var(--foreground-muted)]">
              Turn document findings into clear, structured next steps and professional consultation points.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetChecklist}
              leftIcon={<RotateCcw className="h-3 w-3" />}
              className="text-xs"
              title="Reset checklist progress"
            >
              Reset Checklist
            </Button>
          </div>
        </div>

        {/* Action Summary Cards & Progress */}
        <section aria-label="Action Summary">
          <ActionSummary
            metrics={metrics}
            completedCount={completedCount}
            totalCount={items.length}
          />
        </section>

        {/* Category Filters */}
        <div className="pt-2">
          <ActionFilters
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            counts={counts}
          />
        </div>

        {/* Action Items List */}
        <section aria-label="Action Items Checklist" className="space-y-3.5 pt-1">
          {filteredItems.map((item) => (
            <ActionItemCard
              key={item.id}
              item={item}
              onToggleCheck={handleToggleCheck}
              onViewEvidence={handleOpenEvidence}
            />
          ))}

          {filteredItems.length === 0 && (
            <div className="p-8 text-center rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] text-xs text-[var(--foreground-muted)]">
              No action items found in this category.
            </div>
          )}
        </section>

        {/* Statutory Legal Disclaimer */}
        <div className="rounded-[var(--radius-lg)] border border-amber-200/80 bg-amber-50/70 p-3.5 flex items-start gap-2.5 text-xs text-amber-950">
          <Info className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
          <div className="leading-relaxed">
            <span className="font-semibold mr-1">Action Center Guidance:</span>
            LexiGuide AI highlights practical points to consider, clarify, and discuss. Action Center items represent structured informational organization and do not constitute formal legal representation, attorney-client advice, or guaranteed outcomes.
          </div>
        </div>
      </main>

      {/* Evidence Modal Dialog */}
      <Dialog
        isOpen={isEvidenceOpen}
        onClose={() => setIsEvidenceOpen(false)}
        title="Action Source Evidence"
        description="Contractual passage grounding this action item."
        className="max-w-xl"
      >
        {activeEvidenceItem && (
          <div className="space-y-4 text-left">
            <div className="flex items-center justify-between gap-2 p-2.5 rounded-[var(--radius-md)] bg-[var(--surface-muted)] text-xs font-mono">
              <span className="font-semibold text-[var(--foreground)] truncate max-w-[220px]">
                {activeEvidenceItem.title}
              </span>
              <div className="flex items-center gap-1.5">
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
