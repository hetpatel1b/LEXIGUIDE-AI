"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, FileText, Sparkles, CheckCircle2, ChevronDown } from "lucide-react";
import { BrandLogo } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { SAMPLE_DOCUMENT, DOCUMENT_METADATA_DETAILS } from "../fixtures/analysis-fixture";

export type WorkspacePreviewState = "normal" | "loading" | "empty" | "error";

export interface WorkspaceHeaderProps {
  previewState: WorkspacePreviewState;
  onSelectPreviewState: (state: WorkspacePreviewState) => void;
}

export function WorkspaceHeader({
  previewState,
  onSelectPreviewState,
}: WorkspaceHeaderProps) {
  return (
    <header className="sticky top-0 z-30 w-full h-14 border-b border-[var(--border)] bg-[var(--surface)] px-3 sm:px-5 flex items-center justify-between gap-3 shrink-0 shadow-sm">
      {/* Left: Brand Identity & Return Link */}
      <div className="flex items-center gap-3 min-w-0">
        <BrandLogo variant="auto" width={130} height={36} priority />

        <div className="h-4 w-px bg-[var(--border)] hidden sm:block" />

        <Link
          href="/"
          className="hidden md:inline-flex items-center gap-1 text-xs text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          <span>Exit Workspace</span>
        </Link>
      </div>

      {/* Center: Contextual Document Details & Workspace Links */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <div className="hidden xl:flex items-center gap-2 px-2.5 py-1 rounded-full bg-[var(--surface-muted)] border border-[var(--border)] text-xs truncate">
          <FileText className="h-3.5 w-3.5 text-red-500 dark:text-red-400 shrink-0" aria-hidden="true" />
          <span className="font-semibold text-[var(--foreground)] truncate max-w-[140px] sm:max-w-[180px]" title={SAMPLE_DOCUMENT.name}>
            {SAMPLE_DOCUMENT.name}
          </span>
          <span className="h-1 w-1 rounded-full bg-[var(--foreground-muted)]" />
          <span className="text-[11px] text-[var(--foreground-muted)]">
            {DOCUMENT_METADATA_DETAILS.documentType}
          </span>
          <Badge variant="success" size="sm" dot>
            Analyzed
          </Badge>
        </div>

        {/* Workspace Workflow Navigation */}
        <nav aria-label="Workspace Tools" className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
          <Link
            href="/analyze"
            className="px-2.5 py-1 rounded-[var(--radius-md)] bg-[var(--primary)] text-white text-xs font-semibold shadow-xs"
          >
            Analysis
          </Link>
          <Link
            href="/qa"
            className="px-2.5 py-1 rounded-[var(--radius-md)] text-[var(--foreground-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--surface-muted)] text-xs font-medium transition-colors"
          >
            Ask Document
          </Link>
          <Link
            href="/compare"
            className="px-2.5 py-1 rounded-[var(--radius-md)] text-[var(--foreground-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--surface-muted)] text-xs font-medium transition-colors"
          >
            Compare
          </Link>
          <Link
            href="/action-center"
            className="px-2.5 py-1 rounded-[var(--radius-md)] text-[var(--foreground-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--surface-muted)] text-xs font-medium transition-colors"
          >
            Action Center
          </Link>
        </nav>
      </div>

      {/* Right: Preview State Switcher + Theme Toggle + Close */}
      <div className="flex items-center gap-2 shrink-0">
        {/* State Preview Switcher for Development Inspection */}
        <div className="relative hidden sm:flex items-center gap-1 bg-[var(--surface-muted)] p-0.5 rounded-[var(--radius-md)] border border-[var(--border)] text-[11px]">
          <span className="px-1.5 text-[10px] font-mono text-[var(--foreground-muted)] uppercase">State:</span>
          {(["normal", "loading", "empty", "error"] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => onSelectPreviewState(st)}
              className={`px-2 py-0.5 rounded text-[11px] font-medium capitalize transition-colors cursor-pointer ${
                previewState === st
                  ? "bg-[var(--primary)] text-white shadow-xs font-semibold"
                  : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="border-l border-[var(--border)] pl-2 flex items-center gap-1.5">
          <ThemeToggle />

          <Link href="/">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-[var(--foreground-muted)] hover:text-[var(--foreground)] sm:hidden"
            >
              Close
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
