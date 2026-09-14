import type { Metadata } from "next";
import { AnalysisWorkspace } from "@/features/analysis";

export const metadata: Metadata = {
  title: "Document Analysis Workspace | LexiGuide AI",
  description:
    "Grounded legal document intelligence, clause analysis, potential concerns, obligations, and document copilot assistance.",
};

export default function AnalyzePage() {
  return <AnalysisWorkspace />;
}
