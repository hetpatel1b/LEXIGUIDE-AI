import test from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { defaultQaService, QaService } from "@/lib/ai/qa/qa-service";

const WORKSPACE_FILE = path.join(process.cwd(), "src/features/analysis/components/analysis-workspace.tsx");
const MAIN_FILE = path.join(process.cwd(), "src/features/analysis/components/analysis-main.tsx");
const ANALYSIS_INDEX = path.join(process.cwd(), "src/features/analysis/index.ts");
const COPILOT_DIR = path.join(process.cwd(), "src/features/analysis/components/copilot");
const EVIDENCE_TYPES = path.join(process.cwd(), "src/types/evidence.ts");
const NAV_FILE = path.join(process.cwd(), "src/components/shared/workspace-nav.tsx");
const QA_WORKSPACE_FILE = path.join(process.cwd(), "src/features/qa/components/qa-workspace.tsx");
const QA_CONV_FILE = path.join(process.cwd(), "src/features/qa/components/qa-conversation.tsx");
const QA_INPUT_FILE = path.join(process.cwd(), "src/features/qa/components/qa-input.tsx");
const QA_INDEX = path.join(process.cwd(), "src/features/qa/index.ts");

test("Phase 7: Analysis Workspace does not render or import Document Copilot", () => {
  assert.strictEqual(
    fs.existsSync(COPILOT_DIR),
    false,
    "The Analysis Workspace copilot directory (components/copilot) must not exist"
  );

  const workspaceContent = fs.readFileSync(WORKSPACE_FILE, "utf-8");
  assert.strictEqual(
    workspaceContent.includes("CopilotPanel"),
    false,
    "AnalysisWorkspace must not import or render CopilotPanel"
  );
  assert.strictEqual(
    workspaceContent.includes("isCopilotDrawerOpen"),
    false,
    "AnalysisWorkspace must not contain isCopilotDrawerOpen state"
  );
  assert.strictEqual(
    workspaceContent.includes("isRightCollapsed"),
    false,
    "AnalysisWorkspace must not contain isRightCollapsed state"
  );
  assert.strictEqual(
    workspaceContent.includes("Document Copilot"),
    false,
    "AnalysisWorkspace must not contain 'Document Copilot' text or title"
  );
  assert.strictEqual(
    workspaceContent.includes("Open Copilot assistant drawer"),
    false,
    "AnalysisWorkspace must not contain Copilot drawer triggers"
  );

  const mainContent = fs.readFileSync(MAIN_FILE, "utf-8");
  assert.strictEqual(
    mainContent.includes("onOpenCopilotDrawer"),
    false,
    "AnalysisMain must not declare or accept onOpenCopilotDrawer prop"
  );
  assert.strictEqual(
    mainContent.includes("Open Document Copilot assistant drawer"),
    false,
    "AnalysisMain must not render mobile Copilot button"
  );

  const indexContent = fs.readFileSync(ANALYSIS_INDEX, "utf-8");
  assert.strictEqual(
    indexContent.includes("copilot-panel"),
    false,
    "Analysis index must not export copilot-panel"
  );
  assert.strictEqual(
    indexContent.includes("Copilot"),
    false,
    "Analysis index must not mention Copilot"
  );

  const evidenceContent = fs.readFileSync(EVIDENCE_TYPES, "utf-8");
  assert.strictEqual(
    evidenceContent.includes("CopilotQAPair"),
    false,
    "Evidence types must not retain unused CopilotQAPair"
  );
});

test("Phase 7: Analysis Workspace cleanly reclaims layout with 2-column desktop architecture", () => {
  const workspaceContent = fs.readFileSync(WORKSPACE_FILE, "utf-8");

  // DocumentPanel and AnalysisMain are the only two workspace columns
  assert.ok(
    workspaceContent.includes("<DocumentPanel"),
    "AnalysisWorkspace must render DocumentPanel"
  );
  assert.ok(
    workspaceContent.includes("<AnalysisMain"),
    "AnalysisWorkspace must render AnalysisMain"
  );

  // Desktop default is collapsed navigation (isLeftCollapsed: true)
  assert.ok(
    workspaceContent.includes("const [isLeftCollapsed, setIsLeftCollapsed] = React.useState(true);"),
    "Desktop layout must default to collapsed Document navigation (isLeftCollapsed = true)"
  );

  // Mobile navigation strip contains Document + Analysis only
  assert.ok(
    workspaceContent.includes("aria-label=\"Open document structure drawer\""),
    "Mobile strip must preserve Document navigation drawer trigger"
  );
  assert.ok(
    workspaceContent.includes("<span>Analysis</span>"),
    "Mobile strip must preserve Analysis active page view"
  );

  // Accessibility labels in DocumentPanel
  const docPanelContent = fs.readFileSync(path.join(process.cwd(), "src/features/analysis/components/document-panel.tsx"), "utf-8");
  assert.ok(
    docPanelContent.includes('aria-label="Open document navigation"'),
    "DocumentPanel must have accessible label 'Open document navigation' when collapsed"
  );
  assert.ok(
    docPanelContent.includes('aria-label="Close document navigation"'),
    "DocumentPanel must have accessible label 'Close document navigation' when expanded"
  );

  // Scroll stability in AnalysisMain
  const mainContent = fs.readFileSync(MAIN_FILE, "utf-8");
  assert.ok(
    mainContent.includes("[scrollbar-gutter:stable]"),
    "AnalysisMain must use [scrollbar-gutter:stable] to eliminate scrollbar width vibration"
  );

  // Layout stability in AnalysisTabs: no ResizeObserver loop
  const tabsContent = fs.readFileSync(path.join(process.cwd(), "src/features/analysis/components/analysis-tabs.tsx"), "utf-8");
  assert.strictEqual(
    tabsContent.includes("ResizeObserver"),
    false,
    "AnalysisTabs must not contain ResizeObserver layout re-measurement loop"
  );
});

test("Phase 7: Ask Document still renders and functions as the dedicated Q&A destination", () => {
  // 1. Navigation route exists and is configured
  const navContent = fs.readFileSync(NAV_FILE, "utf-8");
  assert.ok(navContent.includes('href: "/qa"'), "WORKSPACE_ROUTES must include '/qa'");
  assert.ok(navContent.includes('label: "Ask Document"'), "Route must be labeled 'Ask Document'");

  // 2. Dedicated Q&A component files exist and export components
  const qaIndexContent = fs.readFileSync(QA_INDEX, "utf-8");
  assert.ok(qaIndexContent.includes("qa-workspace"), "QA index must export qa-workspace");
  assert.ok(qaIndexContent.includes("qa-conversation"), "QA index must export qa-conversation");
  assert.ok(qaIndexContent.includes("qa-topic-groups"), "QA index must export qa-topic-groups");
  assert.ok(qaIndexContent.includes("qa-input"), "QA index must export qa-input");

  assert.ok(fs.existsSync(QA_WORKSPACE_FILE), "qa-workspace component file must exist");
  assert.ok(fs.existsSync(QA_CONV_FILE), "qa-conversation component file must exist");
  assert.ok(fs.existsSync(QA_INPUT_FILE), "qa-input component file must exist");

  // 3. QA service is exported and instantiated
  assert.ok(defaultQaService, "defaultQaService singleton must be available");
  assert.strictEqual(typeof defaultQaService.answerQuestion, "function");
  assert.ok(QaService, "QaService class constructor must be available");
});

test("Phase 7: Preserves all 6 analysis tabs and evidence interaction in Analysis Workspace", () => {
  const mainContent = fs.readFileSync(MAIN_FILE, "utf-8");

  assert.ok(mainContent.includes("OverviewTab"), "Overview tab must remain intact");
  assert.ok(mainContent.includes("SummaryTab"), "Summary tab must remain intact");
  assert.ok(mainContent.includes("ClausesTab"), "Clauses tab must remain intact");
  assert.ok(mainContent.includes("ConcernsTab"), "Concerns tab must remain intact");
  assert.ok(mainContent.includes("ObligationsTab"), "Obligations tab must remain intact");
  assert.ok(mainContent.includes("DatesTab"), "Dates tab must remain intact");
  assert.ok(mainContent.includes("RealDocumentView"), "RealDocumentView structure view must remain intact");
  assert.ok(mainContent.includes("onViewEvidence"), "Evidence inspection must remain intact");
});
