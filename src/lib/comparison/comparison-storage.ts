"use client";

import type { NormalizedDocument } from "@/types/document";
import type {
  ComparisonCategory,
  ComparisonChange,
  ComparisonResult,
} from "@/types/comparison";
import { getActiveDocument } from "@/lib/document-storage";

export type ComparisonWorkspaceStatus =
  | "document_b_ready"
  | "comparing"
  | "completed"
  | "error";

export interface ComparisonWorkspaceState {
  comparisonId: string;
  documentAId: string;
  tempDocB: NormalizedDocument;
  status: ComparisonWorkspaceStatus;
  comparisonResult: ComparisonResult | null;
  comparisonError: string | null;
  loadingStage?: string;
  selectedCategory?: ComparisonCategory;
  createdAt: number;
  updatedAt: number;
}

const COMPARISON_WORKSPACE_PREFIX = "lexiguide_comparison_workspace_";
const COMPARISON_UPDATE_EVENT = "lexiguide-comparison-update";

// In-memory workspace-level singleton cache for synchronous tab restoration
let memoryComparisonState: ComparisonWorkspaceState | null = null;

// Module-level in-flight execution tracking
let activeRunnerAbortController: AbortController | null = null;
let activeRunnerDocAId: string | null = null;
let activeRunnerDocBId: string | null = null;
let activeRunnerPromise: Promise<ComparisonResult | null> | null = null;

/**
 * Retrieves the persisted comparison workspace state for the specified Document A.
 * Returns null if no comparison exists or if Document A does not match.
 */
export function getComparisonWorkspaceState(
  docAId: string
): ComparisonWorkspaceState | null {
  if (!docAId) return null;

  // 1. Check in-memory state first for synchronous zero-latency tab switching
  if (memoryComparisonState && memoryComparisonState.documentAId === docAId) {
    return memoryComparisonState;
  }

  if (typeof window === "undefined") return null;

  // 2. Fall back to sessionStorage
  try {
    const raw = window.sessionStorage.getItem(
      `${COMPARISON_WORKSPACE_PREFIX}${docAId}`
    );
    if (!raw) return null;

    const parsed = JSON.parse(raw) as ComparisonWorkspaceState;
    if (parsed && parsed.documentAId === docAId) {
      memoryComparisonState = parsed;
      return parsed;
    }
  } catch (err) {
    console.warn("Failed to retrieve comparison workspace state:", err);
  }

  return null;
}

/**
 * Persists the comparison workspace state to both memory and sessionStorage.
 * Dispatches an update event so active workspace views re-render immediately.
 */
export function setComparisonWorkspaceState(
  state: ComparisonWorkspaceState
): void {
  if (!state || !state.documentAId) return;

  state.updatedAt = Date.now();
  memoryComparisonState = state;

  if (typeof window !== "undefined") {
    try {
      // Efficiency Fix 2: Strip large arrays from tempDocB to fit in sessionStorage
      const stateToSave = { ...state };
      if (stateToSave.tempDocB) {
        stateToSave.tempDocB = {
          ...stateToSave.tempDocB,
          chunks: [],
          sections: [],
          pages: [],
        };
      }
      
      window.sessionStorage.setItem(
        `${COMPARISON_WORKSPACE_PREFIX}${state.documentAId}`,
        JSON.stringify(stateToSave)
      );
    } catch (err) {
      console.warn("Failed to persist comparison workspace state to sessionStorage:", err);
    }

    if (typeof window.dispatchEvent === "function") {
      window.dispatchEvent(new CustomEvent(COMPARISON_UPDATE_EVENT, { detail: state }));
    }
  }
}

/**
 * Clears comparison workspace state for a given document A (or all if unprovided).
 * Optionally informs the server to remove the ephemeral comparison record.
 */
export function clearComparisonWorkspaceState(
  docAId?: string,
  comparisonId?: string,
  documentBId?: string
): void {
  // Abort any in-flight comparison runner for this document
  if (activeRunnerAbortController && (!docAId || activeRunnerDocAId === docAId)) {
    activeRunnerAbortController.abort();
    activeRunnerAbortController = null;
    activeRunnerDocAId = null;
    activeRunnerDocBId = null;
    activeRunnerPromise = null;
  }

  const compIdToDelete = comparisonId || memoryComparisonState?.comparisonId;
  const docBIdToDelete = documentBId || memoryComparisonState?.tempDocB?.id;

  if (memoryComparisonState && (!docAId || memoryComparisonState.documentAId === docAId)) {
    memoryComparisonState = null;
  }

  if (typeof window !== "undefined") {
    try {
      if (docAId) {
        window.sessionStorage.removeItem(`${COMPARISON_WORKSPACE_PREFIX}${docAId}`);
      } else {
        // Clear all comparison workspace entries
        const keysToRemove: string[] = [];
        for (let i = 0; i < window.sessionStorage.length; i++) {
          const key = window.sessionStorage.key(i);
          if (key && key.startsWith(COMPARISON_WORKSPACE_PREFIX)) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach((k) => window.sessionStorage.removeItem(k));
      }
    } catch (err) {
      console.warn("Failed to clear comparison workspace state from sessionStorage:", err);
    }

    // Inform server to clear temporary Document B / comparison record (best effort)
    if (compIdToDelete || docBIdToDelete) {
      try {
        if (typeof fetch === "function") {
          fetch("/api/comparison", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              comparisonId: compIdToDelete,
              documentBId: docBIdToDelete,
            }),
            keepalive: true,
          }).catch((e) => {
            console.warn("Failed to notify server of comparison deletion:", e);
          });
        }
      } catch (err) {
        console.warn("Error calling DELETE /api/comparison:", err);
      }
    }

    if (typeof window.dispatchEvent === "function") {
      window.dispatchEvent(
        new CustomEvent(COMPARISON_UPDATE_EVENT, { detail: null })
      );
    }
  }
}

/**
 * Executes the comparison workflow at the workspace level.
 * This ensures in-flight execution is NOT cancelled when switching tabs,
 * and the completed result is preserved when returning.
 */
export async function runComparisonWorkflow(
  targetA: NormalizedDocument,
  targetB: NormalizedDocument,
  compId?: string
): Promise<ComparisonResult | null> {
  if (!targetA || !targetB) return null;
  if (targetA.id === targetB.id) {
    const errorState: ComparisonWorkspaceState = {
      comparisonId: compId || `cmp_${Date.now()}`,
      documentAId: targetA.id,
      tempDocB: targetB,
      status: "error",
      comparisonResult: null,
      comparisonError: "Select two different documents to compare.",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setComparisonWorkspaceState(errorState);
    return null;
  }

  // Deduplicate: If already running for the exact same document pair, reuse promise
  if (
    activeRunnerPromise &&
    activeRunnerDocAId === targetA.id &&
    activeRunnerDocBId === targetB.id
  ) {
    return activeRunnerPromise;
  }

  // Cancel any prior in-flight runner
  if (activeRunnerAbortController) {
    activeRunnerAbortController.abort();
  }

  const controller = new AbortController();
  activeRunnerAbortController = controller;
  activeRunnerDocAId = targetA.id;
  activeRunnerDocBId = targetB.id;

  const effectiveCompId =
    compId ||
    memoryComparisonState?.comparisonId ||
    `cmp_${Math.random().toString(36).substring(2, 9)}_${Date.now().toString(36)}`;

  // Set initial loading state
  const initialLoadingState: ComparisonWorkspaceState = {
    comparisonId: effectiveCompId,
    documentAId: targetA.id,
    tempDocB: targetB,
    status: "comparing",
    comparisonResult: null,
    comparisonError: null,
    loadingStage: "Preparing documents…",
    createdAt: memoryComparisonState?.createdAt || Date.now(),
    updatedAt: Date.now(),
  };
  setComparisonWorkspaceState(initialLoadingState);

  // Progressive stage update timers
  const t1 = setTimeout(() => {
    if (activeRunnerDocAId === targetA.id && !controller.signal.aborted) {
      const current = getComparisonWorkspaceState(targetA.id);
      if (current && current.status === "comparing") {
        setComparisonWorkspaceState({
          ...current,
          loadingStage: "Mapping corresponding sections…",
        });
      }
    }
  }, 300);

  const t2 = setTimeout(() => {
    if (activeRunnerDocAId === targetA.id && !controller.signal.aborted) {
      const current = getComparisonWorkspaceState(targetA.id);
      if (current && current.status === "comparing") {
        setComparisonWorkspaceState({
          ...current,
          loadingStage: "Checking clause changes…",
        });
      }
    }
  }, 700);

  const t3 = setTimeout(() => {
    if (activeRunnerDocAId === targetA.id && !controller.signal.aborted) {
      const current = getComparisonWorkspaceState(targetA.id);
      if (current && current.status === "comparing") {
        setComparisonWorkspaceState({
          ...current,
          loadingStage: "Reviewing significant differences…",
        });
      }
    }
  }, 1400);

  const promise = (async (): Promise<ComparisonResult | null> => {
    try {
      const response = await fetch("/api/comparison", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          documentAId: targetA.id,
          documentBId: targetB.id,
          comparisonId: effectiveCompId,
        }),
        signal: controller.signal,
      });

      const data = await response.json();

      // Guard: Ensure Document A is STILL the active document in the workspace
      const currentActive = getActiveDocument();
      if (!currentActive || currentActive.id !== targetA.id) {
        return null;
      }

      if (response.ok && data.success && data.data) {
        const completedResult = data.data as ComparisonResult;
        const completedState: ComparisonWorkspaceState = {
          comparisonId: effectiveCompId,
          documentAId: targetA.id,
          tempDocB: targetB,
          status: "completed",
          comparisonResult: completedResult,
          comparisonError: null,
          createdAt: initialLoadingState.createdAt,
          updatedAt: Date.now(),
        };
        setComparisonWorkspaceState(completedState);
        return completedResult;
      } else {
        const errMsg =
          data?.error?.message || "Unable to compare the selected documents.";
        const errorState: ComparisonWorkspaceState = {
          comparisonId: effectiveCompId,
          documentAId: targetA.id,
          tempDocB: targetB,
          status: "error",
          comparisonResult: null,
          comparisonError: errMsg,
          createdAt: initialLoadingState.createdAt,
          updatedAt: Date.now(),
        };
        setComparisonWorkspaceState(errorState);
        return null;
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        return null;
      }
      const currentActive = getActiveDocument();
      if (!currentActive || currentActive.id !== targetA.id) {
        return null;
      }
      const errorState: ComparisonWorkspaceState = {
        comparisonId: effectiveCompId,
        documentAId: targetA.id,
        tempDocB: targetB,
        status: "error",
        comparisonResult: null,
        comparisonError:
          "Network error occurred while connecting to comparison engine.",
        createdAt: initialLoadingState.createdAt,
        updatedAt: Date.now(),
      };
      setComparisonWorkspaceState(errorState);
      return null;
    } finally {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      if (activeRunnerDocAId === targetA.id) {
        activeRunnerAbortController = null;
        activeRunnerDocAId = null;
        activeRunnerDocBId = null;
        activeRunnerPromise = null;
      }
    }
  })();

  activeRunnerPromise = promise;
  return promise;
}
