/**
 * Application-wide functional constants and configuration constraints.
 * Prepares the architectural boundaries for future development phases.
 */

export const SUPPORTED_FILE_EXTENSIONS = [".pdf", ".docx", ".txt"] as const;
export type SupportedFileExtension = (typeof SUPPORTED_FILE_EXTENSIONS)[number];

export const SUPPORTED_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
] as const;

export const FILE_CONSTRAINTS = {
  maxFileSizeMB: 25,
  maxFileSizeBytes: 25 * 1024 * 1024,
  maxPages: 150,
  acceptedMimeTypes: SUPPORTED_MIME_TYPES,
  acceptedExtensions: SUPPORTED_FILE_EXTENSIONS,
} as const;

export const APP_METADATA = {
  version: "0.1.0",
  phase: "Phase 1A — Project Foundation & Architecture",
  targetJurisdictions: ["India", "International / General"],
} as const;

export interface NavLinkItem {
  label: string;
  href: string;
  disabled?: boolean;
  tag?: string;
}

export const NAV_LINKS: readonly NavLinkItem[] = [
  { label: "Overview", href: "/", disabled: false },
  { label: "Analysis Workspace", href: "/analyze", disabled: false },
  { label: "Ask Document (Q&A)", href: "/qa", disabled: false },
  { label: "Document Compare", href: "/compare", disabled: false },
  { label: "Action Center", href: "/action-center", disabled: false },
] as const;
