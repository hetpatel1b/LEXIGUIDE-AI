import type { NormalizedDocument } from "@/types/document";
import type { AnalysisResult } from "@/lib/ai/types";

const ACTIVE_DOC_STORAGE_KEY = "lexiguide_active_document";
const SESSION_DOCS_STORAGE_KEY = "lexiguide_session_documents";
const ANALYSIS_CACHE_PREFIX = "lexiguide_ai_analysis_";

/**
 * Checks whether a document is a legacy demo or synthetic fixture.
 */
export function isLegacyDemoDocument(doc: Partial<NormalizedDocument>): boolean {
  if (!doc) return false;
  if (doc.id === "doc-ea-2026") return true;
  if (typeof doc.id === "string" && (doc.id.startsWith("doc_test_") || doc.id.startsWith("doc-test"))) return true;
  if (doc.source === "test-fixture") return true;

  const names = [
    doc.displayName,
    doc.originalFilename,
    (doc as Record<string, unknown>).fileName as string | undefined,
    (doc as Record<string, unknown>).name as string | undefined,
  ]
    .filter(Boolean)
    .map((n) => n!.toLowerCase());

  const testKeywords = [
    "employment_agreement_2026",
    "standard_employment_agreement",
    "comprehensive_legal_test",
    "lexiguide_ai_comprehensive",
    "test_contract",
    "sample-agreement",
    "sample_agreement",
    "scanned-mock",
    "fake-docx",
    "sample-long-filename",
  ];

  for (const name of names) {
    for (const kw of testKeywords) {
      if (name.includes(kw)) return true;
    }
  }

  return false;
}

/**
 * Safely accesses client-side session storage for the currently active document.
 * Enforces stale-state sanitation: if a legacy demo document is detected, it is purged.
 */
export function getActiveDocument(): NormalizedDocument | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.sessionStorage.getItem(ACTIVE_DOC_STORAGE_KEY);
    if (!raw) return null;

    const doc = JSON.parse(raw) as NormalizedDocument;

    // Purge legacy demo fixture if found in session storage
    if (isLegacyDemoDocument(doc)) {
      console.warn("Purged legacy demo fixture from session storage:", doc.displayName || doc.id);
      clearActiveDocument();
      // Also purge from session documents list if present
      const rawSessionDocs = window.sessionStorage.getItem(SESSION_DOCS_STORAGE_KEY);
      if (rawSessionDocs) {
        try {
          const docs = JSON.parse(rawSessionDocs) as NormalizedDocument[];
          const filtered = docs.filter((d) => !isLegacyDemoDocument(d));
          window.sessionStorage.setItem(SESSION_DOCS_STORAGE_KEY, JSON.stringify(filtered));
        } catch {}
      }
      return null;
    }

    return doc;
  } catch (err) {
    console.warn("Failed to retrieve active document from sessionStorage:", err);
    return null;
  }
}

/**
 * Persists the active document to sessionStorage and updates the session documents list.
 */
export function setActiveDocument(doc: NormalizedDocument): void {
  if (typeof window === "undefined") return;

  try {
    if (isLegacyDemoDocument(doc)) {
      clearActiveDocument();
      return;
    }

    // Stamp provenance if missing
    if (!doc.source) {
      doc.source = "user-upload";
    }

    window.sessionStorage.setItem(ACTIVE_DOC_STORAGE_KEY, JSON.stringify(doc));
    saveSessionDocument(doc);
    if (typeof window.dispatchEvent === "function") {
      window.dispatchEvent(new Event("lexiguide-doc-update"));
    }
  } catch (err) {
    console.warn("Failed to persist active document to sessionStorage:", err);
  }
}

/**
 * Clears the active document from sessionStorage.
 */
export function clearActiveDocument(): void {
  if (typeof window === "undefined") return;

  try {
    const raw = window.sessionStorage.getItem(ACTIVE_DOC_STORAGE_KEY);
    if (raw) {
      try {
        const doc = JSON.parse(raw);
        if (doc?.id) {
          window.sessionStorage.removeItem(`${ANALYSIS_CACHE_PREFIX}${doc.id}`);
        }
      } catch {}
    }
    window.sessionStorage.removeItem(ACTIVE_DOC_STORAGE_KEY);
    if (typeof window.dispatchEvent === "function") {
      window.dispatchEvent(new Event("lexiguide-doc-update"));
    }
  } catch (err) {
    console.warn("Failed to clear active document from sessionStorage:", err);
  }
}

/**
 * Returns all user-uploaded documents stored in the current session.
 */
export function getSessionDocuments(): NormalizedDocument[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.sessionStorage.getItem(SESSION_DOCS_STORAGE_KEY);
    if (!raw) {
      // Fallback: If session docs list is empty but an active document exists, return it
      const active = getActiveDocument();
      return active ? [active] : [];
    }

    const docs = JSON.parse(raw) as NormalizedDocument[];
    // Filter out any legacy demo documents
    const validDocs = docs.filter((d) => !isLegacyDemoDocument(d));

    if (validDocs.length !== docs.length) {
      window.sessionStorage.setItem(SESSION_DOCS_STORAGE_KEY, JSON.stringify(validDocs));
    }

    return validDocs;
  } catch (err) {
    console.warn("Failed to retrieve session documents from sessionStorage:", err);
    return [];
  }
}

/**
 * Saves or updates a document in the session documents list.
 */
export function saveSessionDocument(doc: NormalizedDocument): void {
  if (typeof window === "undefined") return;

  try {
    if (isLegacyDemoDocument(doc)) return;

    const currentDocs = getSessionDocuments();
    const existingIndex = currentDocs.findIndex((d) => d.id === doc.id);

    let updated: NormalizedDocument[];
    if (existingIndex >= 0) {
      updated = [...currentDocs];
      updated[existingIndex] = doc;
    } else {
      updated = [doc, ...currentDocs];
    }

    window.sessionStorage.setItem(SESSION_DOCS_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn("Failed to update session documents list in sessionStorage:", err);
  }
}

/**
 * Switches the active document in the session to the one with the specified ID.
 * Returns the newly active document, or null if not found.
 */
export function switchActiveDocument(docId: string): NormalizedDocument | null {
  if (typeof window === "undefined") return null;

  const docs = getSessionDocuments();
  const target = docs.find((d) => d.id === docId);
  if (!target) return null;

  try {
    window.sessionStorage.setItem(ACTIVE_DOC_STORAGE_KEY, JSON.stringify(target));
    return target;
  } catch (err) {
    console.warn("Failed to switch active document in sessionStorage:", err);
    return null;
  }
}

/**
 * Removes a document from the session documents list and clears active document if it matches.
 */
export function removeSessionDocument(docId: string): void {
  if (typeof window === "undefined") return;

  try {
    const currentDocs = getSessionDocuments();
    const updated = currentDocs.filter((d) => d.id !== docId);
    window.sessionStorage.setItem(SESSION_DOCS_STORAGE_KEY, JSON.stringify(updated));

    const active = getActiveDocument();
    if (active && active.id === docId) {
      if (updated.length > 0) {
        setActiveDocument(updated[0]);
      } else {
        clearActiveDocument();
      }
    }
  } catch (err) {
    console.warn("Failed to remove document from sessionStorage:", err);
  }
}

/**
 * Clears all session documents and the active document.
 */
export function clearAllDocuments(): void {
  if (typeof window === "undefined") return;

  try {
    const raw = window.sessionStorage.getItem(ACTIVE_DOC_STORAGE_KEY);
    if (raw) {
      try {
        const doc = JSON.parse(raw);
        if (doc?.id) {
          window.sessionStorage.removeItem(`${ANALYSIS_CACHE_PREFIX}${doc.id}`);
        }
      } catch {}
    }

    const rawDocs = window.sessionStorage.getItem(SESSION_DOCS_STORAGE_KEY);
    if (rawDocs) {
      try {
        const docs = JSON.parse(rawDocs) as NormalizedDocument[];
        docs.forEach((d) => {
          if (d?.id) {
            window.sessionStorage.removeItem(`${ANALYSIS_CACHE_PREFIX}${d.id}`);
          }
        });
      } catch {}
    }

    window.sessionStorage.removeItem(ACTIVE_DOC_STORAGE_KEY);
    window.sessionStorage.removeItem(SESSION_DOCS_STORAGE_KEY);

    if (typeof window.dispatchEvent === "function") {
      window.dispatchEvent(new Event("lexiguide-doc-update"));
    }
  } catch (err) {
    console.warn("Failed to clear all documents from sessionStorage:", err);
  }
}

/**
 * Retrieves cached AI analysis result for a document ID if present.
 */
export function getCachedAnalysis(docId: string): AnalysisResult | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(`${ANALYSIS_CACHE_PREFIX}${docId}`);
    return raw ? (JSON.parse(raw) as AnalysisResult) : null;
  } catch {
    return null;
  }
}

/**
 * Saves AI analysis result for a document ID to cache.
 */
export function setCachedAnalysis(docId: string, result: AnalysisResult): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(`${ANALYSIS_CACHE_PREFIX}${docId}`, JSON.stringify(result));
  } catch {
    // Ignore storage quota errors
  }
}
