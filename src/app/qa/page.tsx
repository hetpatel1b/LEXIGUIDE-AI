import * as React from "react";
import type { Metadata } from "next";
import { QAWorkspace } from "@/features/qa";

export const metadata: Metadata = {
  title: "Ask Your Document — Grounded Q&A | LexiGuide AI",
  description:
    "Ask grounded questions about your uploaded legal document with source citations and verbatim evidence.",
};

export default function QAPage() {
  return (
    <React.Suspense fallback={<div className="p-8 text-center text-xs text-[var(--foreground-muted)]">Loading Q&amp;A workspace…</div>}>
      <QAWorkspace />
    </React.Suspense>
  );
}
