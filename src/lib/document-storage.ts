import type { NormalizedDocument } from "@/types/document";

const STORAGE_KEY = "lexiguide_active_document";

/**
 * Safely accesses client-side session storage for the currently processed document.
 * Enables seamless transition from upload to analysis workspace without a database.
 */
export function getActiveDocument(): NormalizedDocument | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as NormalizedDocument;
  } catch (err) {
    console.warn("Failed to retrieve document from sessionStorage:", err);
    return null;
  }
}

export function setActiveDocument(doc: NormalizedDocument): void {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(doc));
  } catch (err) {
    console.warn("Failed to persist document to sessionStorage:", err);
  }
}

export function clearActiveDocument(): void {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.warn("Failed to clear document from sessionStorage:", err);
  }
}
