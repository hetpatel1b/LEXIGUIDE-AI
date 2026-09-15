import type { Metadata } from "next";
import { AnalysisWorkspace } from "@/features/analysis";

export const metadata: Metadata = {
  title: "Document Analysis Workspace | LexiGuide AI",
  description:
    "Grounded legal document intelligence, clause analysis, potential concerns, obligations, and structured contract review.",
};

export default function AnalyzePage() {
  return <AnalysisWorkspace />;
}
