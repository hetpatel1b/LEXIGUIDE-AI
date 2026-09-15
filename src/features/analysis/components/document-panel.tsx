"use client";

import * as React from "react";
import {
  FileText,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { IconButton } from "@/components/ui/icon-button";
import { cn } from "@/lib/utils";
import { DocumentMetadata } from "./document-metadata";
import { SectionList } from "./section-list";
import { PageList } from "./page-list";
import type { DocumentSectionItem } from "@/types";
import type { NormalizedDocument } from "@/types/document";

export interface DocumentPanelProps {
  document?: NormalizedDocument | null;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  selectedSectionId?: string;
  onSelectSection?: (section: DocumentSectionItem) => void;
  selectedPage?: number;
  onSelectPage?: (pageNumber: number) => void;
  className?: string;
}

export function DocumentPanel({
  document,
  isCollapsed,
  onToggleCollapse,
  selectedSectionId,
  onSelectSection,
  selectedPage,
  onSelectPage,
  className,
}: DocumentPanelProps) {
  if (isCollapsed) {
    return (
      <div
        className={cn(
          "w-12 shrink-0 border-r border-[var(--border)] bg-[var(--surface-subtle)] flex flex-col items-center py-4 gap-4",
          className
        )}
      >
        <IconButton
          size="sm"
          variant="ghost"
          onClick={onToggleCollapse}
          aria-label="Open document navigation"
          title="Open document navigation"
          className="text-[var(--foreground-secondary)] hover:text-[var(--primary)]"
        >
          <PanelLeftOpen className="h-4 w-4" />
        </IconButton>

        <div className="flex-1 flex flex-col items-center justify-start pt-4 gap-6">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-600"
            title={`${document ? document.displayName : "No document"} (${document ? document.format.toUpperCase() : "—"})`}
          >
            <FileText className="h-4 w-4" />
          </div>

          <div className="[writing-mode:vertical-rl] rotate-180 text-[11px] font-medium text-[var(--foreground-muted)] tracking-wider">
            Document Navigation
          </div>
        </div>
      </div>
    );
  }

  // Pre-map sections for SectionList if a real document is present
  const mappedSections: DocumentSectionItem[] = document
    ? document.sections.map((s) => ({
        id: s.sectionId,
        sectionNumber: s.sectionNumber || "•",
        title: s.title,
        pageNumber: s.pageReferences.length > 0 ? s.pageReferences[0] : 1,
      }))
    : [];

  // Pre-map pages for PageList if a real document is present
  const mappedPages = document
    ? document.pages.map((p, idx) => ({
        pageNumber: p.pageNumber || idx + 1,
        title: p.pageNumber ? `Page ${p.pageNumber}` : `Block ${idx + 1}`,
        subtitle: `${p.wordCount} words`,
      }))
    : undefined;

  const docName = document ? document.displayName : "No document";
  const docFormat = document ? document.format.toUpperCase() : "—";
  const pageLabel = document
    ? document.pageCount !== null
      ? `${document.pageCount}p`
      : `${document.sections.length} sec`
    : "0p";

  return (
    <aside
      aria-label="Document Explorer & Navigation"
      className={cn(
        "w-full lg:w-[280px] shrink-0 border-r border-[var(--border)] bg-[var(--surface-subtle)] flex flex-col h-full overflow-hidden",
        className
      )}
    >
      {/* Document Identity Header */}
      <div className="p-3 sm:p-3.5 border-b border-[var(--border)] bg-[var(--surface)] shrink-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-50 border border-red-200/60 text-red-600">
              <FileText className="h-4 w-4" aria-hidden="true" />
            </div>

            <div className="min-w-0 text-left">
              <h3
                className="text-xs font-semibold text-[var(--foreground)] truncate max-w-[170px]"
                title={docName}
              >
                {docName}
              </h3>
              <div className="flex items-center gap-1.5 text-[11px] text-[var(--foreground-muted)] font-mono">
                <span>{docFormat} · {pageLabel}</span>
                <span aria-hidden="true">&bull;</span>
                <Badge variant={document ? "brand" : "neutral"} size="sm">
                  {document ? "Ingested" : "No Document"}
                </Badge>
              </div>
            </div>
          </div>

          <IconButton
            size="sm"
            variant="ghost"
            onClick={onToggleCollapse}
            aria-label="Close document navigation"
            title="Close document navigation"
            className="text-[var(--foreground-muted)] hover:text-[var(--foreground)] shrink-0"
          >
            <PanelLeftClose className="h-4 w-4" />
          </IconButton>
        </div>
      </div>

      {/* Single Coherent Scrollable Container for Metadata, Sections & Navigator */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-3.5 space-y-4 [scrollbar-gutter:stable]">
        {/* Document Metadata Details */}
        <DocumentMetadata document={document} />

        {/* Section Navigation */}
        <SectionList
          sections={document ? mappedSections : undefined}
          selectedSectionId={selectedSectionId}
          onSelectSection={onSelectSection}
        />

        {/* Page Navigation */}
        <PageList
          pages={mappedPages}
          selectedPage={selectedPage}
          onSelectPage={onSelectPage}
        />
      </div>
    </aside>
  );
}
