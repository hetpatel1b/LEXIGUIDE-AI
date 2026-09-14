"use client";

import * as React from "react";
import type { NormalizedDocument } from "@/types/document";
import type { AnalysisResult } from "@/lib/ai/types";

export type AnalysisStatus = "idle" | "preparing" | "analyzing" | "success" | "error";

const CACHE_PREFIX = "lexiguide_ai_analysis_";

function getCachedAnalysis(docId: string): AnalysisResult | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(`${CACHE_PREFIX}${docId}`);
    return raw ? (JSON.parse(raw) as AnalysisResult) : null;
  } catch {
    return null;
  }
}

function setCachedAnalysis(docId: string, result: AnalysisResult): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(`${CACHE_PREFIX}${docId}`, JSON.stringify(result));
  } catch {
    // Ignore storage quota errors
  }
}

export function useDocumentAnalysis(document: NormalizedDocument | null) {
  const docId = document?.id || null;
  const [prevDocId, setPrevDocId] = React.useState<string | null>(docId);
  const [analysis, setAnalysis] = React.useState<AnalysisResult | null>(() => {
    return docId ? getCachedAnalysis(docId) : null;
  });
  const [status, setStatus] = React.useState<AnalysisStatus>(() => {
    if (docId) {
      const cached = getCachedAnalysis(docId);
      if (cached) return "success";
    }
    return "idle";
  });
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  // Adjust state during render when document prop changes (React 19 pattern)
  if (docId !== prevDocId) {
    setPrevDocId(docId);
    const cached = docId ? getCachedAnalysis(docId) : null;
    setAnalysis(cached);
    setStatus(cached ? "success" : "idle");
    setErrorMessage(null);
  }

  const runAnalysis = React.useCallback(
    async (docToAnalyze?: NormalizedDocument | null) => {
      const targetDoc = docToAnalyze || document;
      if (!targetDoc || !targetDoc.id) {
        setErrorMessage("No document selected for analysis.");
        setStatus("error");
        return;
      }

      setStatus("preparing");
      setErrorMessage(null);

      try {
        setStatus("analyzing");
        const response = await fetch("/api/analysis", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ document: targetDoc }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          const message =
            data?.error?.message ||
            "Failed to complete AI document analysis. Please try again.";
          setErrorMessage(message);
          setStatus("error");
          return;
        }

        const result = data.data as AnalysisResult;
        setCachedAnalysis(targetDoc.id, result);
        setAnalysis(result);
        setStatus("success");
      } catch (err) {
        setErrorMessage(
          err instanceof Error
            ? err.message
            : "Network error contacting analysis service. Please try again."
        );
        setStatus("error");
      }
    },
    [document]
  );

  return {
    status,
    isAnalyzing: status === "preparing" || status === "analyzing",
    analysis,
    errorMessage,
    runAnalysis,
  };
}
