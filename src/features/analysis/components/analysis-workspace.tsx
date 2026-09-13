"use client";

import * as React from "react";
import {
  FileText,
  Sparkles,
  LayoutDashboard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { WorkspaceHeader, type WorkspacePreviewState } from "./workspace-header";
import { DocumentPanel } from "./document-panel";
import { AnalysisMain } from "./analysis-main";
import { CopilotPanel } from "./copilot/copilot-panel";
import { EvidenceModal } from "./evidence/evidence-modal";
import { WorkspaceDrawer } from "./workspace-drawers";
import { WorkspaceSkeleton } from "./states/workspace-skeleton";
import { WorkspaceEmpty } from "./states/workspace-empty";
import { WorkspaceError } from "./states/workspace-error";
import type { AnalysisTabId } from "./analysis-tabs";
import type { EvidenceDetail } from "../fixtures/analysis-fixture";
import type { DocumentSectionItem } from "@/types";

export function AnalysisWorkspace() {
  // Desktop Panel Collapse State
  const [isLeftCollapsed, setIsLeftCollapsed] = React.useState(false);
  const [isRightCollapsed, setIsRightCollapsed] = React.useState(false);

  // Mobile / Tablet Drawer State
  const [isDocDrawerOpen, setIsDocDrawerOpen] = React.useState(false);
  const [isCopilotDrawerOpen, setIsCopilotDrawerOpen] = React.useState(false);

  // Analysis State
  const [activeTab, setActiveTab] = React.useState<AnalysisTabId>("overview");
  const [selectedSection, setSelectedSection] = React.useState<DocumentSectionItem | null>(null);
  const [selectedPage, setSelectedPage] = React.useState<number>(1);

  // Evidence Dialog State
  const [activeEvidence, setActiveEvidence] = React.useState<EvidenceDetail | null>(null);
  const [isEvidenceOpen, setIsEvidenceOpen] = React.useState(false);

  // Development Preview State (normal / loading / empty / error)
  const [previewState, setPreviewState] = React.useState<WorkspacePreviewState>("normal");

  const handleOpenEvidence = (evidence: EvidenceDetail) => {
    setActiveEvidence(evidence);
    setIsEvidenceOpen(true);
  };

  const handleCloseEvidence = () => {
    setIsEvidenceOpen(false);
    setActiveEvidence(null);
  };

  const handleSelectSection = (section: DocumentSectionItem) => {
    setSelectedSection(section);
    setSelectedPage(section.pageNumber);
    // On mobile, close drawer after selecting section
    setIsDocDrawerOpen(false);
  };

  const handleSelectPage = (pageNum: number) => {
    setSelectedPage(pageNum);
    setIsDocDrawerOpen(false);
  };

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-[var(--background)] text-[var(--foreground)]">
      {/* 1. Dedicated Workspace Application Header */}
      <WorkspaceHeader
        previewState={previewState}
        onSelectPreviewState={setPreviewState}
      />

      {/* 2. Mobile Quick-Navigation Strip (< 768px) */}
      <div className="md:hidden flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface)] px-4 py-2 shrink-0">
        <span className="text-xs font-semibold text-[var(--foreground)]">
          Navigation:
        </span>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsDocDrawerOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-subtle)] text-xs text-[var(--foreground-secondary)] hover:text-[var(--foreground)]"
          >
            <FileText className="h-3.5 w-3.5 text-red-500" />
            <span>Document</span>
          </button>

          <button
            type="button"
            className="flex items-center gap-1 px-2.5 py-1 rounded-[var(--radius-md)] bg-[var(--primary)] text-white text-xs font-medium shadow-xs"
          >
            <LayoutDashboard className="h-3.5 w-3.5" />
            <span>Analysis</span>
          </button>

          <button
            type="button"
            onClick={() => setIsCopilotDrawerOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-subtle)] text-xs text-[var(--foreground-secondary)] hover:text-[var(--foreground)]"
          >
            <Sparkles className="h-3.5 w-3.5 text-[var(--primary)]" />
            <span>Copilot</span>
          </button>
        </div>
      </div>

      {/* 3. Main Workspace Shell Area */}
      <div className="flex-1 flex overflow-hidden min-h-0 relative">
        {/* Loading State Preview */}
        {previewState === "loading" && <WorkspaceSkeleton />}

        {/* Empty State Preview */}
        {previewState === "empty" && (
          <WorkspaceEmpty onReset={() => setPreviewState("normal")} />
        )}

        {/* Error State Preview */}
        {previewState === "error" && (
          <WorkspaceError onRetry={() => setPreviewState("normal")} />
        )}

        {/* Normal Mode: Hybrid 3-Panel Workspace */}
        {previewState === "normal" && (
          <>
            {/* Left: Document Panel (Desktop >= 1024px) */}
            <div className="hidden lg:flex h-full shrink-0">
              <DocumentPanel
                isCollapsed={isLeftCollapsed}
                onToggleCollapse={() => setIsLeftCollapsed(!isLeftCollapsed)}
                selectedSectionId={selectedSection?.id}
                onSelectSection={handleSelectSection}
                selectedPage={selectedPage}
                onSelectPage={handleSelectPage}
              />
            </div>

            {/* Center: Primary Analysis Workspace */}
            <AnalysisMain
              activeTab={activeTab}
              onSelectTab={setActiveTab}
              selectedSection={selectedSection}
              onClearSection={() => setSelectedSection(null)}
              onOpenDocumentDrawer={() => setIsDocDrawerOpen(true)}
              onOpenCopilotDrawer={() => setIsCopilotDrawerOpen(true)}
              onViewEvidence={handleOpenEvidence}
            />

            {/* Right: AI Copilot Assistant (Desktop >= 1280px) */}
            <div className="hidden xl:flex h-full shrink-0">
              <CopilotPanel
                isCollapsed={isRightCollapsed}
                onToggleCollapse={() => setIsRightCollapsed(!isRightCollapsed)}
                onViewEvidence={handleOpenEvidence}
              />
            </div>
          </>
        )}
      </div>

      {/* 4. Slide-Over Drawers for Tablet / Mobile */}
      {/* Mobile / Tablet Document Drawer */}
      <WorkspaceDrawer
        isOpen={isDocDrawerOpen}
        onClose={() => setIsDocDrawerOpen(false)}
        title="Document Navigation"
        side="left"
      >
        <div className="flex-1 overflow-y-auto">
          <DocumentPanel
            isCollapsed={false}
            onToggleCollapse={() => setIsDocDrawerOpen(false)}
            selectedSectionId={selectedSection?.id}
            onSelectSection={handleSelectSection}
            selectedPage={selectedPage}
            onSelectPage={handleSelectPage}
            className="w-full border-r-0"
          />
        </div>
      </WorkspaceDrawer>

      {/* Mobile / Tablet Copilot Drawer */}
      <WorkspaceDrawer
        isOpen={isCopilotDrawerOpen}
        onClose={() => setIsCopilotDrawerOpen(false)}
        title="Document Copilot"
        side="right"
      >
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          <CopilotPanel
            isCollapsed={false}
            onToggleCollapse={() => setIsCopilotDrawerOpen(false)}
            onViewEvidence={handleOpenEvidence}
            className="w-full border-l-0"
          />
        </div>
      </WorkspaceDrawer>

      {/* 5. Grounded Evidence Modal */}
      <EvidenceModal
        evidence={activeEvidence}
        isOpen={isEvidenceOpen}
        onClose={handleCloseEvidence}
      />
    </div>
  );
}
