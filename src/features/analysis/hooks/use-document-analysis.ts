"use client";

import * as React from "react";
import type { NormalizedDocument } from "@/types/document";
import type { AnalysisResult } from "@/lib/ai/types";

import { getActiveDocument, getWorkspaceGeneration } from "@/lib/document-storage";

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
  const inFlightRef = React.useRef(false);
  const analyzingDocIdRef = React.useRef<string | null>(null);
  const abortControllerRef = React.useRef<AbortController | null>(null);

  // Keep a stable ref to document to prevent runAnalysis callback from constantly re-creating
  const documentRef = React.useRef<NormalizedDocument | null>(document);
  documentRef.current = document;

  // Adjust state during render when document prop changes (React 19 pattern)
  if (docId !== prevDocId) {
    setPrevDocId(docId);
    const cached = docId ? getCachedAnalysis(docId) : null;
    setAnalysis(cached);
    setStatus(cached ? "success" : "idle");
    setErrorMessage(null);
  }

  // Handle switching to a different document: abort pending request for the PREVIOUS document.
  // Never abort on initial mount or when previous document ID was null.
  const activeDocIdTrackingRef = React.useRef<string | null>(docId);
  React.useEffect(() => {
    const previous = activeDocIdTrackingRef.current;
    if (previous && previous !== docId) {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      inFlightRef.current = false;
      analyzingDocIdRef.current = null;
    }
    activeDocIdTrackingRef.current = docId;
  }, [docId]);

  // Listen for external workspace reset event (Exit button)
  React.useEffect(() => {
    const handleWorkspaceReset = () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      inFlightRef.current = false;
      analyzingDocIdRef.current = null;
      setAnalysis(null);
      setStatus("idle");
      setErrorMessage(null);
    };

    window.addEventListener("lexiguide-workspace-reset", handleWorkspaceReset);
    return () => {
      window.removeEventListener("lexiguide-workspace-reset", handleWorkspaceReset);
    };
  }, []);

  const runAnalysis = React.useCallback(
    async (docToAnalyze?: NormalizedDocument | null) => {
      const targetDoc = docToAnalyze || documentRef.current;
      if (!targetDoc || !targetDoc.id) {
        setErrorMessage("No document selected for analysis.");
        setStatus("error");
        return;
      }

      // Check cache first before dispatching a network request
      const cached = getCachedAnalysis(targetDoc.id);
      if (cached) {
        setAnalysis(cached);
        setStatus("success");
        setErrorMessage(null);
        return;
      }

      // Guard against duplicate in-flight requests for the same document
      if (inFlightRef.current && analyzingDocIdRef.current === targetDoc.id) {
        console.log(`[AI-DIAG] Duplicate analysis request suppressed for docId=${targetDoc.id}`);
        return;
      }

      // Cancel any previous in-flight request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      inFlightRef.current = true;
      analyzingDocIdRef.current = targetDoc.id;

      const requestId = `ana_${Math.random().toString(36).substring(2, 9)}_${Date.now().toString(36)}`;
      const startWorkspaceGen = getWorkspaceGeneration();

      setStatus("preparing");
      setErrorMessage(null);

      try {
        setStatus("analyzing");
        const response = await fetch("/api/analysis", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Analysis-Request-Id": requestId,
          },
          body: JSON.stringify({ document: targetDoc, requestId }),
          signal: controller.signal,
        });

        // Abort guard
        if (controller.signal.aborted) {
          setStatus("idle");
          return;
        }

        const data = await response.json();

        // Workspace reset guard: verify workspace was not reset during analysis
        if (startWorkspaceGen !== getWorkspaceGeneration()) {
          console.log(`[AI-DIAG] Stale response discarded due to workspace reset: docId=${targetDoc.id}`);
          setStatus("idle");
          setAnalysis(null);
          return;
        }

        // Late response guard: verify this document is STILL the active document
        const currentActive = getActiveDocument();
        if (!currentActive || currentActive.id !== targetDoc.id) {
          console.log(
            `[AI-DIAG] Late analysis response discarded: activeDoc=${currentActive?.id}, targetDoc=${targetDoc.id}`
          );
          setStatus("idle");
          return;
        }

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
        if (err instanceof Error && err.name === "AbortError") {
          console.log(`[AI-DIAG] Analysis request aborted for docId=${targetDoc.id}`);
          setStatus("idle");
          return;
        }
        // If document was cleared while fetching, do not display error and return to idle
        const currentActive = getActiveDocument();
        if (!currentActive || currentActive.id !== targetDoc.id) {
          setStatus("idle");
          setAnalysis(null);
          return;
        }
        setErrorMessage(
          err instanceof Error
            ? err.message
            : "Network error contacting analysis service. Please try again."
        );
        setStatus("error");
      } finally {
        if (analyzingDocIdRef.current === targetDoc.id) {
          inFlightRef.current = false;
          analyzingDocIdRef.current = null;
        }
        if (abortControllerRef.current === controller) {
          abortControllerRef.current = null;
        }
      }
    },
    []
  );

  return {
    status,
    isAnalyzing: status === "preparing" || status === "analyzing",
    analysis,
    errorMessage,
    runAnalysis,
  };
}
