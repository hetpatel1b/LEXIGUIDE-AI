import type { NormalizedDocument, DocumentChunk, DocumentSection } from "@/lib/document-engine/types";
import type { ComparisonInconsistency } from "@/types/comparison";

export type InconsistencyTopic =
  | "invoice_payment"
  | "final_settlement"
  | "retention_award"
  | "bonus_incentive"
  | "termination_notice"
  | "cure_period_notice"
  | "dispute_discussion_notice"
  | "remote_work"
  | "leave_accrual"
  | "arbitration_seat"
  | "governing_law"
  | "confidentiality_duration"
  | "non_compete_duration";

export interface NormalizedObligation {
  category: InconsistencyTopic;
  actor: "company" | "executive" | "employee" | "party" | "both" | "vendor";
  action:
    | "pay"
    | "terminate"
    | "cure"
    | "negotiate"
    | "work_remotely"
    | "accrue_leave"
    | "arbitrate"
    | "maintain_confidentiality"
    | "restrict_competition";
  object:
    | "invoice"
    | "final_salary"
    | "retention_bonus"
    | "annual_bonus"
    | "agreement"
    | "breach"
    | "dispute"
    | "remote_days"
    | "annual_leave"
    | "arbitration_proceedings"
    | "confidential_info"
    | "competing_business";
  trigger:
    | "invoice_receipt"
    | "termination"
    | "written_notice"
    | "breach_notice"
    | "pre_dispute"
    | "standard";
  obligationKey: string;
  terms: string[];
  qualifiers: string[];
  isNegation?: boolean;
  verbatimSentence: string;
  effectiveSectionTitle: string;
}

export interface InternalCandidate {
  section: DocumentSection;
  chunk: DocumentChunk;
  obligation: NormalizedObligation;
  confidence: "HIGH" | "MEDIUM" | "LOW";
}

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
function extractQualifiers(text: string): string[] {
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

interface ClauseUnit {
  text: string;
  heading: string;
}

/**
 * Splits a chunk into distinct clause units / sentences, tracking embedded headings.
 */
function parseClauseUnits(chunkText: string, defaultHeading: string): ClauseUnit[] {
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
 * Analyzes a document chunk and extracts normalized contractual obligations.
 * Returns empty array if the chunk does not describe an operative obligation subject to conflict detection.
 */
export function extractCandidateObligations(
  chunk: DocumentChunk,
  section: DocumentSection
): NormalizedObligation[] {
  const sectionTitle = section.title || chunk.sectionTitle || "Document Section";

  // If inside a non-operative section (e.g. Recitals), do not extract operative obligations
  if (isNonOperativeSection(sectionTitle)) {
    return [];
  }

  const clauseUnits = parseClauseUnits(chunk.text, sectionTitle);
  const obligations: NormalizedObligation[] = [];

  for (const unit of clauseUnits) {
    const unitText = unit.text;
    const lower = unitText.toLowerCase();
    const headingLower = unit.heading.toLowerCase();

    // Skip clause unit if its local heading is non-operative
    if (isNonOperativeSection(unit.heading)) {
      continue;
    }

    const qualifiers = extractQualifiers(unitText);

    const cleanedText = unitText.replace(/\(\s*(\d+)\s*\)/g, " $1 ");

    // Helpers
    const extractDays = (): string[] => {
      const matches = cleanedText.match(/\b(\d+)\s*(?:calendar\s*)?(?:business\s*)?days?\b/gi);
      return matches ? matches.map((m) => m.replace(/\s+/g, " ").trim().toLowerCase()) : [];
    };

    const extractMonthsOrYears = (): string[] => {
      const matches = cleanedText.match(/\b(\d+)\s*(?:calendar\s*)?(?:months?|years?)\b/gi);
      return matches ? matches.map((m) => m.toLowerCase().trim()) : [];
    };

    const extractCurrencies = (): string[] => {
      const matches = cleanedText.match(/(?:₹|inr|rs\.?|\$)\s*[\d,]+(?:\.\d+)?/gi);
      return matches ? matches.map((m) => m.toLowerCase().trim()) : [];
    };

    // 1. INVOICE PAYMENT DEADLINES
    // Must specifically describe payment of invoices / fees
    const mentionsInvoice =
      lower.includes("invoice") ||
      lower.includes("invoicing") ||
      headingLower.includes("invoic") ||
      headingLower.includes("disbursement");

    const mentionsPaymentAction =
      lower.includes("pay") ||
      lower.includes("paid") ||
      lower.includes("payable") ||
      lower.includes("disburs") ||
      lower.includes("remit");

    if (
      mentionsInvoice &&
      mentionsPaymentAction &&
      !lower.includes("final payment upon termination") &&
      !lower.includes("transition") &&
      !lower.includes("records")
    ) {
      const days = extractDays();
      if (days.length > 0) {
        obligations.push({
          category: "invoice_payment",
          actor: "company",
          action: "pay",
          object: "invoice",
          trigger: "invoice_receipt",
          obligationKey: "INVOICE_PAYMENT|COMPANY|PAY|INVOICE|RECEIPT",
          terms: days,
          qualifiers,
          verbatimSentence: unitText,
          effectiveSectionTitle: unit.heading,
        });
      }
    }

    // 2. FINAL SETTLEMENT / POST-TERMINATION SALARY PAYOUT
    const isFinalPayment =
      (lower.includes("final payment") || lower.includes("final settlement") || headingLower.includes("final payment")) &&
      (lower.includes("earned salary") || lower.includes("accrued compensation") || lower.includes("upon termination"));

    if (isFinalPayment && !lower.includes("records") && !lower.includes("transition")) {
      const days = extractDays();
      if (days.length > 0) {
        obligations.push({
          category: "final_settlement",
          actor: "company",
          action: "pay",
          object: "final_salary",
          trigger: "termination",
          obligationKey: "FINAL_SETTLEMENT|COMPANY|PAY|FINAL_SALARY|TERMINATION",
          terms: days,
          qualifiers,
          verbatimSentence: unitText,
          effectiveSectionTitle: unit.heading,
        });
      }
    }

    // 3. RETENTION AWARD / SPECIAL COMMERCIAL TERMS
    const isRetention =
      lower.includes("retention award") || lower.includes("retention bonus") || headingLower.includes("retention");

    if (isRetention) {
      const amounts = extractCurrencies();
      const durations = extractMonthsOrYears();
      const terms = [...amounts, ...durations];
      if (terms.length > 0) {
        obligations.push({
          category: "retention_award",
          actor: "company",
          action: "pay",
          object: "retention_bonus",
          trigger: "standard",
          obligationKey: "RETENTION_AWARD|COMPANY|PAY|RETENTION_BONUS|STANDARD",
          terms,
          qualifiers,
          verbatimSentence: unitText,
          effectiveSectionTitle: unit.heading,
        });
      }
    }

    // 4. TERMINATION NOTICE PERIOD (WITHOUT CAUSE / CONVENIENCE)
    // Must be a notice requirement to terminate the contract/employment
    const isTerminationNotice =
      (lower.includes("notice of termination") ||
        lower.includes("terminate employment by giving") ||
        lower.includes("terminate by giving") ||
        lower.includes("terminate employment without cause by giving") ||
        (lower.includes("terminate") && lower.includes("written notice") && !lower.includes("cure"))) &&
      !lower.includes("transition") &&
      !lower.includes("knowledge transfer") &&
      !lower.includes("good-faith") &&
      !headingLower.includes("transition");

    if (isTerminationNotice) {
      const days = extractDays();
      const months = extractMonthsOrYears();
      const terms = [...days, ...months];
      if (terms.length > 0) {
        const actor =
          lower.includes("executive may terminate") || lower.includes("employee may terminate")
            ? "executive"
            : lower.includes("company may terminate")
            ? "company"
            : "party";

        obligations.push({
          category: "termination_notice",
          actor,
          action: "terminate",
          object: "agreement",
          trigger: "written_notice",
          obligationKey: `TERMINATION_NOTICE|${actor.toUpperCase()}|TERMINATE|AGREEMENT|WRITTEN_NOTICE`,
          terms,
          qualifiers,
          verbatimSentence: unitText,
          effectiveSectionTitle: unit.heading,
        });
      }
    }

    // 5. CURE PERIOD NOTICE (DEFAULT / BREACH REMEDY)
    const isCureNotice =
      (lower.includes("cure period") ||
        lower.includes("remedy such breach") ||
        lower.includes("cure such default") ||
        lower.includes("notice of default")) &&
      (lower.includes("days") || lower.includes("period"));

    if (isCureNotice) {
      const days = extractDays();
      if (days.length > 0) {
        obligations.push({
          category: "cure_period_notice",
          actor: "party",
          action: "cure",
          object: "breach",
          trigger: "breach_notice",
          obligationKey: "CURE_PERIOD_NOTICE|PARTY|CURE|BREACH|BREACH_NOTICE",
          terms: days,
          qualifiers,
          verbatimSentence: unitText,
          effectiveSectionTitle: unit.heading,
        });
      }
    }

    // 6. DISPUTE RESOLUTION / GOOD-FAITH DISCUSSION WINDOW
    const isDisputeDiscussion =
      (lower.includes("good-faith discussion") ||
        lower.includes("amicable resolution") ||
        lower.includes("informal negotiation") ||
        (lower.includes("before arbitration") && lower.includes("attempt to resolve"))) &&
      (lower.includes("days") || lower.includes("period"));

    if (isDisputeDiscussion) {
      const days = extractDays();
      if (days.length > 0) {
        obligations.push({
          category: "dispute_discussion_notice",
          actor: "both",
          action: "negotiate",
          object: "dispute",
          trigger: "pre_dispute",
          obligationKey: "DISPUTE_DISCUSSION_NOTICE|BOTH|NEGOTIATE|DISPUTE|PRE_DISPUTE",
          terms: days,
          qualifiers,
          verbatimSentence: unitText,
          effectiveSectionTitle: unit.heading,
        });
      }
    }

    // 7. REMOTE WORK ALLOWANCE
    // Requires explicit remote work clause with days per week/month
    const isRemoteWork =
      lower.includes("remote work") ||
      lower.includes("work remotely") ||
      lower.includes("telecommuting") ||
      headingLower.includes("remote work");

    if (isRemoteWork) {
      const daysMatches = unitText.match(/\b(\d+)\s*(?:calendar\s*)?(?:business\s*)?days?\s*(?:per\s*(?:week|month))?\b/gi);
      if (daysMatches && daysMatches.length > 0) {
        obligations.push({
          category: "remote_work",
          actor: "executive",
          action: "work_remotely",
          object: "remote_days",
          trigger: "standard",
          obligationKey: "REMOTE_WORK|EXECUTIVE|WORK_REMOTELY|REMOTE_DAYS|STANDARD",
          terms: daysMatches.map((m) => m.toLowerCase().trim()),
          qualifiers,
          verbatimSentence: unitText,
          effectiveSectionTitle: unit.heading,
        });
      }
    }

    // 8. LEAVE ACCRUAL (ANNUAL LEAVE / VACATION)
    const isLeave =
      (lower.includes("annual leave") || lower.includes("paid leave") || lower.includes("vacation days")) &&
      (headingLower.includes("leave") || headingLower.includes("benefit") || lower.includes("working days"));

    if (isLeave) {
      const daysMatches = unitText.match(/\b(\d+)\s*(?:working\s*|business\s*|calendar\s*)?days?\b/gi);
      if (daysMatches && daysMatches.length > 0) {
        obligations.push({
          category: "leave_accrual",
          actor: "executive",
          action: "accrue_leave",
          object: "annual_leave",
          trigger: "standard",
          obligationKey: "LEAVE_ACCRUAL|EXECUTIVE|ACCRUE_LEAVE|ANNUAL_LEAVE|STANDARD",
          terms: daysMatches.map((m) => m.toLowerCase().trim()),
          qualifiers,
          verbatimSentence: unitText,
          effectiveSectionTitle: unit.heading,
        });
      }
    }

    // 9. ARBITRATION SEAT
    const isArbitration =
      lower.includes("arbitration") &&
      (lower.includes("seat") || lower.includes("venue") || lower.includes("place of arbitration"));

    if (isArbitration) {
      const seats = [
        "mumbai",
        "delhi",
        "bengaluru",
        "bangalore",
        "london",
        "singapore",
        "new york",
        "paris",
        "chennai",
        "hyderabad",
        "dubai",
      ];
      const matched = seats.filter((s) => lower.includes(s));
      if (matched.length > 0) {
        obligations.push({
          category: "arbitration_seat",
          actor: "both",
          action: "arbitrate",
          object: "arbitration_proceedings",
          trigger: "standard",
          obligationKey: "ARBITRATION_SEAT|BOTH|ARBITRATE|ARBITRATION_PROCEEDINGS|STANDARD",
          terms: matched,
          qualifiers,
          verbatimSentence: unitText,
          effectiveSectionTitle: unit.heading,
        });
      }
    }

    // 10. CONFIDENTIALITY SURVIVAL DURATION
    const isConfidentiality =
      (lower.includes("confidentiality") || lower.includes("non-disclosure")) &&
      (lower.includes("survive") || lower.includes("survival") || lower.includes("duration"));

    if (isConfidentiality) {
      const durations = extractMonthsOrYears();
      if (durations.length > 0) {
        obligations.push({
          category: "confidentiality_duration",
          actor: "both",
          action: "maintain_confidentiality",
          object: "confidential_info",
          trigger: "termination",
          obligationKey: "CONFIDENTIALITY_DURATION|BOTH|MAINTAIN_CONFIDENTIALITY|CONFIDENTIAL_INFO|TERMINATION",
          terms: durations,
          qualifiers,
          verbatimSentence: unitText,
          effectiveSectionTitle: unit.heading,
        });
      }
    }

    // 11. NEGATION CHECK (shall vs shall not)
    if (lower.includes("shall not") || lower.includes("must not") || lower.includes("prohibited")) {
      for (const ob of obligations) {
        ob.isNegation = true;
      }
    }
  }

  return obligations;
}

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
function validateEvidence(
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
