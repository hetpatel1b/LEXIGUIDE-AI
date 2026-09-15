import { ClauseUnit } from "./types";

/**
 * Checks whether a section is a non-operative structural element
 * (e.g. Preamble, Recitals, Table of Contents, Definitions, Disclaimers).
 */
export function isNonOperativeSection(title: string): boolean {
  const lower = title.toLowerCase();
  return (
    lower.includes("preamble") ||
    lower.includes("recital") ||
    lower.includes("witnesseth") ||
    lower.includes("whereas") ||
    lower.includes("table of contents") ||
    lower.includes("definitions") ||
    lower.includes("disclaimer") ||
    lower.includes("background") ||
    lower.includes("preliminary") ||
    lower.includes("parties and recitals")
  );
}

/**
 * Detects explicit contractual qualifiers and carve-outs.
 */
export function extractQualifiers(text: string): string[] {
  const lower = text.toLowerCase();
  const qualifiers: string[] = [];

  const patterns = [
    /except as (?:otherwise )?(?:provided|set forth|specified)/g,
    /subject to (?:schedule|section|applicable policy|applicable law)/g,
    /unless otherwise (?:agreed|specified|provided)/g,
    /notwithstanding (?:any provision|anything to the contrary|section|the foregoing)/g,
    /provided(?:, however,)? that/g,
    /in the event of (?:an emergency|dispute)/g,
    /unless agreed in writing/g,
    /only if approved/g,
    /where applicable/g,
  ];

  for (const pattern of patterns) {
    const matches = lower.match(pattern);
    if (matches) {
      qualifiers.push(...matches);
    }
  }

  return qualifiers;
}

/**
 * Splits a chunk into distinct clause units / sentences, tracking embedded headings.
 */
export function parseClauseUnits(chunkText: string, defaultHeading: string): ClauseUnit[] {
  // Normalize embedded markdown headings so they each begin on a new line
  const normalizedText = chunkText.replace(/\s*(#+)\s+/g, "\n$1 ");
  const lines = normalizedText.split(/\r?\n+/);
  let currentHeading = defaultHeading;
  const units: ClauseUnit[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Detect embedded markdown headings like "## Schedule B: Invoicing & Disbursement Schedule Payment of all vendor invoices..."
    const embeddedSentenceMatch = trimmed.match(
      /^#+\s*([A-Za-z0-9\s—–:&.,]+?)\s+(Payment\b.+|All\b.+|During\b.+|The\b.+|Vendor\b.+|Executive\b.+|Company\b.+)$/i
    );
    if (embeddedSentenceMatch) {
      currentHeading = embeddedSentenceMatch[1].trim();
      units.push({ text: embeddedSentenceMatch[2].trim(), heading: currentHeading });
      continue;
    }

    const headingOnlyMatch = trimmed.match(/^#+\s*(.+)$/);
    if (headingOnlyMatch) {
      currentHeading = headingOnlyMatch[1].trim();
      continue;
    }

    // Split paragraphs into sentences
    const sentences = trimmed.split(/(?<=[.!?])\s+(?=[A-Z0-9])/);
    for (const s of sentences) {
      const sTrim = s.trim();
      if (sTrim.length >= 8) {
        units.push({ text: sTrim, heading: currentHeading });
      }
    }
  }

  return units;
}

/**
 * Common text term extractors
 */
export const TermExtractors = {
  extractDays: (text: string): string[] => {
    const matches = text.match(/\b(\d+)\s*(?:calendar\s*)?(?:business\s*)?days?\b/gi);
    return matches ? matches.map((m) => m.replace(/\s+/g, " ").trim().toLowerCase()) : [];
  },
  extractMonthsOrYears: (text: string): string[] => {
    const matches = text.match(/\b(\d+)\s*(?:calendar\s*)?(?:months?|years?)\b/gi);
    return matches ? matches.map((m) => m.toLowerCase().trim()) : [];
  },
  extractCurrencies: (text: string): string[] => {
    const matches = text.match(/(?:₹|inr|rs\.?|\$)\s*[\d,]+(?:\.\d+)?/gi);
    return matches ? matches.map((m) => m.toLowerCase().trim()) : [];
  },
  extractRemoteDays: (text: string): string[] => {
    const matches = text.match(/\b(\d+)\s*(?:calendar\s*)?(?:business\s*)?days?\s*(?:per\s*(?:week|month))?\b/gi);
    return matches ? matches.map((m) => m.toLowerCase().trim()) : [];
  },
  extractLeaveDays: (text: string): string[] => {
    const matches = text.match(/\b(\d+)\s*(?:working\s*|business\s*|calendar\s*)?days?\b/gi);
    return matches ? matches.map((m) => m.toLowerCase().trim()) : [];
  }
};

/**
 * Common negations check
 */
export function checkNegation(text: string): boolean {
  const lower = text.toLowerCase();
  return lower.includes("shall not") || lower.includes("must not") || lower.includes("prohibited");
}
