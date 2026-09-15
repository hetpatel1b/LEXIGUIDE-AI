import type { DifferenceType, ChangeSeverity } from "@/types/comparison";

/**
 * Normalizes text for deterministic diffing while strictly protecting
 * legally critical tokens (numbers, currency, dates, qualifiers, negations).
 */
export function normalizeTextForDiff(text: string): string {
  if (!text) return "";

  return (
    text
      // Normalize line breaks
      .replace(/\r\n/g, "\n")
      // Normalize typographical quotes and dashes
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, "'")
      .replace(/[–—]/g, "-")
      // Collapse whitespace
      .replace(/\s+/g, " ")
      .trim()
  );
}

/**
 * Checks whether two texts are substantively identical after safe normalization.
 */
export function isSubstantivelyIdentical(textA: string, textB: string): boolean {
  const normA = normalizeTextForDiff(textA).toLowerCase();
  const normB = normalizeTextForDiff(textB).toLowerCase();

  return normA === normB;
}

/**
 * Checks if a change between two texts is a substantive contractual modification,
 * filtering out metadata, whitespace, pagination, or generic rewording.
 */
export function isSubstantiveChange(textA: string, textB: string): boolean {
  if (isSubstantivelyIdentical(textA, textB)) return false;

  const numsA = extractNumericTokens(textA);
  const numsB = extractNumericTokens(textB);
  const hasNumericDiff = numsA.some(n => !numsB.includes(n)) || numsB.some(n => !numsA.includes(n));
  if (hasNumericDiff) return true;

  if (detectNegationShift(textA, textB)) return true;

  const qualifiers = ["subject to", "provided that", "except", "unless", "notwithstanding", "solely"];
  const tA = textA.toLowerCase();
  const tB = textB.toLowerCase();
  const qualShift = qualifiers.some(q => tA.includes(q) !== tB.includes(q));
  if (qualShift) return true;

  return false;
}

/**
 * Extracts key numbers, currencies, dates, and time periods from text.
 */
export function extractNumericTokens(text: string): string[] {
  const matches: string[] = [];
  // Currencies and amounts (e.g. ₹2,400,000, INR 2,400,000, $50,000, Rs. 1000)
  const money = text.match(/(?:[₹$€£]|rs\.?|inr)\s*[\d,]+(?:\.\d+)?/gi) || [];
  matches.push(...money);

  // Formatted numbers with commas (e.g. 2,400,000 or 24,00,000)
  const commaNumbers = text.match(/\b\d{1,3}(?:,\d{2,3})+(?:\.\d+)?\b/g) || [];
  matches.push(...commaNumbers);

  // Time periods (e.g. 30 days, 90 days, 12 months, 2 years)
  const periods = text.match(/\b\d+\s*(?:calendar\s*)?(?:business\s*)?(?:days?|weeks?|months?|years?|hours?)\b/gi) || [];
  matches.push(...periods);

  // Percentages (e.g. 10%, 25.5%)
  const percentages = text.match(/\b\d+(?:\.\d+)?\s*%/g) || [];
  matches.push(...percentages);

  // Years and specific dates (e.g. 2026, 2027)
  const years = text.match(/\b20\d\d\b/g) || [];
  matches.push(...years);

  return Array.from(new Set(matches.map((m) => m.toLowerCase().trim())));
}

/**
 * Checks for negation differences between text A and text B.
 */
export function detectNegationShift(textA: string, textB: string): boolean {
  const tA = textA.toLowerCase();
  const tB = textB.toLowerCase();

  const negationPatterns = [
    { a: /\bshall not\b/, b: /\bshall\b/ },
    { a: /\bmay not\b/, b: /\bmay\b/ },
    { a: /\bmust not\b/, b: /\bmust\b/ },
    { a: /\bwithout\b/, b: /\bwith\b/ },
    { a: /\bprohibited\b/, b: /\bpermitted\b/ },
    { a: /\bunlawful\b/, b: /\blawful\b/ },
    { a: /\bnot\b/, b: "" },
  ];

  for (const pat of negationPatterns) {
    const hasInA = pat.a.test(tA);
    const hasInB = pat.a.test(tB);
    if (hasInA !== hasInB) {
      return true;
    }
  }

  return false;
}

/**
 * Determines change severity based on category, legal keywords, numeric shifts, and negations.
 */
export function determineChangeSeverity(
  category: string,
  textA: string,
  textB: string,
  status: DifferenceType
): ChangeSeverity {
  if (status === "unchanged") return "minor";

  const cat = category.toLowerCase();
  const isHighStakesCategory =
    cat.includes("termination") ||
    cat.includes("compensat") ||
    cat.includes("salary") ||
    cat.includes("liabilit") ||
    cat.includes("indemnif") ||
    cat.includes("intellectual") ||
    cat.includes("non-compete") ||
    cat.includes("non-solicit") ||
    cat.includes("arbitrat") ||
    cat.includes("governing");

  // New section added or removed in high-stakes category is major
  if ((status === "added" || status === "removed") && isHighStakesCategory) {
    return "major";
  }
  if (status === "added" || status === "removed") {
    return "moderate";
  }

  // Check for numeric differences (salary, notice days, percentages)
  const numsA = extractNumericTokens(textA);
  const numsB = extractNumericTokens(textB);
  const hasNumericDiff =
    numsA.some((n) => !numsB.includes(n)) || numsB.some((n) => !numsA.includes(n));

  if (hasNumericDiff && (isHighStakesCategory || numsA.length > 0 || numsB.length > 0)) {
    return "major";
  }

  // Check for negation shift (shall vs shall not, permitted vs prohibited)
  if (detectNegationShift(textA, textB)) {
    return "major";
  }

  // Check for legal qualifiers change ("subject to", "provided that", "except", "unless")
  const qualifiers = ["subject to", "provided that", "except", "unless", "notwithstanding", "solely"];
  const tA = textA.toLowerCase();
  const tB = textB.toLowerCase();
  const qualShift = qualifiers.some((q) => tA.includes(q) !== tB.includes(q));

  if (qualShift && isHighStakesCategory) {
    return "major";
  }

  if (isHighStakesCategory) {
    return "moderate";
  }

  // Substantial text length divergence
  const lengthDelta = Math.abs(textA.length - textB.length);
  if (lengthDelta > 150) {
    return "moderate";
  }

  return "minor";
}

/**
 * Extracts word or phrase diff highlights between textA and textB.
 * Highlights the most salient changing words/phrases (e.g. "30 days" -> "90 days").
 */
export function extractDiffHighlights(
  textA: string,
  textB: string
): { highlightA?: string; highlightB?: string } {
  const numsA = extractNumericTokens(textA);
  const numsB = extractNumericTokens(textB);

  const changedA = numsA.filter((n) => !numsB.includes(n));
  const changedB = numsB.filter((n) => !numsA.includes(n));

  if (changedA.length > 0 && changedB.length > 0) {
    return {
      highlightA: changedA[0],
      highlightB: changedB[0],
    };
  }

  // Fallback: compare words
  const wordsA = textA.split(/\s+/).filter(Boolean);
  const wordsB = textB.split(/\s+/).filter(Boolean);

  if (wordsA.length === 0 && wordsB.length > 0) {
    return { highlightA: "Missing section content", highlightB: wordsB.slice(0, 5).join(" ") };
  }
  if (wordsB.length === 0 && wordsA.length > 0) {
    return { highlightA: wordsA.slice(0, 5).join(" "), highlightB: "Missing section content" };
  }

  for (let i = 0; i < Math.min(wordsA.length, wordsB.length); i++) {
    if (wordsA[i].toLowerCase() !== wordsB[i].toLowerCase()) {
      return { highlightA: wordsA.slice(i, i + 5).join(" "), highlightB: wordsB.slice(i, i + 5).join(" ") };
    }
  }

  // If one is a prefix of the other, the diff is the extra words
  if (wordsA.length > wordsB.length) {
    return { highlightA: wordsA.slice(wordsB.length, wordsB.length + 5).join(" "), highlightB: "Missing text" };
  }
  if (wordsB.length > wordsA.length) {
    return { highlightA: "Missing text", highlightB: wordsB.slice(wordsA.length, wordsA.length + 5).join(" ") };
  }

  return { highlightA: undefined, highlightB: undefined };
}
