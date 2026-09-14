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
import type { AnalysisResult } from "@/lib/ai/types";

export interface SummaryTabProps {
  analysisResult?: AnalysisResult | null;
}

export function SummaryTab({ analysisResult }: SummaryTabProps) {
  const summary = React.useMemo(() => {
    if (!analysisResult) {
      return {
        overview: "No document analysis available.",
        bulletPoints: [],
        documentContext: {
          jurisdiction: "Not specified",
          governingLaw: "Not specified",
          effectiveDate: "Not specified",
          documentType: "Legal Document",
        },
      };
    }

    const bulletPoints = [
      ...analysisResult.executiveSummary.keyThemes,
      ...analysisResult.executiveSummary.majorObligationsSummary,
      ...analysisResult.executiveSummary.reviewPriorities,
    ];

    return {
      overview: analysisResult.executiveSummary.overview,
      bulletPoints: bulletPoints.length > 0 ? bulletPoints : ["Standard contractual clauses identified."],
      documentContext: {
        jurisdiction: analysisResult.metadata.jurisdiction || "Not found in the uploaded document.",
        governingLaw: analysisResult.metadata.governingLaw || "Not found in the uploaded document.",
        effectiveDate: analysisResult.metadata.effectiveDate || "Not specified",
        documentType: analysisResult.metadata.documentType || "Legal Document",
      },
    };
  }, [analysisResult]);

  return (
    <div className="space-y-6 text-left w-full">
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

        <Badge variant={analysisResult ? "brand" : "neutral"} size="sm" dot>
          {analysisResult ? "Real AI Analysis · NVIDIA Nemotron" : "No Analysis Loaded"}
        </Badge>
      </div>

      {/* Main Executive Summary Card */}
      <Card density="compact" className="p-4 sm:p-5 bg-[var(--surface)] border-[var(--border)] space-y-3.5">
        <div className="flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]">
          <Sparkles className="h-4 w-4 text-[var(--primary)]" aria-hidden="true" />
          <span>Core Contract Overview</span>
        </div>

        <p className="text-xs sm:text-sm text-[var(--foreground-secondary)] leading-relaxed">
          {summary.overview}
        </p>

        <div className="p-3 sm:p-4 rounded-[var(--radius-lg)] bg-[var(--surface-subtle)] border border-[var(--border)] space-y-2.5">
          <h3 className="text-xs font-semibold text-[var(--foreground)] uppercase tracking-wider">
            Primary Findings &amp; Deal Terms
          </h3>

          <ul className="space-y-2">
            {summary.bulletPoints.map((point, index) => (
              <li key={index} className="flex items-start gap-2 text-xs text-[var(--foreground-secondary)] leading-relaxed">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--primary)] mt-1.5 shrink-0" aria-hidden="true" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      </Card>

      {/* Contractual Context & Legal Framework */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <Card density="compact" className="p-4 bg-[var(--surface)] space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wider">
            <MapPin className="h-3.5 w-3.5 text-[var(--primary)]" aria-hidden="true" />
            <span>Jurisdiction &amp; Venue</span>
          </div>

          <div className="space-y-1 text-xs">
            <p className="font-medium text-[var(--foreground)]">
              {summary.documentContext.jurisdiction}
            </p>
            <p className="text-[var(--foreground-muted)] text-[11px]">
              Governing Law: {summary.documentContext.governingLaw}
            </p>
            <p className="text-[var(--foreground-muted)] text-[11px]">
              {analysisResult ? "Jurisdiction identified from document text" : "Jurisdiction not specified"}
            </p>
          </div>
        </Card>

        <Card density="compact" className="p-4 bg-[var(--surface)] space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wider">
            <Calendar className="h-3.5 w-3.5 text-[var(--primary)]" aria-hidden="true" />
            <span>Term &amp; Effective Status</span>
          </div>

          <div className="space-y-1 text-xs">
            <p className="font-medium text-[var(--foreground)]">
              {summary.documentContext.effectiveDate !== "Not specified"
                ? `Effective from ${summary.documentContext.effectiveDate}`
                : "Effective date not stated"}
            </p>
            <p className="text-[var(--foreground-muted)] text-[11px]">
              Agreement Type: {summary.documentContext.documentType}
            </p>
            <p className="text-[var(--foreground-muted)] text-[11px]">
              Review Status: {analysisResult ? "AI Analysis Completed by Nemotron" : "Awaiting Analysis"}
            </p>
          </div>
        </Card>
      </div>

      {/* Structural Scope Guide */}
      <Card density="compact" className="p-4 bg-[var(--surface)] space-y-2.5">
        <div className="flex items-center gap-2 text-xs font-semibold text-[var(--foreground)]">
          <BookOpen className="h-4 w-4 text-[var(--primary)]" aria-hidden="true" />
          <span>Document Architecture Summary</span>
        </div>

        <p className="text-xs text-[var(--foreground-secondary)] leading-relaxed">
          {analysisResult && analysisResult.analysisNotes.length > 0
            ? analysisResult.analysisNotes.join(" ")
            : "No document notes available."}
        </p>
      </Card>
    </div>
  );
}
