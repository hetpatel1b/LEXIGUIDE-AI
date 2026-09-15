"use client";

import * as React from "react";
import {
  FileText,
  LayoutDashboard,
} from "lucide-react";
import { WorkspaceNav } from "@/components/shared";
import { DocumentPanel } from "./document-panel";
import { AnalysisMain } from "./analysis-main";
import { EvidenceModal } from "./evidence/evidence-modal";
import { WorkspaceDrawer } from "./workspace-drawers";
import { WorkspaceSkeleton } from "./states/workspace-skeleton";
import { WorkspaceEmpty } from "./states/workspace-empty";
import { WorkspaceError } from "./states/workspace-error";
import type { AnalysisTabId } from "./analysis-tabs";
import type { EvidenceDetail, DocumentSectionItem } from "@/types";
import type { NormalizedDocument } from "@/types/document";
import { getActiveDocument } from "@/lib/document-storage";
import { useDocumentAnalysis } from "../hooks/use-document-analysis";
import { useDocumentUpload } from "@/features/upload";

const emptySubscribe = () => () => {};

export type WorkspacePreviewState = "normal" | "loading" | "empty" | "error";

export function AnalysisWorkspace() {
  const hasMounted = React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Desktop Panel Collapse State: default closed / collapsed
  const [isLeftCollapsed, setIsLeftCollapsed] = React.useState(true);

  // Mobile / Tablet Drawer State
  const [isDocDrawerOpen, setIsDocDrawerOpen] = React.useState(false);

  // Storage synchronization version
  const [storageVersion, setStorageVersion] = React.useState(0);

  // Upload handler for direct-upload on /analyze
  const {
    status: uploadStatus,
    stageMessage: uploadStageMessage,
    errorMessage: uploadError,
    uploadAndProcess,
  } = useDocumentUpload();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const doc = await uploadAndProcess(file);
      if (doc) {
        setStorageVersion((v) => v + 1);
      }
    }
  };

  // Listen for storage updates in other tabs/windows or local updates, plus bfcache restoration
  React.useEffect(() => {
    const handleStorage = () => {
      setStorageVersion((v) => v + 1);
    };
    window.addEventListener("storage", handleStorage);
    window.addEventListener("lexiguide-doc-update", handleStorage);
    window.addEventListener("lexiguide-workspace-reset", handleStorage);
    window.addEventListener("pageshow", handleStorage);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("lexiguide-doc-update", handleStorage);
      window.removeEventListener("lexiguide-workspace-reset", handleStorage);
      window.removeEventListener("pageshow", handleStorage);
    };
  }, []);

  // Real Uploaded Document from Session Storage (client-only after mount)
  const uploadedDoc = React.useMemo(() => {
    if (!hasMounted) return null;
    void storageVersion;
    return getActiveDocument();
  }, [hasMounted, storageVersion]);

  // AI Analysis State Machine
  const {
    status: analysisStatus,
    isAnalyzing,
    analysis,
    errorMessage: analysisError,
    runAnalysis,
  } = useDocumentAnalysis(uploadedDoc);

  // Auto-trigger analysis for freshly uploaded real document if not analyzed
  React.useEffect(() => {
    if (uploadedDoc && analysisStatus === "idle" && !analysis) {
      runAnalysis(uploadedDoc);
    }
  }, [uploadedDoc, analysisStatus, analysis, runAnalysis]);

  // Analysis State
  const [activeTab, setActiveTab] = React.useState<AnalysisTabId>("overview");
  const [selectedSectionId, setSelectedSectionId] = React.useState<string | null>(null);
  const [selectedPage, setSelectedPage] = React.useState<number>(1);

  // Evidence Dialog State
  const [activeEvidence, setActiveEvidence] = React.useState<EvidenceDetail | null>(null);
  const [isEvidenceOpen, setIsEvidenceOpen] = React.useState(false);

  // Reset tab selection, active section, drawer, and evidence modal whenever the document changes or is cleared
  const currentDocId = uploadedDoc?.id || null;
  const prevDocIdRef = React.useRef<string | null>(currentDocId);
  React.useEffect(() => {
    if (prevDocIdRef.current !== currentDocId) {
      prevDocIdRef.current = currentDocId;
      setActiveTab("overview");
      setSelectedSectionId(null);
      setSelectedPage(1);
      setActiveEvidence(null);
      setIsEvidenceOpen(false);
      setIsDocDrawerOpen(false);
      setIsLeftCollapsed(true);
    }
  }, [currentDocId]);

  const selectedSection: DocumentSectionItem | null = React.useMemo(() => {
    if (!uploadedDoc || !uploadedDoc.sections || uploadedDoc.sections.length === 0) {
      return null;
    }
    if (selectedSectionId) {
      const match = uploadedDoc.sections.find((s) => s.sectionId === selectedSectionId);
      if (match) {
        return {
          id: match.sectionId,
          sectionNumber: match.sectionNumber || "•",
          title: match.title,
          pageNumber: match.pageReferences[0] || 1,
        };
      }
    }
    const first = uploadedDoc.sections[0];
    return {
      id: first.sectionId,
      sectionNumber: first.sectionNumber || "•",
      title: first.title,
      pageNumber: first.pageReferences[0] || 1,
    };
  }, [uploadedDoc, selectedSectionId]);

  // Development Preview State (normal by default; testable via ?state=loading|empty|error)
  const [previewStateOverride, setPreviewStateOverride] = React.useState<WorkspacePreviewState | null>(null);

  const previewState: WorkspacePreviewState = React.useMemo(() => {
    if (previewStateOverride) return previewStateOverride;
    if (!hasMounted) return "normal";
    try {
      const params = new URLSearchParams(window.location.search);
      const st = params.get("state") as WorkspacePreviewState | null;
      if (st && ["normal", "loading", "empty", "error"].includes(st)) {
        return st;
      }
    } catch {}
    return "normal";
  }, [hasMounted, previewStateOverride]);

  const handleOpenEvidence = (evidence: EvidenceDetail) => {
    setActiveEvidence(evidence);
    setIsEvidenceOpen(true);
  };

  const handleCloseEvidence = () => {
    setIsEvidenceOpen(false);
    setActiveEvidence(null);
  };

  const handleSelectSection = (section: DocumentSectionItem) => {
    setSelectedSectionId(section.id);
    setSelectedPage(section.pageNumber);
    setIsDocDrawerOpen(false);
  };

  const handleSelectPage = (pageNum: number) => {
    setSelectedPage(pageNum);
    setIsDocDrawerOpen(false);
  };

  // Case B: No active user-uploaded document exists
  if (!uploadedDoc && previewState === "normal") {
    if (!hasMounted) {
      return (
        <div className="flex flex-col h-screen w-full overflow-hidden bg-[var(--background)] text-[var(--foreground)]">
          <WorkspaceNav documentName={null} documentType={null} status="none" />
          <main className="flex-1 flex flex-col p-4 sm:p-6 lg:p-8 overflow-hidden">
            <WorkspaceSkeleton />
          </main>
        </div>
      );
    }

    return (
      <div className="flex flex-col h-screen w-full overflow-hidden bg-[var(--background)] text-[var(--foreground)]">
        <WorkspaceNav documentName={null} documentType={null} status="none" />
        <main className="flex-1 flex flex-col items-center justify-center p-6">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.txt"
            className="hidden"
            onChange={handleFileChange}
          />
          {uploadStatus === "uploading" || uploadStatus === "processing" ? (
            <div className="flex flex-col items-center justify-center p-8 space-y-4 max-w-md text-center">
              <div className="h-10 w-10 border-3 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-[var(--foreground)]">Processing your document...</p>
                <p className="text-xs text-[var(--foreground-muted)]">{uploadStageMessage || "Extracting legal text and sections"}</p>
              </div>
            </div>
          ) : (
            <WorkspaceEmpty
              title="No legal document uploaded"
              description="Upload your contract (PDF, DOCX, or TXT) to begin automated clause extraction, concern detection, and grounded legal intelligence."
              actionText="Select Document to Analyze"
              onUploadClick={() => fileInputRef.current?.click()}
            />
          )}
          {uploadError && (
            <p className="mt-4 text-xs text-red-600 dark:text-red-400 max-w-md text-center">{uploadError}</p>
          )}
        </main>
      </div>
    );
  }

  const docName = uploadedDoc?.displayName || null;
  const docType = uploadedDoc ? `${uploadedDoc.format.toUpperCase()} Legal Document` : null;
  const navStatus = analysis ? "analyzed" : isAnalyzing ? "analyzing" : "uploaded";

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-[var(--background)] text-[var(--foreground)]">
      {/* 1. Global Workspace Navigation */}
      <WorkspaceNav
        documentName={docName}
        documentType={docType}
        status={navStatus}
      />

      {/* 2. Mobile Quick-Navigation Strip (< 768px) */}
      <div className="md:hidden flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface)] px-2.5 sm:px-4 py-1.5 shrink-0">
        <span className="text-xs font-semibold text-[var(--foreground)] hidden xs:inline">
          Navigation:
        </span>

        <div className="flex items-center justify-between xs:justify-end gap-1.5 w-full xs:w-auto">
          <button
            type="button"
            onClick={() => setIsDocDrawerOpen(true)}
            className="flex-1 xs:flex-initial flex items-center justify-center gap-1.5 px-2.5 sm:px-3 min-h-[40px] rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-subtle)] text-xs font-medium text-[var(--foreground-secondary)] hover:text-[var(--foreground)] active:bg-[var(--surface-muted)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
            aria-label="Open document structure drawer"
          >
            <FileText className="h-3.5 w-3.5 text-red-500 shrink-0" aria-hidden="true" />
            <span>Document</span>
          </button>

          <button
            type="button"
            className="flex-1 xs:flex-initial flex items-center justify-center gap-1.5 px-3 min-h-[40px] rounded-[var(--radius-md)] bg-[var(--primary)] text-white text-xs font-medium shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
            aria-current="page"
          >
            <LayoutDashboard className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>Analysis</span>
          </button>
        </div>
      </div>

      {/* 3. Main Workspace Shell Area */}
      <div className="flex-1 flex overflow-hidden min-h-0 relative">
        {/* Loading State Preview */}
        {previewState === "loading" && <WorkspaceSkeleton />}

        {/* Empty State Preview */}
        {previewState === "empty" && (
          <WorkspaceEmpty />
        )}

        {/* Error State Preview */}
        {previewState === "error" && (
          <WorkspaceError onRetry={() => setPreviewStateOverride("normal")} />
        )}

        {/* Normal Mode: 2-Panel Workspace (Document Navigation + Main Analysis) */}
        {previewState === "normal" && uploadedDoc && (
          <>
            {/* Left: Document Panel (Desktop >= 1024px) */}
            <div className="hidden lg:flex h-full shrink-0">
              <DocumentPanel
                document={uploadedDoc}
                isCollapsed={isLeftCollapsed}
                onToggleCollapse={() => setIsLeftCollapsed(!isLeftCollapsed)}
                selectedSectionId={selectedSection?.id}
                onSelectSection={handleSelectSection}
                selectedPage={selectedPage}
                onSelectPage={handleSelectPage}
              />
            </div>

            {/* Center / Main: Primary Analysis Workspace */}
            <AnalysisMain
              realDocument={uploadedDoc}
              analysisResult={analysis}
              isAnalyzing={isAnalyzing}
              analysisError={analysisError}
              onTriggerAnalysis={() => runAnalysis(uploadedDoc)}
              activeTab={activeTab}
              onSelectTab={setActiveTab}
              selectedSection={selectedSection}
              selectedPage={selectedPage}
              onSelectSection={handleSelectSection}
              onClearSection={() => setSelectedSectionId(null)}
              onOpenDocumentDrawer={() => setIsDocDrawerOpen(true)}
              onViewEvidence={handleOpenEvidence}
            />
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
            document={uploadedDoc}
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

      {/* 5. Grounded Evidence Modal */}
      <EvidenceModal
        evidence={activeEvidence}
        isOpen={isEvidenceOpen}
        onClose={handleCloseEvidence}
      />
    </div>
  );
}
