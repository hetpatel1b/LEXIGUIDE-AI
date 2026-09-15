import type { NormalizedDocument } from "@/lib/document-engine/types";
import { InternalCandidate } from "./types";
import { isNonOperativeSection } from "./text-patterns";

/**
 * Checks whether candidate provisions share identical or compatible semantic subjects.
 * Strictly gates conflict comparison.
 */
export function areSemanticallyEquivalent(
  candA: InternalCandidate,
  candB: InternalCandidate
): boolean {
  const obA = candA.obligation;
  const obB = candB.obligation;

  // 1. Mandatory category match
  if (obA.category !== obB.category) {
    return false;
  }

  // 2. Section type check: non-operative sections never match operative sections
  if (isNonOperativeSection(obA.effectiveSectionTitle) || isNonOperativeSection(obB.effectiveSectionTitle)) {
    return false;
  }

  // 3. Obligation key compatibility
  if (obA.category === "termination_notice") {
    if (obA.actor !== obB.actor && obA.actor !== "party" && obB.actor !== "party") {
      // Company termination notice (e.g. 90 days) does NOT conflict with Executive termination notice (e.g. 30 days)
      return false;
    }
  } else {
    if (obA.obligationKey !== obB.obligationKey) {
      return false;
    }
  }

  // 4. Qualifier / Carve-Out Check
  const allQualifiers = [...obA.qualifiers, ...obB.qualifiers];
  const textA = candA.chunk.text.toLowerCase();
  const textB = candB.chunk.text.toLowerCase();

  const hasExplicitCarveOut =
    allQualifiers.some((q) =>
      q.includes("except as") ||
      q.includes("subject to") ||
      q.includes("notwithstanding") ||
      q.includes("unless otherwise")
    ) ||
    textA.includes("except as provided in schedule") ||
    textB.includes("except as provided in schedule") ||
    textA.includes("notwithstanding standard") ||
    textB.includes("notwithstanding standard") ||
    textA.includes("expedited service") ||
    textB.includes("expedited service") ||
    textA.includes("milestone invoice") ||
    textB.includes("milestone invoice");

  if (hasExplicitCarveOut) {
    return false;
  }

  return true;
}

/**
 * Checks whether substantive terms of two semantically equivalent provisions genuinely conflict.
 */
export function doTermsConflict(candA: InternalCandidate, candB: InternalCandidate): boolean {
  const termsA = candA.obligation.terms;
  const termsB = candB.obligation.terms;

  if (candA.obligation.isNegation !== candB.obligation.isNegation) {
    return true;
  }

  if (termsA.length === 0 || termsB.length === 0) {
    return false;
  }

  // Check if there is zero intersection between normalized substantive terms
  const hasOverlap = termsA.some((tA) => termsB.includes(tA));
  return !hasOverlap;
}

/**
 * Validates that candidate evidence exists verifiably in the NormalizedDocument.
 */
export function validateEvidence(
  candA: InternalCandidate,
  candB: InternalCandidate,
  doc: NormalizedDocument
): boolean {
  const chunks = doc.chunks || [];
  const chunkA = chunks.find((c) => c.chunkId === candA.chunk.chunkId);
  const chunkB = chunks.find((c) => c.chunkId === candB.chunk.chunkId);

  if (!chunkA || !chunkB) return false;

  const quoteA = candA.obligation.verbatimSentence.slice(0, 80);
  const quoteB = candB.obligation.verbatimSentence.slice(0, 80);

  if (!chunkA.text.includes(quoteA) || !chunkB.text.includes(quoteB)) {
    return false;
  }

  return true;
}
