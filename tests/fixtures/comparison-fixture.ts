import type {
  ComparisonDocument,
  ComparisonChange,
  ComparisonSummaryMetrics,
} from "@/types";

export const COMPARISON_DOC_A: ComparisonDocument = {
  id: "doc-a-original",
  name: "Employment_Agreement_2026.pdf",
  type: "PDF",
  pageCount: 18,
  sizeBytes: 2457600,
  versionLabel: "Original Version",
  isPrimary: true,
};

export const COMPARISON_DOC_B: ComparisonDocument = {
  id: "doc-b-updated",
  name: "Employment_Agreement_2026_Updated.pdf",
  type: "PDF",
  pageCount: 20,
  sizeBytes: 2621440,
  versionLabel: "Updated Amendment",
};

export const COMPARISON_METRICS: ComparisonSummaryMetrics = {
  sectionsCompared: 18,
  changesIdentified: 7,
  majorChanges: 3,
  moderateChanges: 2,
  minorChanges: 2,
  unchangedCount: 4,
};

export const COMPARISON_CHANGES: ComparisonChange[] = [
  {
    id: "change-1",
    clauseTitle: "Termination Notice Period",
    category: "Obligations",
    changeSeverity: "major",
    sectionA: "Section 7.2",
    sectionB: "Section 7.2",
    pageA: 9,
    pageB: 10,
    docAContent:
      "Either party may terminate this agreement by providing thirty (30) days' prior written notice.",
    docBContent:
      "Either party may terminate this agreement by providing sixty (60) days' prior written notice.",
    summaryChange: "Notice period increased from 30 days → 60 days.",
    whyItMatters:
      "The notice period is doubled in the updated version, which materially extends the time and commitments required to end the employment relationship for both parties.",
    diffHighlightA: "thirty (30) days'",
    diffHighlightB: "sixty (60) days'",
  },
  {
    id: "change-2",
    clauseTitle: "Monthly Base Compensation & Bonus",
    category: "Financial",
    changeSeverity: "major",
    sectionA: "Section 3.1",
    sectionB: "Section 3.1",
    pageA: 4,
    pageB: 4,
    docAContent:
      "The Company shall disburse a fixed monthly gross compensation of INR 80,000 on or before the fifth (5th) calendar day of each month, with standard annual bonus review.",
    docBContent:
      "The Company shall disburse a fixed monthly gross compensation of INR 90,000 on or before the fifth (5th) calendar day of each month, subject to clawback provisions if resignation occurs within 6 months.",
    summaryChange: "Base salary increased (INR 80,000 → INR 90,000) with added bonus clawback clause.",
    whyItMatters:
      "While gross monthly remuneration is higher, the updated version introduces a conditional 6-month clawback on discretionary bonus disbursements upon early resignation.",
    diffHighlightA: "INR 80,000 ... standard annual bonus review",
    diffHighlightB: "INR 90,000 ... subject to clawback provisions if resignation occurs within 6 months",
  },
  {
    id: "change-3",
    clauseTitle: "Intellectual Property Assignment Scope",
    category: "Risks",
    changeSeverity: "major",
    sectionA: "Section 6.1",
    sectionB: "Section 6.1",
    pageA: 7,
    pageB: 8,
    docAContent:
      "All intellectual property and code created by the Employee during working hours using Company equipment shall belong exclusively to the Company.",
    docBContent:
      "All intellectual property, discoveries, and software conceived by the Employee during the employment term, whether during or outside working hours and regardless of equipment utilized, shall belong exclusively to the Company.",
    summaryChange: "IP ownership expanded to include inventions created outside working hours.",
    whyItMatters:
      "The scope was broadened from work created during working hours to all inventions conceived at any time during tenure. This may affect independent side projects and pre-existing code.",
    diffHighlightA: "during working hours using Company equipment",
    diffHighlightB: "whether during or outside working hours and regardless of equipment utilized",
  },
  {
    id: "change-4",
    clauseTitle: "Post-Employment Non-Compete & Renewal",
    category: "Obligations",
    changeSeverity: "moderate",
    sectionA: "Section 5.3",
    sectionB: "Section 5.3",
    pageA: 6,
    pageB: 7,
    docAContent:
      "For a period of twelve (12) months following separation, the Employee shall not directly engage with competing software businesses within Karnataka.",
    docBContent:
      "For a period of twenty-four (24) months following separation, the Employee shall not directly engage with competing software businesses throughout India.",
    summaryChange: "Restricted duration extended from 12 → 24 months and geographic scope widened.",
    whyItMatters:
      "The restrictive covenant doubles in duration and expands to pan-India. In India, Section 27 of the Contract Act renders post-termination non-competes subject to strict judicial scrutiny.",
    diffHighlightA: "twelve (12) months ... within Karnataka",
    diffHighlightB: "twenty-four (24) months ... throughout India",
  },
  {
    id: "change-5",
    clauseTitle: "Annual Renewal & Review Period",
    category: "Dates",
    changeSeverity: "moderate",
    sectionA: "Section 3.2",
    sectionB: "Section 3.2",
    pageA: 4,
    pageB: 5,
    docAContent:
      "Compensation and performance appraisals shall be conducted annually every twelve (12) months.",
    docBContent:
      "Compensation and performance appraisals shall be conducted biannually every twenty-four (24) months.",
    summaryChange: "Performance appraisal cycle shifted from 12 months → 24 months.",
    whyItMatters:
      "The revision reduces the cadence of formal compensation reviews, effectively freezing merit increases for two years instead of annual adjustments.",
    diffHighlightA: "annually every twelve (12) months",
    diffHighlightB: "biannually every twenty-four (24) months",
  },
  {
    id: "change-6",
    clauseTitle: "Official Notice Addresses",
    category: "Legal",
    changeSeverity: "moderate",
    sectionA: "Section 7.5",
    sectionB: "Section 7.5",
    pageA: 10,
    pageB: 11,
    docAContent:
      "Notices shall be delivered by registered post to the Company's Indiranagar Registered Office.",
    docBContent:
      "Notices shall be delivered electronically via secure portal and by registered post to the new Whitefield Corporate Campus.",
    summaryChange: "Updated notice destination address and permitted electronic submission.",
    whyItMatters:
      "Administrative update clarifying that formal legal notices may now also be communicated through designated corporate digital channels.",
    diffHighlightA: "Indiranagar Registered Office",
    diffHighlightB: "electronically via secure portal and ... Whitefield Corporate Campus",
  },
  {
    id: "change-7",
    clauseTitle: "Working Hours & Hybrid In-Office Expectation",
    category: "Obligations",
    changeSeverity: "moderate",
    sectionA: "Section 4.1",
    sectionB: "Section 4.1",
    pageA: 5,
    pageB: 6,
    docAContent:
      "The Employee shall observe a 40-hour work week with flexible hybrid remote privileges.",
    docBContent:
      "The Employee shall observe a 40-hour work week with a mandatory minimum of three (3) designated days on-site at the corporate office.",
    summaryChange: "Flexible hybrid work replaced with mandatory 3-day on-site presence.",
    whyItMatters:
      "Sets binding on-site physical attendance requirements compared to previously unrestricted hybrid flexibility.",
    diffHighlightA: "flexible hybrid remote privileges",
    diffHighlightB: "mandatory minimum of three (3) designated days on-site",
  },
];

export const UNCHANGED_SECTIONS = [
  {
    id: "unchanged-1",
    title: "Governing Law & Court Jurisdiction",
    sectionReference: "Section 9.1",
    pageNumber: 13,
    note: "No substantive changes identified. Both versions maintain exclusive jurisdiction in Bengaluru courts under the Laws of India.",
  },
  {
    id: "unchanged-2",
    title: "Dispute Resolution & Arbitration",
    sectionReference: "Section 8.1",
    pageNumber: 11,
    note: "Sole arbitrator mechanism in Bengaluru under the Arbitration and Conciliation Act, 1996 remains unchanged.",
  },
  {
    id: "unchanged-3",
    title: "Severability & Entire Agreement",
    sectionReference: "Section 10.1",
    pageNumber: 15,
    note: "Standard boilerplate clause preserved identically in both document revisions.",
  },
  {
    id: "unchanged-4",
    title: "Confidentiality Definition of Trade Secrets",
    sectionReference: "Section 5.1",
    pageNumber: 6,
    note: "Core definition of protected confidential technological assets remains identical.",
  },
];
