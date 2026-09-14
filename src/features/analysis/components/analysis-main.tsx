"use client";

import * as React from "react";
import {
  PanelLeftOpen,
  Sparkles,
  Layers,
  X,
  FileText,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AnalysisTabs, type AnalysisTabId } from "./analysis-tabs";
import { OverviewTab } from "./overview/overview-tab";
import { SummaryTab } from "./overview/summary-tab";
import { ClausesTab } from "./overview/clauses-tab";
import { ConcernsTab } from "./overview/concerns-tab";
import { ObligationsTab } from "./overview/obligations-tab";
import { DatesTab } from "./overview/dates-tab";
import type { EvidenceDetail } from "../fixtures/analysis-fixture";
import type { DocumentSectionItem } from "@/types";
import type { NormalizedDocument } from "@/types/document";
import type { AnalysisResult } from "@/lib/ai/types";
import { RealDocumentView } from "./real-document-view";

export interface AnalysisMainProps {
  realDocument?: NormalizedDocument | null;
  analysisResult?: AnalysisResult | null;
  isAnalyzing?: boolean;
  analysisError?: string | null;
  onTriggerAnalysis?: () => void;
  activeTab: AnalysisTabId;
  onSelectTab: (tab: AnalysisTabId) => void;
  selectedSection?: DocumentSectionItem | null;
  selectedPage?: number;
  onSelectSection?: (section: DocumentSectionItem) => void;
  onClearSection?: () => void;
  onOpenDocumentDrawer?: () => void;
  onOpenCopilotDrawer?: () => void;
  onViewEvidence: (evidence: EvidenceDetail) => void;
  onSwitchToDemo?: () => void;
  className?: string;
}

export function AnalysisMain({
  realDocument,
  analysisResult,
  isAnalyzing = false,
  analysisError,
  onTriggerAnalysis,
  activeTab,
  onSelectTab,
  selectedSection,
  selectedPage = 1,
  onSelectSection,
  onClearSection,
  onOpenDocumentDrawer,
  onOpenCopilotDrawer,
  onViewEvidence,
  onSwitchToDemo,
}: AnalysisMainProps) {
  const [showRawStructureView, setShowRawStructureView] = React.useState(false);

  return (
    <main
      id="analysis-workspace-main"
      aria-label="Document Analysis Workspace"
      className="flex-1 flex flex-col h-full overflow-hidden bg-[var(--background)] min-w-0"
    >
      {/* 1. Inner Workspace Titlebar */}
      <div className="flex items-center justify-between gap-2 px-2.5 sm:px-5 lg:px-6 py-2 sm:py-2.5 bg-[var(--surface)] border-b border-[var(--border)] shrink-0 min-h-[44px]">
        {/* Left: Heading + Mobile/Tablet Document Trigger + Active Section Tag */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {onOpenDocumentDrawer && (
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenDocumentDrawer}
              leftIcon={<PanelLeftOpen className="h-4 w-4" />}
              className="lg:hidden text-xs shrink-0 min-h-[36px]"
              aria-label="Open document structure drawer"
            >
              <span className="hidden sm:inline">Document</span>
            </Button>
          )}

          <div className="flex items-center gap-2 min-w-0">
            <h1 className="text-xs sm:text-sm font-semibold text-[var(--foreground)] truncate">
              Primary Analysis Workspace
            </h1>

            {selectedSection && (
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[var(--surface-muted)] border border-[var(--border)] text-xs text-[var(--foreground)] shrink-0">
                <span className="font-mono text-[10px] text-[var(--foreground-muted)]">
                  Sec {selectedSection.sectionNumber}
                </span>
                <span className="truncate max-w-[120px] sm:max-w-[180px] font-medium" title={selectedSection.title}>
                  {selectedSection.title}
                </span>
                {onClearSection && (
                  <button
                    type="button"
                    onClick={onClearSection}
                    className="hover:text-[var(--danger)] text-[var(--foreground-muted)] ml-0.5 p-0.5 rounded cursor-pointer"
                    aria-label="Clear active section filter"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: Badge + Action / Copilot Trigger */}
        <div className="flex items-center gap-2 shrink-0">
          {realDocument && (
            <button
              type="button"
              onClick={() => setShowRawStructureView(!showRawStructureView)}
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-subtle)] text-[var(--foreground-secondary)] font-medium transition-colors cursor-pointer"
            >
              <FileText className="h-3.5 w-3.5 text-[var(--primary)]" />
              <span>{showRawStructureView ? "View AI Analysis" : "View Extracted Text"}</span>
            </button>
          )}

          <Badge
            variant={realDocument ? "brand" : "neutral"}
            size="sm"
            dot
            className="hidden xs:inline-flex shrink-0"
          >
            {realDocument
              ? analysisResult
                ? "NVIDIA Nemotron Analysis"
                : "Real Ingested Document"
              : "Illustrative Analysis"}
          </Badge>

          {onOpenCopilotDrawer && (
            <Button
              variant="primary"
              size="sm"
              onClick={onOpenCopilotDrawer}
              leftIcon={<Sparkles className="h-3.5 w-3.5" />}
              className="lg:hidden text-xs shadow-sm min-h-[36px]"
              aria-label="Open Document Copilot assistant drawer"
            >
              <span>Copilot</span>
            </Button>
          )}
        </div>
      </div>

      {/* 2. Primary 6 Analysis Tabs */}
      <AnalysisTabs activeTab={activeTab} onSelectTab={onSelectTab} />

      {/* 3. Active Tab View Body */}
      <div
        id={`panel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`tab-${activeTab}`}
        className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8"
      >
        <div className="w-full max-w-[1600px] mx-auto space-y-6">
          {/* A. If viewing raw extracted document view */}
          {realDocument && showRawStructureView ? (
            <RealDocumentView
              document={realDocument}
              selectedSection={selectedSection}
              selectedPage={selectedPage}
              onSelectSection={onSelectSection}
              onSwitchToDemo={onSwitchToDemo || (() => {})}
            />
          ) : realDocument && isAnalyzing ? (
            /* B. Loading State during Nemotron AI execution */
            <div className="rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] p-8 sm:p-12 text-center max-w-lg mx-auto space-y-4 my-12 shadow-sm">
              <div className="h-12 w-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-[var(--primary)] flex items-center justify-center mx-auto">
                <Sparkles className="h-6 w-6 animate-pulse text-[var(--primary)]" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-[var(--foreground)]">
                Analyzing your document…
              </h3>
              <p className="text-xs sm:text-sm text-[var(--foreground-muted)] leading-relaxed">
                LexiGuide is reviewing the document with NVIDIA Nemotron and organizing key clauses, obligations, and potential review points.
              </p>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--surface-muted)] text-[11px] font-mono text-[var(--foreground-muted)]">
                <RefreshCw className="h-3 w-3 animate-spin text-[var(--primary)]" />
                <span>Streaming verified analysis schema…</span>
              </div>
            </div>
          ) : realDocument && analysisError ? (
            /* C. Error state during AI execution */
            <div className="rounded-[var(--radius-xl)] border border-red-200 dark:border-red-900/60 bg-red-50/50 dark:bg-red-950/20 p-6 sm:p-8 text-center max-w-lg mx-auto space-y-4 my-8">
              <div className="h-10 w-10 rounded-xl bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
                <AlertCircle className="h-5 w-5" />
              </div>
              <h3 className="text-sm sm:text-base font-semibold text-[var(--foreground)]">
                AI Analysis Could Not Complete
              </h3>
              <p className="text-xs text-[var(--foreground-muted)] leading-relaxed">
                {analysisError}
              </p>
              <div className="flex items-center justify-center gap-3 pt-2">
                {onTriggerAnalysis && (
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={onTriggerAnalysis}
                    leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
                  >
                    Retry AI Analysis
                  </Button>
                )}
                {onSwitchToDemo && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onSwitchToDemo}
                  >
                    View Demo Fixture
                  </Button>
                )}
              </div>
            </div>
          ) : realDocument && !analysisResult ? (
            /* D. Document loaded but not yet analyzed */
            <div className="rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] p-8 text-center max-w-lg mx-auto space-y-4 my-8 shadow-sm">
              <div className="h-12 w-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-[var(--primary)] flex items-center justify-center mx-auto">
                <Sparkles className="h-6 w-6 text-[var(--primary)]" />
              </div>
              <h3 className="text-lg font-semibold text-[var(--foreground)]">
                Ready for AI Analysis
              </h3>
              <p className="text-xs sm:text-sm text-[var(--foreground-muted)] leading-relaxed">
                Real document &ldquo;{realDocument.displayName}&rdquo; is ready for analysis. Run NVIDIA Nemotron to generate grounded clause breakdowns, obligations, and review priorities.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                {onTriggerAnalysis && (
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={onTriggerAnalysis}
                    leftIcon={<Sparkles className="h-3.5 w-3.5" />}
                  >
                    Analyze with NVIDIA Nemotron
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowRawStructureView(true)}
                  leftIcon={<FileText className="h-3.5 w-3.5" />}
                >
                  View Extracted Text
                </Button>
              </div>
            </div>
          ) : (
            /* E. Standard Tab Views (Consumes real analysisResult or demo fixture) */
            <>
              {activeTab === "overview" && (
                <OverviewTab
                  analysisResult={realDocument ? analysisResult : null}
                  onNavigateTab={onSelectTab}
                  onViewEvidence={onViewEvidence}
                />
              )}

              {activeTab === "summary" && (
                <SummaryTab analysisResult={realDocument ? analysisResult : null} />
              )}

              {activeTab === "clauses" && (
                <ClausesTab
                  analysisResult={realDocument ? analysisResult : null}
                  onViewEvidence={onViewEvidence}
                />
              )}

              {activeTab === "concerns" && (
                <ConcernsTab
                  analysisResult={realDocument ? analysisResult : null}
                  onViewEvidence={onViewEvidence}
                />
              )}

              {activeTab === "obligations" && (
                <ObligationsTab analysisResult={realDocument ? analysisResult : null} />
              )}

              {activeTab === "dates" && (
                <DatesTab analysisResult={realDocument ? analysisResult : null} />
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
