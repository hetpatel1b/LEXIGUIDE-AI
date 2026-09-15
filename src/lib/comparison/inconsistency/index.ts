import type { NormalizedDocument } from "@/lib/document-engine/types";
import type { ComparisonInconsistency } from "@/types/comparison";
import { InternalCandidate, InconsistencyTopic } from "./types";
import { extractCandidateObligations } from "./candidate-extractor";
import { areSemanticallyEquivalent, doTermsConflict, validateEvidence } from "./conflict-evaluator";

function getTopicDisplayName(topic: InconsistencyTopic): string {
  switch (topic) {
    case "invoice_payment":
      return "Payment Deadline";
    case "final_settlement":
      return "Final Settlement Timeline";
    case "retention_award":
      return "Retention Award Terms";
    case "bonus_incentive":
      return "Incentive Compensation Timeline";
    case "termination_notice":
      return "Notice Period";
    case "cure_period_notice":
      return "Breach Cure Period";
    case "dispute_discussion_notice":
      return "Dispute Resolution Timeline";
    case "remote_work":
      return "Remote Work Allowance";
    case "leave_accrual":
      return "Annual Leave Allowance";
    case "arbitration_seat":
      return "Arbitration Seat";
    case "governing_law":
      return "Governing Law";
    case "confidentiality_duration":
      return "Confidentiality Survival Period";
    case "non_compete_duration":
      return "Non-Compete Duration";
    default:
      return "Contractual Provision";
  }
}

/**
 * Scans a single document for potentially conflicting internal provisions.
 * Strictly requires semantic subject equivalence before comparing terms.
 */
export function detectInternalInconsistencies(doc: NormalizedDocument): ComparisonInconsistency[] {
  const chunks = doc.chunks || [];
  const sections = doc.sections || [];

  const candidates: InternalCandidate[] = [];

  for (const chunk of chunks) {
    const section = sections.find((s) => s.sectionId === chunk.sectionId) || {
      sectionId: chunk.sectionId,
      sectionNumber: chunk.sectionNumber,
      title: chunk.sectionTitle || "Document Section",
      startOffset: 0,
      endOffset: 0,
      pageReferences: chunk.pageNumbers || [1],
      chunkIds: [chunk.chunkId],
      characterCount: chunk.text.length,
    };

    const extracted = extractCandidateObligations(chunk, section);
    for (const ob of extracted) {
      candidates.push({
        section,
        chunk,
        obligation: ob,
        confidence: "HIGH",
      });
    }
  }

  const rawInconsistencies: ComparisonInconsistency[] = [];
  const seenPairKeys = new Set<string>();

  for (let i = 0; i < candidates.length; i++) {
    for (let j = i + 1; j < candidates.length; j++) {
      const candA = candidates[i];
      const candB = candidates[j];

      // 1. Never compare within the exact same section and same sentence
      if (
        candA.section.sectionId === candB.section.sectionId &&
        candA.obligation.effectiveSectionTitle === candB.obligation.effectiveSectionTitle
      ) {
        continue;
      }

      // 2. Strict Semantic Equivalence Gate
      if (!areSemanticallyEquivalent(candA, candB)) continue;

      // 3. Substantive Term Conflict Check
      if (!doTermsConflict(candA, candB)) continue;

      // 4. Evidence Validation
      if (!validateEvidence(candA, candB, doc)) continue;

      // 5. Deterministic Conflict Identity & Deduplication
      // Deduplicate identical substantive conflicts even if repeated across chunks
      const normQuoteA = candA.obligation.verbatimSentence.trim().toLowerCase().slice(0, 50);
      const normQuoteB = candB.obligation.verbatimSentence.trim().toLowerCase().slice(0, 50);
      const conflictIdentity = `${candA.obligation.category}::${[normQuoteA, normQuoteB].sort().join("|||")}`;

      if (seenPairKeys.has(conflictIdentity)) continue;
      seenPairKeys.add(conflictIdentity);

      const titleTopic = getTopicDisplayName(candA.obligation.category);
      const termsA = candA.obligation.terms.join(", ");
      const termsB = candB.obligation.terms.join(", ");

      const secTitleA = candA.obligation.effectiveSectionTitle || candA.section.title;
      const secTitleB = candB.obligation.effectiveSectionTitle || candB.section.title;

      rawInconsistencies.push({
        id: `inc_${rawInconsistencies.length + 1}`,
        title: `Potential Inconsistency in ${titleTopic}`,
        inconsistencyType: "internal",
        documentId: doc.id,
        documentName: doc.displayName,
        severity: "major",
        provisionA: {
          sectionTitle: secTitleA,
          pageNumber: candA.chunk.pageNumbers?.[0] || 1,
          quote: candA.obligation.verbatimSentence,
          chunkId: candA.chunk.chunkId,
        },
        provisionB: {
          sectionTitle: secTitleB,
          pageNumber: candB.chunk.pageNumbers?.[0] || 1,
          quote: candB.obligation.verbatimSentence,
          chunkId: candB.chunk.chunkId,
        },
        explanation: `These provisions appear to specify different terms (${termsA} vs ${termsB}) for ${titleTopic.toLowerCase()} within this document.`,
        whyItMatters:
          "Potential conflict requiring review. Discrepancies between main clauses and schedules or cross-sections can cause ambiguity during contract performance or enforcement.",
        suggestedReviewQuestion: `Which provision governs ${titleTopic.toLowerCase()}: ${secTitleA} (${termsA}) or ${secTitleB} (${termsB})?`,
      });
    }
  }

  return rawInconsistencies;
}

/**
 * Detects potential inconsistencies across documents or within Document B and Document A.
 * Strictly deduplicates and re-indexes sequentially.
 */
export function detectAllInconsistencies(
  docA: NormalizedDocument,
  docB: NormalizedDocument
): ComparisonInconsistency[] {
  const incA = detectInternalInconsistencies(docA);
  const incB = detectInternalInconsistencies(docB);

  // Return unique inconsistencies (prioritizing Document B, then Document A)
  const combined = [...incB, ...incA];
  const seen = new Set<string>();
  const unique: ComparisonInconsistency[] = [];

  for (const inc of combined) {
    const key = `${inc.documentId}::${inc.provisionA.quote.slice(0, 50)}|||${inc.provisionB.quote.slice(0, 50)}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(inc);
    }
  }

  return unique.map((inc, index) => ({
    ...inc,
    id: `inc_${index + 1}`,
  }));
}
