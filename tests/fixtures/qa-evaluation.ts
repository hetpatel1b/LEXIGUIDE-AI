/**
 * Grounded Q&A Evaluation Dataset for LexiGuide AI.
 * Benchmarked against LexiGuide_AI_Comprehensive_Legal_Test_Contract.pdf.
 */

export interface QaEvaluationCase {
  id: string;
  category: "fact" | "clause" | "negative" | "synthesis" | "section-specific" | "paraphrase";
  question: string;
  expectedTerms: string[];
  expectedSectionKeywords: string[];
  isNegative?: boolean;
  expectedAnswerSubstring?: string;
}

export const QA_EVALUATION_DATASET: QaEvaluationCase[] = [
  {
    id: "eval-01-base-salary",
    category: "fact",
    question: "What is the employee's base salary?",
    expectedTerms: ["2,400,000", "salary", "per annum"],
    expectedSectionKeywords: ["compensation", "salary", "remuneration"],
    expectedAnswerSubstring: "2,400,000",
  },
  {
    id: "eval-02-effective-date",
    category: "fact",
    question: "What is the effective date of this agreement?",
    expectedTerms: ["1 october 2026", "october 1, 2026", "effective date"],
    expectedSectionKeywords: ["term", "commencement", "appointment"],
    expectedAnswerSubstring: "1 October 2026",
  },
  {
    id: "eval-03-arbitration-seat",
    category: "fact",
    question: "What is the arbitration seat?",
    expectedTerms: ["mumbai", "arbitration", "seat"],
    expectedSectionKeywords: ["dispute", "arbitration", "resolution"],
    expectedAnswerSubstring: "Mumbai",
  },
  {
    id: "eval-04-governing-law",
    category: "fact",
    question: "What law governs this agreement?",
    expectedTerms: ["india", "laws of india", "governing law"],
    expectedSectionKeywords: ["governing law", "dispute", "jurisdiction"],
    expectedAnswerSubstring: "India",
  },
  {
    id: "eval-05-security-incident",
    category: "fact",
    question: "When must a security incident be reported?",
    expectedTerms: ["24 hours", "twenty-four", "security incident"],
    expectedSectionKeywords: ["security", "confidentiality", "data"],
    expectedAnswerSubstring: "24",
  },
  {
    id: "eval-06-conflicts-disclosure",
    category: "fact",
    question: "When must conflicts of interest be disclosed?",
    expectedTerms: ["5 business days", "five business days", "conflict"],
    expectedSectionKeywords: ["conflict", "interest", "disclosure"],
    expectedAnswerSubstring: "5 business days",
  },
  {
    id: "eval-07-retention-award",
    category: "fact",
    question: "What is the retention award amount?",
    expectedTerms: ["600,000", "retention award", "schedule b"],
    expectedSectionKeywords: ["retention", "award", "schedule"],
    expectedAnswerSubstring: "600,000",
  },
  {
    id: "eval-08-notice-period",
    category: "fact",
    question: "What is the notice period for termination?",
    expectedTerms: ["30 days", "thirty (30) days", "notice period"],
    expectedSectionKeywords: ["termination", "notice"],
    expectedAnswerSubstring: "30",
  },
  {
    id: "eval-09-non-compete-duration",
    category: "clause",
    question: "Does the contract contain a non-compete restriction and how long is it?",
    expectedTerms: ["12 months", "twelve (12) months", "non-compete", "competitive restriction"],
    expectedSectionKeywords: ["restrictive", "covenant", "non-compete"],
    expectedAnswerSubstring: "12 months",
  },
  {
    id: "eval-10-ip-ownership",
    category: "clause",
    question: "Who owns intellectual property created during employment?",
    expectedTerms: ["company", "exclusive property", "intellectual property", "inventions"],
    expectedSectionKeywords: ["intellectual property", "inventions", "ownership"],
    expectedAnswerSubstring: "Company",
  },
  {
    id: "eval-11-parties",
    category: "fact",
    question: "Who are the parties to this agreement?",
    expectedTerms: ["arjun mehta", "northstar analytics"],
    expectedSectionKeywords: ["parties", "recitals", "appointment"],
    expectedAnswerSubstring: "Arjun Mehta",
  },
  {
    id: "eval-12-target-incentive",
    category: "fact",
    question: "What is the target performance incentive percentage?",
    expectedTerms: ["15%", "15 percent", "performance incentive"],
    expectedSectionKeywords: ["compensation", "incentive", "bonus"],
    expectedAnswerSubstring: "15%",
  },
  {
    id: "eval-13-synthesis-early-termination",
    category: "synthesis",
    question: "What happens to the retention award if employment ends before the relevant retention period?",
    expectedTerms: ["retention award", "forfeited", "termination", "retention period"],
    expectedSectionKeywords: ["retention", "termination"],
  },
  {
    id: "eval-14-section-8-specific",
    category: "section-specific",
    question: "What does Section 8 say about termination?",
    expectedTerms: ["section 8", "termination", "30 days", "cause"],
    expectedSectionKeywords: ["termination", "section 8"],
  },
  {
    id: "eval-15-paraphrase-notice-1",
    category: "paraphrase",
    question: "What notice do I need to give?",
    expectedTerms: ["30 days", "notice", "termination"],
    expectedSectionKeywords: ["termination", "notice"],
    expectedAnswerSubstring: "30",
  },
  {
    id: "eval-16-paraphrase-notice-2",
    category: "paraphrase",
    question: "How many days' notice must the employee provide to resign?",
    expectedTerms: ["30 days", "notice", "termination", "resignation"],
    expectedSectionKeywords: ["termination", "notice"],
    expectedAnswerSubstring: "30",
  },
  // Negative Queries (Known to be absent in the contract)
  {
    id: "eval-17-negative-signing-bonus",
    category: "negative",
    question: "Does this agreement provide a signing bonus of INR 1,000,000?",
    expectedTerms: ["signing bonus of inr 1,000,000"],
    expectedSectionKeywords: [],
    isNegative: true,
  },
  {
    id: "eval-18-negative-company-car",
    category: "negative",
    question: "Does the contract provide a company car or vehicle allowance?",
    expectedTerms: ["company car", "vehicle allowance"],
    expectedSectionKeywords: [],
    isNegative: true,
  },
  {
    id: "eval-19-negative-30-percent-bonus",
    category: "negative",
    question: "Does the agreement guarantee a 30% annual bonus?",
    expectedTerms: ["30% annual bonus"],
    expectedSectionKeywords: [],
    isNegative: true,
  },
];
