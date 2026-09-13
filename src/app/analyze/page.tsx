import type { Metadata } from "next";
import { AnalysisWorkspace } from "@/features/analysis";

export const metadata: Metadata = {
  title: "Analysis Workspace — Employment_Agreement_2026.pdf",
  description:
    "Grounded legal document intelligence, clause analysis, potential concerns, obligations, and document copilot assistance.",
};

export default function AnalyzePage() {
  return <AnalysisWorkspace />;
}
