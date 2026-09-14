"use client";

import * as React from "react";
import Link from "next/link";
import {
  FileText,
  Layers,
  FileCheck,
  Sparkles,
  ArrowRight,
  UploadCloud,
  CheckCircle2,
  Info,
  BookOpen,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { NormalizedDocument } from "@/types/document";
import type { DocumentSectionItem } from "@/types";

export interface RealDocumentViewProps {
  document: NormalizedDocument;
  selectedSection?: DocumentSectionItem | null;
  selectedPage?: number;
  onSelectSection?: (section: DocumentSectionItem) => void;
}

export function RealDocumentView({
  document,
  selectedSection,
  selectedPage = 1,
  onSelectSection,
}: RealDocumentViewProps) {
  // Find current section in document
  const activeSection =
    document.sections.find((s) => s.sectionId === selectedSection?.id) ||
    document.sections[0];

  // Chunks belonging to this section
  const sectionChunks = document.chunks.filter(
    (c) => c.sectionId === activeSection?.sectionId
  );

  return (
    <div className="space-y-6 text-left">
      {/* 1. Phase 2 Document Engine Header Banner */}
      <div className="rounded-[var(--radius-xl)] border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/30 p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1.5 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="brand" size="sm">
                Phase 2 Engine Complete
              </Badge>
              <Badge variant="neutral" size="sm">
                Deterministic Processing
              </Badge>
              <span className="text-xs text-[var(--foreground-muted)] font-mono">
                {document.id}
              </span>
            </div>

            <h2 className="text-lg sm:text-xl font-bold text-[var(--foreground)] tracking-tight">
              {document.displayName}
            </h2>

            <p className="text-xs sm:text-sm text-[var(--foreground-secondary)] max-w-2xl">
              Source text extracted, page boundaries preserved, legal sections detected, and retrieval chunks indexed without AI hallucination.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Button
              href="/"
              variant="ghost"
              size="sm"
              leftIcon={<UploadCloud className="h-3.5 w-3.5" />}
              className="text-xs"
            >
              Upload New
            </Button>
          </div>
        </div>

        {/* Technical Document Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 mt-4 border-t border-blue-200/60 dark:border-blue-900/40 text-xs font-mono">
          <div className="bg-[var(--surface)] p-2.5 rounded-lg border border-[var(--border-muted)]">
            <span className="text-[10px] text-[var(--foreground-muted)] block uppercase">Format &amp; Pages</span>
            <span className="font-semibold text-sm text-[var(--foreground)]">
              {document.format.toUpperCase()}
              {document.pageCount ? ` (${document.pageCount} pages)` : " (Single Stream)"}
            </span>
          </div>

          <div className="bg-[var(--surface)] p-2.5 rounded-lg border border-[var(--border-muted)]">
            <span className="text-[10px] text-[var(--foreground-muted)] block uppercase">Word Count</span>
            <span className="font-semibold text-sm text-[var(--foreground)]">
              {document.wordCount.toLocaleString()} words
            </span>
          </div>

          <div className="bg-[var(--surface)] p-2.5 rounded-lg border border-[var(--border-muted)]">
            <span className="text-[10px] text-[var(--foreground-muted)] block uppercase">Sections Detected</span>
            <span className="font-semibold text-sm text-[var(--foreground)]">
              {document.sections.length} sections
            </span>
          </div>

          <div className="bg-[var(--surface)] p-2.5 rounded-lg border border-[var(--border-muted)]">
            <span className="text-[10px] text-[var(--foreground-muted)] block uppercase">Retrieval Chunks</span>
            <span className="font-semibold text-sm text-[var(--foreground)]">
              {document.chunks.length} chunks
            </span>
          </div>
        </div>
      </div>

      {/* 2. Active Section / Passage Reader */}
      {activeSection && (
        <div className="rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border-muted)]">
            <div className="space-y-0.5 min-w-0">
              <div className="flex items-center gap-2">
                {activeSection.sectionNumber && (
                  <Badge variant="neutral" size="sm" className="font-mono">
                    {activeSection.sectionNumber}
                  </Badge>
                )}
                <h3 className="text-base sm:text-lg font-semibold text-[var(--foreground)] truncate">
                  {activeSection.title}
                </h3>
              </div>
              <div className="flex items-center gap-3 text-xs text-[var(--foreground-muted)] font-mono">
                {activeSection.pageReferences.length > 0 && (
                  <span>
                    Pages: {activeSection.pageReferences.join(", ")}
                  </span>
                )}
                <span>&bull;</span>
                <span>{activeSection.characterCount} chars</span>
                <span>&bull;</span>
                <span>{sectionChunks.length} chunks</span>
              </div>
            </div>

            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Source Provenance Traceable
            </span>
          </div>

          {/* Extracted Raw Section Passage */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground-muted)] flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5" />
              Normalized Legal Text Passage
            </h4>

            <div className="p-4 rounded-lg bg-[var(--surface-subtle)] border border-[var(--border-muted)] max-h-[340px] overflow-y-auto">
              <pre className="text-xs sm:text-sm font-serif leading-relaxed text-[var(--foreground)] whitespace-pre-wrap select-text">
                {document.chunks
                  .filter((c) => c.sectionId === activeSection.sectionId)
                  .map((c) => c.text)
                  .join("\n\n") || "No text found for this section."}
              </pre>
            </div>
          </div>

          {/* Section Chunks Breakdown */}
          <div className="space-y-2 pt-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground-muted)] flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5" />
              Constituent Retrieval Chunks ({sectionChunks.length})
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {sectionChunks.map((chunk) => (
                <div
                  key={chunk.chunkId}
                  className="p-3 rounded-lg border border-[var(--border-muted)] bg-[var(--surface)] space-y-1.5 text-xs"
                >
                  <div className="flex items-center justify-between font-mono text-[11px] text-[var(--foreground-muted)]">
                    <span className="font-semibold text-[var(--primary)]">
                      {chunk.chunkId}
                    </span>
                    <span>
                      {chunk.characterCount} chars &bull; {chunk.wordCount} words
                    </span>
                  </div>
                  <p className="text-[var(--foreground-secondary)] line-clamp-3 italic">
                    &ldquo;{chunk.text}&rdquo;
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. Scope Lock Notice for Phase 3 */}
      <div className="rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface-muted)]/50 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-[var(--primary)] shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-semibold text-[var(--foreground)]">
              Document Intelligence Notice
            </p>
            <p className="text-[var(--foreground-muted)]">
              Clause extraction, obligation synthesis, risk severity rating, and interactive Q&amp;A are powered by NVIDIA Nemotron across all parsed sections and chunks.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
