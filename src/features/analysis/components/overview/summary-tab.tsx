"use client";

import * as React from "react";
import {
  FileText,
  Sparkles,
  MapPin,
  Calendar,
  Shield,
  BookOpen,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  EXECUTIVE_SUMMARY,
  DOCUMENT_METADATA_DETAILS,
} from "../../fixtures/analysis-fixture";

export function SummaryTab() {
  return (
    <div className="space-y-6 text-left max-w-4xl mx-auto">
      {/* Header & Subtitle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[var(--border)]">
        <div>
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            Executive Summary &amp; Document Breakdown
          </h2>
          <p className="text-xs text-[var(--foreground-muted)]">
            Plain-language synthesis of contractual provisions, rights, and risk boundaries
          </p>
        </div>

        <Badge variant="neutral" size="sm" dot>
          Illustrative analysis · Development preview
        </Badge>
      </div>

      {/* Main Executive Summary Card */}
      <Card density="spacious" className="bg-[var(--surface)] border-[var(--border)] space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]">
          <Sparkles className="h-4 w-4 text-[var(--primary)]" aria-hidden="true" />
          <span>Core Contract Overview</span>
        </div>

        <p className="text-sm text-[var(--foreground-secondary)] leading-relaxed">
          {EXECUTIVE_SUMMARY.overview}
        </p>

        <div className="p-4 rounded-[var(--radius-lg)] bg-[var(--surface-subtle)] border border-[var(--border)] space-y-3">
          <h3 className="text-xs font-semibold text-[var(--foreground)] uppercase tracking-wider">
            Primary Findings &amp; Deal Terms
          </h3>

          <ul className="space-y-2.5">
            {EXECUTIVE_SUMMARY.bulletPoints.map((point, index) => (
              <li key={index} className="flex items-start gap-2.5 text-xs text-[var(--foreground-secondary)] leading-relaxed">
                <span className="h-2 w-2 rounded-full bg-[var(--primary)] mt-1 shrink-0" aria-hidden="true" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      </Card>

      {/* Contractual Context & Legal Framework */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card density="spacious" className="bg-[var(--surface)] space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-[var(--foreground)] uppercase tracking-wider text-[var(--foreground-muted)]">
            <MapPin className="h-3.5 w-3.5 text-[var(--primary)]" aria-hidden="true" />
            <span>Jurisdiction &amp; Venue</span>
          </div>

          <div className="space-y-1 text-xs">
            <p className="font-medium text-[var(--foreground)]">
              {EXECUTIVE_SUMMARY.documentContext.jurisdiction}
            </p>
            <p className="text-[var(--foreground-muted)] text-[11px]">
              Governing Law: {EXECUTIVE_SUMMARY.documentContext.governingLaw}
            </p>
            <p className="text-[var(--foreground-muted)] text-[11px]">
              Arbitration Seat: Bengaluru, Karnataka (Sole Arbitrator)
            </p>
          </div>
        </Card>

        <Card density="spacious" className="bg-[var(--surface)] space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-[var(--foreground)] uppercase tracking-wider text-[var(--foreground-muted)]">
            <Calendar className="h-3.5 w-3.5 text-[var(--primary)]" aria-hidden="true" />
            <span>Term &amp; Effective Status</span>
          </div>

          <div className="space-y-1 text-xs">
            <p className="font-medium text-[var(--foreground)]">
              Effective from {EXECUTIVE_SUMMARY.documentContext.effectiveDate}
            </p>
            <p className="text-[var(--foreground-muted)] text-[11px]">
              Agreement Type: {EXECUTIVE_SUMMARY.documentContext.documentType}
            </p>
            <p className="text-[var(--foreground-muted)] text-[11px]">
              Review Status: {DOCUMENT_METADATA_DETAILS.reviewStatus}
            </p>
          </div>
        </Card>
      </div>

      {/* Structural Scope Guide */}
      <Card density="spacious" className="bg-[var(--surface)] space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-[var(--foreground)]">
          <BookOpen className="h-4 w-4 text-[var(--primary)]" aria-hidden="true" />
          <span>Document Architecture Summary</span>
        </div>

        <p className="text-xs text-[var(--foreground-secondary)] leading-relaxed">
          The document contains 10 structured substantive sections across 18 pages. The main legal commitments are centered in Section 3 (Compensation), Section 5 (Confidentiality &amp; Non-Compete), Section 6 (Intellectual Property Assignment), and Section 7 (Termination &amp; Notice).
        </p>
      </Card>
    </div>
  );
}
