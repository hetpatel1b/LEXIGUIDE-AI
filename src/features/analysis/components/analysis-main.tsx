"use client";

import * as React from "react";
import {
  PanelLeftOpen,
  Sparkles,
  Bot,
  Layers,
  X,
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

export interface AnalysisMainProps {
  activeTab: AnalysisTabId;
  onSelectTab: (tab: AnalysisTabId) => void;
  selectedSection?: DocumentSectionItem | null;
  onClearSection?: () => void;
  onOpenDocumentDrawer?: () => void;
  onOpenCopilotDrawer?: () => void;
  onViewEvidence: (evidence: EvidenceDetail) => void;
  className?: string;
}

export function AnalysisMain({
  activeTab,
  onSelectTab,
  selectedSection,
  onClearSection,
  onOpenDocumentDrawer,
  onOpenCopilotDrawer,
  onViewEvidence,
  className,
}: AnalysisMainProps) {
  return (
    <main
      id="analysis-workspace-main"
      aria-label="Document Analysis Workspace"
      className="flex-1 flex flex-col h-full overflow-hidden bg-[var(--background)] min-w-0"
    >
      {/* Contextual Sub-Header (Tablet & Mobile drawer toggles + Active section tag) */}
      <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-2.5 bg-[var(--surface)] border-b border-[var(--border)] shrink-0">
        {/* Left: Mobile/Tablet Document trigger & contextual breadcrumb */}
        <div className="flex items-center gap-2 min-w-0">
          {onOpenDocumentDrawer && (
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenDocumentDrawer}
              leftIcon={<PanelLeftOpen className="h-4 w-4" />}
              className="lg:hidden text-xs shrink-0"
              aria-label="Open document structure drawer"
            >
              <span className="hidden sm:inline">Document</span>
            </Button>
          )}

          {selectedSection ? (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[var(--surface-muted)] border border-[var(--border)] text-xs text-[var(--foreground)] truncate">
              <span className="font-mono text-[10px] text-[var(--foreground-muted)]">
                Sec {selectedSection.sectionNumber}
              </span>
              <span className="truncate max-w-[140px] sm:max-w-[220px] font-medium" title={selectedSection.title}>
                {selectedSection.title}
              </span>
              {onClearSection && (
                <button
                  type="button"
                  onClick={onClearSection}
                  className="hover:text-[var(--danger)] text-[var(--foreground-muted)] ml-1"
                  aria-label="Clear active section filter"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ) : (
            <span className="text-xs text-[var(--foreground-muted)] truncate hidden sm:inline">
              Primary Analysis Workspace
            </span>
          )}
        </div>

        {/* Right: Mobile/Tablet AI Copilot trigger */}
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant="neutral" size="sm" dot className="hidden md:inline-flex">
            Illustrative Analysis
          </Badge>

          {onOpenCopilotDrawer && (
            <Button
              variant="primary"
              size="sm"
              onClick={onOpenCopilotDrawer}
              leftIcon={<Sparkles className="h-3.5 w-3.5" />}
              className="xl:hidden text-xs shadow-sm"
              aria-label="Open Document Copilot assistant drawer"
            >
              <span>Copilot</span>
            </Button>
          )}
        </div>
      </div>

      {/* Primary 6 Analysis Tabs */}
      <AnalysisTabs activeTab={activeTab} onSelectTab={onSelectTab} />

      {/* Active Tab View Body */}
      <div
        role="tabpanel"
        id={`panel-${activeTab}`}
        aria-labelledby={`tab-${activeTab}`}
        tabIndex={0}
        className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 focus:outline-none"
      >
        {activeTab === "overview" && (
          <OverviewTab
            onNavigateTab={onSelectTab}
            onViewEvidence={onViewEvidence}
          />
        )}

        {activeTab === "summary" && <SummaryTab />}

        {activeTab === "clauses" && (
          <ClausesTab onViewEvidence={onViewEvidence} />
        )}

        {activeTab === "concerns" && (
          <ConcernsTab onViewEvidence={onViewEvidence} />
        )}

        {activeTab === "obligations" && <ObligationsTab />}

        {activeTab === "dates" && <DatesTab />}
      </div>
    </main>
  );
}
