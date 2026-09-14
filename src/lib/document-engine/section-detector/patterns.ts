/**
 * Standard legal heading and section regex patterns.
 * Deterministic and heuristic — no AI inference.
 */

export interface DetectedSectionMatch {
  rawLine: string;
  sectionNumber: string | null;
  title: string;
  lineIndex: number;
  offset: number;
}

// 1. ARTICLE patterns: e.g. "ARTICLE I", "ARTICLE 1", "ARTICLE IV - DEFINITIONS"
export const ARTICLE_PATTERN =
  /^\s*(ARTICLE\s+(?:[IVXLCDM]+|\d+))\s*[:.\-–—]?\s*([^\n]{0,100})$/i;

// 2. SECTION patterns: e.g. "SECTION 1", "SECTION 2.3 - TERMINATION"
export const SECTION_PATTERN =
  /^\s*(SECTION\s+\d+(?:\.\d+)*)\s*[:.\-–—]?\s*([^\n]{0,100})$/i;

// 3. CLAUSE patterns: e.g. "CLAUSE 1", "CLAUSE 3.2"
export const CLAUSE_PATTERN =
  /^\s*(CLAUSE\s+\d+(?:\.\d+)*)\s*[:.\-–—]?\s*([^\n]{0,100})$/i;

// 4. SCHEDULE / EXHIBIT / APPENDIX: e.g. "SCHEDULE A", "EXHIBIT 1", "APPENDIX B"
export const SCHEDULE_PATTERN =
  /^\s*((?:SCHEDULE|EXHIBIT|APPENDIX|ANNEX)\s+[A-Z0-9]+)\s*[:.\-–—]?\s*([^\n]{0,100})$/i;

// 5. Numbered sections: e.g. "1. Definitions", "1.1 Confidential Information", "2. Term and Termination"
export const NUMBERED_SECTION_PATTERN =
  /^\s*(\d+(?:\.\d+)*)\.?\s+([A-Z][^\n]{2,80})$/;

// 6. Well-known legal standalone headings (case-insensitive)
export const COMMON_LEGAL_HEADINGS = [
  "Definitions",
  "Interpretation",
  "Scope of Services",
  "Term and Termination",
  "Termination",
  "Compensation and Benefits",
  "Fees and Payment",
  "Duties and Responsibilities",
  "Confidentiality",
  "Non-Disclosure",
  "Non-Compete",
  "Non-Solicitation",
  "Intellectual Property",
  "Proprietary Rights",
  "Representations and Warranties",
  "Indemnification",
  "Limitation of Liability",
  "Governing Law",
  "Dispute Resolution",
  "Arbitration",
  "Severability",
  "Entire Agreement",
  "Notice",
  "Notices",
  "Amendments",
  "Assignment",
  "Force Majeure",
  "Waiver",
  "Counterparts",
  "Survival",
  "General Provisions",
  "Miscellaneous",
] as const;

export const COMMON_LEGAL_HEADING_SET = new Set(
  COMMON_LEGAL_HEADINGS.map((h) => h.toLowerCase())
);
