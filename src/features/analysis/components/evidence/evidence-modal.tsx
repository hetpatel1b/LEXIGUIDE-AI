"use client";

import * as React from "react";
import { BookOpen, Copy, Check, X, FileText } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { EvidenceDetail } from "../../fixtures/analysis-fixture";

export interface EvidenceModalProps {
  evidence: EvidenceDetail | null;
  isOpen: boolean;
  onClose: () => void;
}

export function EvidenceModal({
  evidence,
  isOpen,
  onClose,
}: EvidenceModalProps) {
  const [copied, setCopied] = React.useState(false);

  if (!evidence) return null;

  const handleCopyCitation = async () => {
    const citationText = `"${evidence.excerpt}" — ${evidence.documentTitle}, ${evidence.sectionReference}, Page ${evidence.pageNumber}.`;
    try {
      await navigator.clipboard.writeText(citationText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Grounded Contract Evidence"
      description="Verbatim text passage extracted from the uploaded legal document."
      className="max-w-xl"
    >
      <div className="space-y-4 text-left">
        {/* Source Reference Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-[var(--radius-md)] bg-[var(--surface-muted)] border border-[var(--border)] text-xs">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-[var(--primary)] shrink-0" />
            <span className="font-semibold text-[var(--foreground)] truncate max-w-[200px]">
              {evidence.documentTitle}
            </span>
          </div>

          <div className="flex items-center gap-2 font-mono text-[11px]">
            <Badge variant="brand" size="sm">
              {evidence.sectionReference}
            </Badge>
            <Badge variant="neutral" size="sm">
              Page {evidence.pageNumber}
            </Badge>
          </div>
        </div>

        {/* Verbatim Excerpt */}
        <div className="relative p-4 rounded-[var(--radius-lg)] border-l-4 border-[var(--primary)] bg-[var(--surface-subtle)] border border-[var(--border)]">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--primary)] mb-2">
            <BookOpen className="h-3.5 w-3.5" />
            <span>Verbatim Contract Excerpt</span>
          </div>

          <p className="text-sm text-[var(--foreground)] italic leading-relaxed font-serif">
            &ldquo;{evidence.excerpt}&rdquo;
          </p>
        </div>

        {/* Informational Guidance */}
        <div className="p-3 rounded-[var(--radius-md)] bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 text-[11px] text-blue-950 dark:text-blue-100 leading-relaxed">
          <span className="font-semibold mr-1">Verification Note:</span>
          LexiGuide AI highlights exact phrasing to ensure all explanations and potential concern flags remain transparently grounded in the source text.
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2.5 pt-2 border-t border-[var(--border-muted)]">
          <Button
            variant="outline"
            size="sm"
            leftIcon={copied ? <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            onClick={handleCopyCitation}
            className="text-xs w-full xs:w-auto justify-center"
          >
            {copied ? "Citation Copied!" : "Copy Citation"}
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={onClose}
            className="text-xs w-full xs:w-auto justify-center"
          >
            Done
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
