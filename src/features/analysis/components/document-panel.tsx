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
import { SAMPLE_DOCUMENT } from "../fixtures/analysis-fixture";
import type { DocumentSectionItem } from "@/types";

export interface DocumentPanelProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  selectedSectionId?: string;
  onSelectSection?: (section: DocumentSectionItem) => void;
  selectedPage?: number;
  onSelectPage?: (pageNumber: number) => void;
  className?: string;
}

export function DocumentPanel({
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
          "w-12 shrink-0 border-r border-[var(--border)] bg-[var(--surface-subtle)] flex flex-col items-center py-4 gap-4 transition-all",
          className
        )}
      >
        <IconButton
          size="sm"
          variant="ghost"
          onClick={onToggleCollapse}
          aria-label="Open Document Panel"
          title="Open Document Panel"
          className="text-[var(--foreground-secondary)] hover:text-[var(--primary)]"
        >
          <PanelLeftOpen className="h-4 w-4" />
        </IconButton>

        <div className="flex-1 flex flex-col items-center justify-start pt-4 gap-6">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-600"
            title={`${SAMPLE_DOCUMENT.name} (PDF, 18 pages)`}
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

  return (
    <aside
      aria-label="Document Explorer & Navigation"
      className={cn(
        "w-72 lg:w-80 shrink-0 border-r border-[var(--border)] bg-[var(--surface-subtle)] flex flex-col h-full transition-all overflow-hidden",
        className
      )}
    >
      {/* Document Identity Header */}
      <div className="p-4 border-b border-[var(--border)] bg-[var(--surface)] shrink-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-50 border border-red-200/60 text-red-600">
              <FileText className="h-5 w-5" aria-hidden="true" />
            </div>

            <div className="min-w-0 text-left">
              <h3
                className="text-xs font-semibold text-[var(--foreground)] truncate max-w-[170px]"
                title={SAMPLE_DOCUMENT.name}
              >
                {SAMPLE_DOCUMENT.name}
              </h3>
              <div className="flex items-center gap-1.5 text-[11px] text-[var(--foreground-muted)] font-mono">
                <span>PDF · {SAMPLE_DOCUMENT.pageCount} pages</span>
                <span aria-hidden="true">&bull;</span>
                <Badge variant="success" size="sm">
                  Analyzed
                </Badge>
              </div>
            </div>
          </div>

          <IconButton
            size="sm"
            variant="ghost"
            onClick={onToggleCollapse}
            aria-label="Collapse Document Panel"
            title="Collapse Document Panel"
            className="text-[var(--foreground-muted)] hover:text-[var(--foreground)] shrink-0"
          >
            <PanelLeftClose className="h-4 w-4" />
          </IconButton>
        </div>
      </div>

      {/* Scrollable Document Details & Navigators */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Document Metadata Details */}
        <DocumentMetadata />

        {/* Section Navigation */}
        <SectionList
          selectedSectionId={selectedSectionId}
          onSelectSection={onSelectSection}
        />

        {/* Page Navigation */}
        <PageList
          selectedPage={selectedPage}
          onSelectPage={onSelectPage}
        />
      </div>
    </aside>
  );
}
