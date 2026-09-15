import { NormalizedObligation, ClauseUnit } from "./types";
import { TermExtractors } from "./text-patterns";

export interface ExtractionRule {
  id: string;
  extract(unit: ClauseUnit, qualifiers: string[], cleanedText: string): NormalizedObligation | null;
}

export const invoicePaymentRule: ExtractionRule = {
  id: "invoice_payment",
  extract(unit, qualifiers, cleanedText) {
    const lower = unit.text.toLowerCase();
    const headingLower = unit.heading.toLowerCase();

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
      lower.includes("remit") ||
      lower.includes("settle");

    if (
      mentionsInvoice &&
      mentionsPaymentAction &&
      !lower.includes("final payment upon termination") &&
      !lower.includes("transition") &&
      !lower.includes("records")
    ) {
      const days = TermExtractors.extractDays(cleanedText);
      if (days.length > 0) {
        return {
          category: "invoice_payment",
          actor: "company",
          action: "pay",
          object: "invoice",
          trigger: "invoice_receipt",
          obligationKey: "INVOICE_PAYMENT|COMPANY|PAY|INVOICE|RECEIPT",
          terms: days,
          qualifiers,
          verbatimSentence: unit.text,
          effectiveSectionTitle: unit.heading,
        };
      }
    }
    return null;
  },
};

export const finalSettlementRule: ExtractionRule = {
  id: "final_settlement",
  extract(unit, qualifiers, cleanedText) {
    const lower = unit.text.toLowerCase();
    const headingLower = unit.heading.toLowerCase();

    const isFinalPayment =
      (lower.includes("final payment") || lower.includes("final settlement") || headingLower.includes("final payment")) &&
      (lower.includes("earned salary") || lower.includes("accrued compensation") || lower.includes("upon termination"));

    if (isFinalPayment && !lower.includes("records") && !lower.includes("transition")) {
      const days = TermExtractors.extractDays(cleanedText);
      if (days.length > 0) {
        return {
          category: "final_settlement",
          actor: "company",
          action: "pay",
          object: "final_salary",
          trigger: "termination",
          obligationKey: "FINAL_SETTLEMENT|COMPANY|PAY|FINAL_SALARY|TERMINATION",
          terms: days,
          qualifiers,
          verbatimSentence: unit.text,
          effectiveSectionTitle: unit.heading,
        };
      }
    }
    return null;
  },
};

export const retentionAwardRule: ExtractionRule = {
  id: "retention_award",
  extract(unit, qualifiers, cleanedText) {
    const lower = unit.text.toLowerCase();
    const headingLower = unit.heading.toLowerCase();

    const isRetention =
      lower.includes("retention award") || lower.includes("retention bonus") || headingLower.includes("retention");

    if (isRetention) {
      const amounts = TermExtractors.extractCurrencies(cleanedText);
      const durations = TermExtractors.extractMonthsOrYears(cleanedText);
      const terms = [...amounts, ...durations];
      if (terms.length > 0) {
        return {
          category: "retention_award",
          actor: "company",
          action: "pay",
          object: "retention_bonus",
          trigger: "standard",
          obligationKey: "RETENTION_AWARD|COMPANY|PAY|RETENTION_BONUS|STANDARD",
          terms,
          qualifiers,
          verbatimSentence: unit.text,
          effectiveSectionTitle: unit.heading,
        };
      }
    }
    return null;
  },
};

export const terminationNoticeRule: ExtractionRule = {
  id: "termination_notice",
  extract(unit, qualifiers, cleanedText) {
    const lower = unit.text.toLowerCase();
    const headingLower = unit.heading.toLowerCase();

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
      const days = TermExtractors.extractDays(cleanedText);
      const months = TermExtractors.extractMonthsOrYears(cleanedText);
      const terms = [...days, ...months];
      if (terms.length > 0) {
        const actor =
          lower.includes("executive may terminate") || lower.includes("employee may terminate")
            ? "executive"
            : lower.includes("company may terminate")
            ? "company"
            : "party";

        return {
          category: "termination_notice",
          actor,
          action: "terminate",
          object: "agreement",
          trigger: "written_notice",
          obligationKey: `TERMINATION_NOTICE|${actor.toUpperCase()}|TERMINATE|AGREEMENT|WRITTEN_NOTICE`,
          terms,
          qualifiers,
          verbatimSentence: unit.text,
          effectiveSectionTitle: unit.heading,
        };
      }
    }
    return null;
  },
};

export const curePeriodNoticeRule: ExtractionRule = {
  id: "cure_period_notice",
  extract(unit, qualifiers, cleanedText) {
    const lower = unit.text.toLowerCase();
    const isCureNotice =
      (lower.includes("cure period") ||
        lower.includes("remedy such breach") ||
        lower.includes("cure such default") ||
        lower.includes("notice of default")) &&
      (lower.includes("days") || lower.includes("period"));

    if (isCureNotice) {
      const days = TermExtractors.extractDays(cleanedText);
      if (days.length > 0) {
        return {
          category: "cure_period_notice",
          actor: "party",
          action: "cure",
          object: "breach",
          trigger: "breach_notice",
          obligationKey: "CURE_PERIOD_NOTICE|PARTY|CURE|BREACH|BREACH_NOTICE",
          terms: days,
          qualifiers,
          verbatimSentence: unit.text,
          effectiveSectionTitle: unit.heading,
        };
      }
    }
    return null;
  },
};

export const disputeDiscussionNoticeRule: ExtractionRule = {
  id: "dispute_discussion_notice",
  extract(unit, qualifiers, cleanedText) {
    const lower = unit.text.toLowerCase();
    const isDisputeDiscussion =
      (lower.includes("good-faith discussion") ||
        lower.includes("amicable resolution") ||
        lower.includes("informal negotiation") ||
        (lower.includes("before arbitration") && lower.includes("attempt to resolve"))) &&
      (lower.includes("days") || lower.includes("period"));

    if (isDisputeDiscussion) {
      const days = TermExtractors.extractDays(cleanedText);
      if (days.length > 0) {
        return {
          category: "dispute_discussion_notice",
          actor: "both",
          action: "negotiate",
          object: "dispute",
          trigger: "pre_dispute",
          obligationKey: "DISPUTE_DISCUSSION_NOTICE|BOTH|NEGOTIATE|DISPUTE|PRE_DISPUTE",
          terms: days,
          qualifiers,
          verbatimSentence: unit.text,
          effectiveSectionTitle: unit.heading,
        };
      }
    }
    return null;
  },
};

export const remoteWorkRule: ExtractionRule = {
  id: "remote_work",
  extract(unit, qualifiers, cleanedText) {
    const lower = unit.text.toLowerCase();
    const headingLower = unit.heading.toLowerCase();

    const isRemoteWork =
      lower.includes("remote work") ||
      lower.includes("work remotely") ||
      lower.includes("telecommuting") ||
      headingLower.includes("remote work");

    if (isRemoteWork) {
      const terms = TermExtractors.extractRemoteDays(unit.text); // Note: original code used unitText, not cleanedText here for some reason.
      if (terms.length > 0) {
        return {
          category: "remote_work",
          actor: "executive",
          action: "work_remotely",
          object: "remote_days",
          trigger: "standard",
          obligationKey: "REMOTE_WORK|EXECUTIVE|WORK_REMOTELY|REMOTE_DAYS|STANDARD",
          terms,
          qualifiers,
          verbatimSentence: unit.text,
          effectiveSectionTitle: unit.heading,
        };
      }
    }
    return null;
  },
};

export const leaveAccrualRule: ExtractionRule = {
  id: "leave_accrual",
  extract(unit, qualifiers, cleanedText) {
    const lower = unit.text.toLowerCase();
    const headingLower = unit.heading.toLowerCase();

    const isLeave =
      (lower.includes("annual leave") || lower.includes("paid leave") || lower.includes("vacation days")) &&
      (headingLower.includes("leave") || headingLower.includes("benefit") || lower.includes("working days"));

    if (isLeave) {
      const terms = TermExtractors.extractLeaveDays(unit.text);
      if (terms.length > 0) {
        return {
          category: "leave_accrual",
          actor: "executive",
          action: "accrue_leave",
          object: "annual_leave",
          trigger: "standard",
          obligationKey: "LEAVE_ACCRUAL|EXECUTIVE|ACCRUE_LEAVE|ANNUAL_LEAVE|STANDARD",
          terms,
          qualifiers,
          verbatimSentence: unit.text,
          effectiveSectionTitle: unit.heading,
        };
      }
    }
    return null;
  },
};

export const arbitrationSeatRule: ExtractionRule = {
  id: "arbitration_seat",
  extract(unit, qualifiers, cleanedText) {
    const lower = unit.text.toLowerCase();
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
        return {
          category: "arbitration_seat",
          actor: "both",
          action: "arbitrate",
          object: "arbitration_proceedings",
          trigger: "standard",
          obligationKey: "ARBITRATION_SEAT|BOTH|ARBITRATE|ARBITRATION_PROCEEDINGS|STANDARD",
          terms: matched,
          qualifiers,
          verbatimSentence: unit.text,
          effectiveSectionTitle: unit.heading,
        };
      }
    }
    return null;
  },
};

export const confidentialityDurationRule: ExtractionRule = {
  id: "confidentiality_duration",
  extract(unit, qualifiers, cleanedText) {
    const lower = unit.text.toLowerCase();
    const isConfidentiality =
      (lower.includes("confidentiality") || lower.includes("non-disclosure")) &&
      (lower.includes("survive") || lower.includes("survival") || lower.includes("duration"));

    if (isConfidentiality) {
      const durations = TermExtractors.extractMonthsOrYears(cleanedText);
      if (durations.length > 0) {
        return {
          category: "confidentiality_duration",
          actor: "both",
          action: "maintain_confidentiality",
          object: "confidential_info",
          trigger: "termination",
          obligationKey: "CONFIDENTIALITY_DURATION|BOTH|MAINTAIN_CONFIDENTIALITY|CONFIDENTIAL_INFO|TERMINATION",
          terms: durations,
          qualifiers,
          verbatimSentence: unit.text,
          effectiveSectionTitle: unit.heading,
        };
      }
    }
    return null;
  },
};

export const ALL_RULES: ExtractionRule[] = [
  invoicePaymentRule,
  finalSettlementRule,
  retentionAwardRule,
  terminationNoticeRule,
  curePeriodNoticeRule,
  disputeDiscussionNoticeRule,
  remoteWorkRule,
  leaveAccrualRule,
  arbitrationSeatRule,
  confidentialityDurationRule,
];
