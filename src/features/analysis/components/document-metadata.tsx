"use client";

import * as React from "react";
import { Users, Calendar, MapPin, Hash, FileCheck, Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { NormalizedDocument } from "@/types/document";
import { DOCUMENT_METADATA_DETAILS } from "../fixtures/analysis-fixture";

export interface DocumentMetadataProps {
  document?: NormalizedDocument | null;
}

export function DocumentMetadata({ document }: DocumentMetadataProps) {
  // If real uploaded document is provided, show genuine extracted technical metadata
  if (document) {
    const formatSize = (bytes: number) => {
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    return (
      <div className="space-y-2.5 text-left text-xs">
        <div className="flex items-center justify-between pb-1 border-b border-[var(--border-muted)]">
          <span className="font-semibold text-[10px] uppercase tracking-wider text-[var(--foreground-muted)]">
            Document Ingestion
          </span>
          <Badge variant="brand" size="sm" dot>
            Engine Ready
          </Badge>
        </div>

        <div className="grid grid-cols-1 gap-2">
          {/* Format & Size */}
          <div className="space-y-0.5">
            <span className="text-[10px] text-[var(--foreground-muted)] block">Format &amp; Size</span>
            <p className="font-medium text-xs text-[var(--foreground)] leading-tight font-mono">
              {document.format.toUpperCase()} &bull; {formatSize(document.sizeBytes)}
              {document.pageCount ? ` (${document.pageCount} pages)` : ""}
            </p>
          </div>

          {/* Word and Character Count */}
          <div className="space-y-0.5">
            <span className="text-[10px] text-[var(--foreground-muted)] flex items-center gap-1">
              <Hash className="h-3 w-3" aria-hidden="true" />
              Volume
            </span>
            <p className="font-medium text-xs text-[var(--foreground)] leading-tight font-mono">
              {document.wordCount.toLocaleString()} words &bull; {document.characterCount.toLocaleString()} chars
            </p>
          </div>

          {/* Sections and Chunks */}
          <div className="space-y-0.5">
            <span className="text-[10px] text-[var(--foreground-muted)] flex items-center gap-1">
              <Layers className="h-3 w-3" aria-hidden="true" />
              Structure
            </span>
            <p className="font-medium text-xs text-[var(--foreground)] leading-tight font-mono">
              {document.sections.length} sections &bull; {document.chunks.length} chunks
            </p>
          </div>

          {/* Status */}
          <div className="space-y-0.5">
            <span className="text-[10px] text-[var(--foreground-muted)] flex items-center gap-1">
              <FileCheck className="h-3 w-3 text-emerald-500" aria-hidden="true" />
              Ingestion Phase
            </span>
            <p className="font-medium text-[11px] text-emerald-600 dark:text-emerald-400 leading-tight">
              Phase 2 Normalized (Deterministic)
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Otherwise, render Phase 1 demo fixture metadata
  return (
    <div className="space-y-2.5 text-left text-xs">
      <div className="flex items-center justify-between pb-1 border-b border-[var(--border-muted)]">
        <span className="font-semibold text-[10px] uppercase tracking-wider text-[var(--foreground-muted)]">
          Document Details (Demo)
        </span>
        <Badge variant="success" size="sm" dot>
          {DOCUMENT_METADATA_DETAILS.reviewStatus}
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {/* Document Type */}
        <div className="space-y-0.5">
          <span className="text-[10px] text-[var(--foreground-muted)] block">Contract Type</span>
          <p className="font-medium text-xs text-[var(--foreground)] leading-tight">{DOCUMENT_METADATA_DETAILS.documentType}</p>
        </div>

        {/* Parties */}
        <div className="space-y-0.5">
          <span className="text-[10px] text-[var(--foreground-muted)] flex items-center gap-1">
            <Users className="h-3 w-3" aria-hidden="true" />
            Parties
          </span>
          <div className="space-y-0.5 pl-3 border-l-2 border-[var(--border-muted)]">
            {DOCUMENT_METADATA_DETAILS.parties.map((p) => (
              <p key={p.name} className="font-medium text-xs text-[var(--foreground)] truncate leading-tight">
                <span className="text-[10px] text-[var(--foreground-muted)] mr-1">({p.role})</span>
                {p.name}
              </p>
            ))}
          </div>
        </div>

        {/* Effective Date */}
        <div className="space-y-0.5">
          <span className="text-[10px] text-[var(--foreground-muted)] flex items-center gap-1">
            <Calendar className="h-3 w-3" aria-hidden="true" />
            Effective Date
          </span>
          <p className="font-medium text-xs text-[var(--foreground)] leading-tight">{DOCUMENT_METADATA_DETAILS.effectiveDate}</p>
        </div>

        {/* Jurisdiction & Governing Law */}
        <div className="space-y-0.5">
          <span className="text-[10px] text-[var(--foreground-muted)] flex items-center gap-1">
            <MapPin className="h-3 w-3" aria-hidden="true" />
            Governing Law
          </span>
          <p className="font-medium text-xs text-[var(--foreground)] truncate leading-tight" title={DOCUMENT_METADATA_DETAILS.jurisdiction}>
            {DOCUMENT_METADATA_DETAILS.governingLaw}
          </p>
        </div>
      </div>
    </div>
  );
}
