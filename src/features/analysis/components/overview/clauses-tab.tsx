"use client";

import * as React from "react";
import { ExternalLink, Filter } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { EvidenceDetail } from "@/types";
import type { AnalysisResult } from "@/lib/ai/types";

export interface ClausesTabProps {
  analysisResult?: AnalysisResult | null;
  onViewEvidence: (evidence: EvidenceDetail) => void;
}

export function ClausesTab({ analysisResult, onViewEvidence }: ClausesTabProps) {
  const [selectedCategory, setSelectedCategory] = React.useState<string>("All");

  const clauses = React.useMemo(() => {
    if (!analysisResult) return [];
    return analysisResult.keyClauses.map((c) => ({
      id: c.id,
      title: c.title,
      category: c.category,
      summary: c.summary,
      importance: c.importance,
      sectionReference: c.source.sectionTitle || c.source.sectionId || c.category,
      pageNumber: c.source.pageNumber || 1,
      evidenceSnippet: c.source.quote,
      verified: c.verified,
    }));
  }, [analysisResult]);

  const categories = React.useMemo(() => {
    return ["All", ...Array.from(new Set(clauses.map((c) => c.category)))];
  }, [clauses]);

  const filteredClauses =
    selectedCategory === "All"
      ? clauses
      : clauses.filter((c) => c.category === selectedCategory);

  const importanceBadge = (importance?: string) => {
    switch (importance) {
      case "critical":
        return <Badge variant="brand" size="sm">Key Provision</Badge>;
      case "standard":
        return <Badge variant="neutral" size="sm">Standard Term</Badge>;
      case "notable":
        return <Badge variant="neutral" size="sm">Notable Provision</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 text-left w-full">
      {/* Header & Category Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-[var(--foreground)]">
              Key Clauses &amp; Provisions
            </h2>
            <Badge variant={analysisResult ? "brand" : "neutral"} size="sm">
              {clauses.length} Identified
            </Badge>
          </div>
          <p className="text-xs text-[var(--foreground-muted)] mt-0.5">
            Categorized breakdown of substantive clauses identified in the agreement
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 max-w-full">
          <Filter className="h-3.5 w-3.5 text-[var(--foreground-muted)] mr-1 shrink-0" aria-hidden="true" />
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                selectedCategory === cat
                  ? "bg-[var(--primary)] text-white font-semibold shadow-sm"
                  : "bg-[var(--surface-muted)] text-[var(--foreground-secondary)] hover:bg-[var(--surface-raised)] hover:text-[var(--foreground)]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Clauses List */}
      <div className="space-y-3.5">
        {filteredClauses.length === 0 ? (
          <div className="p-8 text-center rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground-muted)] text-xs">
            No clauses found under &ldquo;{selectedCategory}&rdquo;.
          </div>
        ) : (
          filteredClauses.map((clause, index) => (
            <Card
              key={`${clause.id || "clause"}_${index}`}
              density="compact"
              className="p-4 bg-[var(--surface)] hover:border-[var(--border-strong)] transition-all space-y-2.5"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-[var(--surface-muted)] text-[var(--foreground)] shrink-0">
                    {clause.sectionReference}
                  </span>
                  <h3 className="text-sm font-semibold text-[var(--foreground)]">
                    {clause.title}
                  </h3>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="neutral" size="sm">
                    {clause.category}
                  </Badge>
                  {importanceBadge(clause.importance)}
                </div>
              </div>

              <p className="text-xs text-[var(--foreground-secondary)] leading-relaxed">
                {clause.summary}
              </p>

              <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-1.5 pt-2 border-t border-[var(--border-muted)] text-xs text-[var(--foreground-muted)]">
                <span className="font-mono text-[11px]">
                  {clause.pageNumber ? `Page ${clause.pageNumber} · ` : ""}
                  {clause.verified ? "✓ Verified in source" : "Reference attached"}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    onViewEvidence({
                      id: clause.id,
                      documentTitle: analysisResult?.documentName || "Document",
                      sectionReference: clause.sectionReference || "Clause",
                      pageNumber: clause.pageNumber || 1,
                      excerpt: clause.evidenceSnippet || "",
                      contextNote: clause.verified ? "✓ Verified against source text" : "Unverified citation",
                    })
                  }
                  className="inline-flex items-center gap-1.5 text-[var(--primary)] hover:underline font-medium text-xs cursor-pointer py-1 px-1.5 -mr-1.5 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] self-start xs:self-auto"
                >
                  <span>View Evidence</span>
                  <ExternalLink className="h-3 w-3" aria-hidden="true" />
                </button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
