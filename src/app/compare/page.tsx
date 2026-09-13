import type { Metadata } from "next";
import { ComparisonWorkspace } from "@/features/comparison";

export const metadata: Metadata = {
  title: "Document Comparison — Employment Agreement 2026 vs Updated | LexiGuide AI",
  description:
    "Compare original and updated revisions of legal documents, identify clause-level differences, notice period changes, and review context.",
};

export default function ComparePage() {
  return <ComparisonWorkspace />;
}
