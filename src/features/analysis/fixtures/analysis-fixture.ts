import type {
  DocumentMetadata,
  ClauseItem,
  RiskItem,
  ObligationItem,
  ImportantDateItem,
  DocumentSectionItem,
  ExecutiveSummaryData,
} from "@/types";

export interface EvidenceDetail {
  id: string;
  documentTitle: string;
  sectionReference: string;
  pageNumber: number;
  excerpt: string;
  contextNote?: string;
}

export interface CopilotQAPair {
  question: string;
  answer: string;
  sectionReference: string;
  pageNumber: number;
  evidenceExcerpt: string;
  suggestedNextStep?: string;
}

export const SAMPLE_DOCUMENT: DocumentMetadata = {
  id: "doc-ea-2026",
  name: "Employment_Agreement_2026.pdf",
  sizeBytes: 2457600, // 2.4 MB
  type: "pdf",
  mimeType: "application/pdf",
  pageCount: 18,
  uploadedAt: "2026-04-01T10:00:00.000Z",
  status: "analyzed",
};

export const DOCUMENT_METADATA_DETAILS = {
  documentType: "Employment Agreement",
  parties: [
    { role: "Employer", name: "Acme Technologies Pvt. Ltd." },
    { role: "Employee", name: "Rahul Mehta" },
  ],
  effectiveDate: "01 April 2026",
  jurisdiction: "India (Bengaluru, Karnataka)",
  governingLaw: "Laws of India",
  reviewStatus: "AI Analysis Complete",
};

export const METADATA_SUMMARY_CARDS = [
  {
    id: "doc-type",
    label: "Document Type",
    value: "Employment Agreement",
    secondary: "Bilateral agreement",
    iconName: "FileText",
  },
  {
    id: "parties",
    label: "Parties",
    value: "2 Parties",
    secondary: "Employer & Employee",
    iconName: "Users",
  },
  {
    id: "important-dates",
    label: "Important Dates",
    value: "4 Identified",
    secondary: "Effective date & milestones",
    iconName: "Calendar",
  },
  {
    id: "key-clauses",
    label: "Key Clauses",
    value: "12 Identified",
    secondary: "10 primary sections",
    iconName: "Scale",
  },
  {
    id: "potential-concerns",
    label: "Potential Concerns",
    value: "5 Flagged",
    secondary: "1 high attention, 4 review/info",
    iconName: "AlertTriangle",
  },
  {
    id: "obligations",
    label: "Obligations",
    value: "8 Identified",
    secondary: "4 employee, 4 employer",
    iconName: "CheckSquare",
  },
];

export const EXECUTIVE_SUMMARY: ExecutiveSummaryData = {
  overview:
    "This employment agreement outlines the relationship between the employer and employee, including compensation, confidentiality, intellectual property, termination, and dispute-resolution provisions.",
  bulletPoints: [
    "The agreement defines the employee's role and compensation structure with standard payment cycles.",
    "Confidentiality obligations continue beyond employment in certain circumstances and protect proprietary assets.",
    "Intellectual-property provisions address work created during employment, with assignment terms that warrant careful review.",
    "Either party may terminate the agreement subject to specified notice requirements (90 days for voluntary resignation).",
    "Disputes are subject to arbitration in Bengaluru, Karnataka, under the Indian Arbitration and Conciliation Act.",
  ],
  documentContext: {
    jurisdiction: "Bengaluru, Karnataka, India",
    governingLaw: "Laws of the Republic of India",
    effectiveDate: "01 April 2026",
    documentType: "Full-Time Employment Agreement",
  },
};

export const DOCUMENT_SECTIONS: DocumentSectionItem[] = [
  { id: "sec-1", sectionNumber: "01", title: "Definitions & Interpretations", pageNumber: 1 },
  { id: "sec-2", sectionNumber: "02", title: "Employment Terms & Role", pageNumber: 2 },
  { id: "sec-3", sectionNumber: "03", title: "Compensation & Benefits", pageNumber: 4 },
  { id: "sec-4", sectionNumber: "04", title: "Working Hours & Place of Work", pageNumber: 5 },
  { id: "sec-5", sectionNumber: "05", title: "Confidentiality & Non-Disclosure", pageNumber: 6 },
  { id: "sec-6", sectionNumber: "06", title: "Intellectual Property Rights", pageNumber: 7 },
  { id: "sec-7", sectionNumber: "07", title: "Termination & Notice Requirements", pageNumber: 9 },
  { id: "sec-8", sectionNumber: "08", title: "Dispute Resolution & Arbitration", pageNumber: 11 },
  { id: "sec-9", sectionNumber: "09", title: "Governing Law & Jurisdiction", pageNumber: 13 },
  { id: "sec-10", sectionNumber: "10", title: "General Provisions & Severability", pageNumber: 15 },
];

export const DOCUMENT_PAGES = Array.from({ length: 18 }, (_, index) => {
  const pageNum = index + 1;
  const sectionForPage = DOCUMENT_SECTIONS.slice()
    .reverse()
    .find((s) => s.pageNumber <= pageNum);
  return {
    pageNumber: pageNum,
    title: `Page ${pageNum}`,
    subtitle: sectionForPage ? `Section ${sectionForPage.sectionNumber}: ${sectionForPage.title}` : "Cover & Recitals",
  };
});

export const KEY_CLAUSES: ClauseItem[] = [
  {
    id: "cl-1",
    title: "Compensation & Salary Payment",
    category: "Financial",
    sectionReference: "Section 3.1",
    pageNumber: 4,
    importance: "critical",
    summary: "Defines annual fixed compensation, variable performance bonus, and payment on or before the 5th of each month.",
    evidenceSnippet:
      "The Company shall disburse the monthly gross compensation to the Employee's designated account on or before the fifth (5th) calendar day of the subsequent calendar month.",
  },
  {
    id: "cl-2",
    title: "Confidentiality Obligations",
    category: "Protection",
    sectionReference: "Section 5.1",
    pageNumber: 6,
    importance: "critical",
    summary: "Obligates employee to protect proprietary source code, commercial strategies, and customer confidential information indefinitely.",
    evidenceSnippet:
      "The Employee shall hold in strict trust and confidence all Proprietary Information and shall not disclose, duplicate or utilize such information except as required in the direct performance of duties.",
  },
  {
    id: "cl-3",
    title: "Intellectual Property Assignment",
    category: "IP Rights",
    sectionReference: "Section 6.1",
    pageNumber: 7,
    importance: "critical",
    summary: "Broad assignment of inventions, copyrightable software, and patents created during employment to Acme Technologies.",
    evidenceSnippet:
      "All intellectual property, discoveries, code, inventions, and derivative works conceived, created or reduced to practice by the Employee during the term of employment shall be deemed works made for hire and the sole exclusive property of the Company.",
  },
  {
    id: "cl-4",
    title: "Termination Notice & Conditions",
    category: "Termination",
    sectionReference: "Section 7.2",
    pageNumber: 9,
    importance: "critical",
    summary: "Requires 90 calendar days written notice for voluntary employee resignation, with employer option to waive notice pay.",
    evidenceSnippet:
      "Either party may terminate the employment relationship by providing ninety (90) calendar days prior written notice. The Company reserves the sole discretion to accept salary in lieu of notice or require the Employee to serve out the full duration.",
  },
  {
    id: "cl-5",
    title: "Post-Employment Restrictive Covenants",
    category: "Compliance",
    sectionReference: "Section 5.3",
    pageNumber: 6,
    importance: "standard",
    summary: "Imposes a 12-month non-solicitation restriction on clients and company colleagues post-separation.",
    evidenceSnippet:
      "For a period of twelve (12) months following separation of employment, the Employee covenants not to solicit, recruit or endeavor to entice away any employee, consultant or customer of the Company.",
  },
  {
    id: "cl-6",
    title: "Working Hours & Overtime Policy",
    category: "Operations",
    sectionReference: "Section 4.1",
    pageNumber: 5,
    importance: "standard",
    summary: "Standard 40 hours per week with reasonable overtime expectation based on business exigencies.",
    evidenceSnippet:
      "Standard operating hours are forty (40) hours per week, Monday through Friday. Due to managerial and technical responsibilities, reasonable extra hours may be required without separate overtime compensation.",
  },
  {
    id: "cl-7",
    title: "Probation & Confirmation",
    category: "Employment Terms",
    sectionReference: "Section 2.2",
    pageNumber: 2,
    importance: "standard",
    summary: "Three-month probation review period with formal written confirmation required.",
    evidenceSnippet:
      "The initial appointment shall be subject to a probationary period of three (3) months, expiring on 30 June 2026, extendable at the Company's reasonable discretion.",
  },
  {
    id: "cl-8",
    title: "Dispute Resolution & Arbitration",
    category: "Legal",
    sectionReference: "Section 8.1",
    pageNumber: 11,
    importance: "notable",
    summary: "Disputes referred to sole arbitrator in Bengaluru pursuant to the Arbitration and Conciliation Act, 1996.",
    evidenceSnippet:
      "Any dispute arising out of or in connection with this Agreement shall be resolved by binding arbitration seated in Bengaluru, Karnataka, conducted in the English language before a sole arbitrator.",
  },
  {
    id: "cl-9",
    title: "Severability & Entire Agreement",
    category: "Boilerplate",
    sectionReference: "Section 10.1",
    pageNumber: 15,
    importance: "notable",
    summary: "Invalidity of any single clause will not invalidate remaining provisions; supersedes prior verbal communications.",
    evidenceSnippet:
      "This Agreement constitutes the entire understanding between the parties with respect to the subject matter hereof and supersedes all prior oral or written negotiations.",
  },
];

export const POTENTIAL_CONCERNS: RiskItem[] = [
  {
    id: "risk-1",
    title: "Termination Notice Period",
    severity: "high",
    clauseReference: "Section 7.2",
    pageNumber: 9,
    description:
      "Section 7.2 specifies a 90-day notice period that may materially affect how either party can end the agreement, and grants the employer unilateral discretion regarding buyout.",
    recommendation:
      "Consider discussing whether the notice period can be reduced to 30 or 60 days, or made strictly mutual in terms of notice buyout options.",
    evidenceSnippet:
      "Either party may terminate the employment relationship by providing ninety (90) calendar days prior written notice. The Company reserves the sole discretion to accept salary in lieu of notice or require the Employee to serve out the full duration.",
  },
  {
    id: "risk-2",
    title: "Intellectual Property Scope",
    severity: "medium",
    clauseReference: "Section 6.1",
    pageNumber: 7,
    description:
      "The assignment wording appears broad and may warrant closer review regarding work created outside assigned duties, personal time, or unrelated technologies.",
    recommendation:
      "Consider requesting an explicit exception carve-out for pre-existing inventions and projects developed independently without company resources.",
    evidenceSnippet:
      "All intellectual property, discoveries, code, inventions, and derivative works conceived, created or reduced to practice by the Employee during the term of employment shall be deemed works made for hire and the sole exclusive property of the Company.",
  },
  {
    id: "risk-3",
    title: "Post-Employment Non-Compete Scope",
    severity: "medium",
    clauseReference: "Section 5.3",
    pageNumber: 6,
    description:
      "The restrictive covenant restricts engagement with competing entities for 12 months. Under Section 27 of the Indian Contract Act, post-employment non-compete agreements are generally regarded with strict judicial scrutiny.",
    recommendation:
      "Review the geographic and scope limitations with a legal professional to clarify practical enforceability versus non-solicitation duties.",
    evidenceSnippet:
      "For a period of twelve (12) months following separation of employment, the Employee covenants not to solicit, recruit or endeavor to entice away any employee, consultant or customer of the Company.",
  },
  {
    id: "risk-4",
    title: "Unilateral Indemnity Clause",
    severity: "medium",
    clauseReference: "Section 7.4",
    pageNumber: 10,
    description:
      "Section 7.4 includes employee indemnity for losses arising from breach of policies without a reciprocal protection or clear financial liability cap.",
    recommendation:
      "Consider discussing a reasonable liability cap (e.g. capped at one month's salary) and limiting liability to cases of gross negligence or wilful misconduct.",
    evidenceSnippet:
      "The Employee agrees to indemnify and hold harmless the Company against any damages, losses, or legal costs arising out of any breach of company policy or this Agreement.",
  },
  {
    id: "risk-5",
    title: "Exclusive Jurisdiction & Forum",
    severity: "low",
    clauseReference: "Section 8.1",
    pageNumber: 11,
    description:
      "The agreement identifies exclusive arbitration and court jurisdiction in Bengaluru, Karnataka. This is standard corporate practice but worth noting if the employee relocates.",
    recommendation:
      "Informational note: Ensure you are aware that any dispute proceedings would require representation or proceedings in Bengaluru courts.",
    evidenceSnippet:
      "Any dispute arising out of or in connection with this Agreement shall be resolved by binding arbitration seated in Bengaluru, Karnataka, conducted in the English language before a sole arbitrator.",
  },
];

export const IMPORTANT_OBLIGATIONS: ObligationItem[] = [
  // Employee obligations
  {
    id: "ob-1",
    party: "Rahul Mehta (Employee)",
    duty: "Maintain confidentiality of company proprietary information, trade secrets, and source code indefinitely.",
    deadline: "Ongoing during and post-employment",
    clauseReference: "Section 5.1",
    pageNumber: 6,
    status: "Identified",
    consequences: "Injunctive relief and potential claim for damages under Section 5.5",
  },
  {
    id: "ob-2",
    party: "Rahul Mehta (Employee)",
    duty: "Return all company property, laptops, credentials, access cards, and documentation immediately upon termination.",
    deadline: "On or before final working day",
    clauseReference: "Section 7.3",
    pageNumber: 10,
    status: "Identified",
    consequences: "Withholding of final settlement clearance until property verified",
  },
  {
    id: "ob-3",
    party: "Rahul Mehta (Employee)",
    duty: "Comply with applicable company code of conduct, security guidelines, and anti-harassment workplace policies.",
    deadline: "Continuous during tenure",
    clauseReference: "Section 4.2",
    pageNumber: 5,
    status: "Identified",
    consequences: "Disciplinary action up to summary termination for cause",
  },
  {
    id: "ob-4",
    party: "Rahul Mehta (Employee)",
    duty: "Provide ninety (90) calendar days prior written notice before voluntary resignation.",
    deadline: "Prior to separation date",
    clauseReference: "Section 7.2",
    pageNumber: 9,
    status: "Identified",
    consequences: "Employer discretion to adjust salary in lieu of notice period",
  },
  // Employer obligations
  {
    id: "ob-5",
    party: "Acme Technologies Pvt. Ltd. (Employer)",
    duty: "Pay agreed fixed monthly compensation and performance bonuses on or before the 5th of each calendar month.",
    deadline: "Monthly (by 5th calendar day)",
    clauseReference: "Section 3.1",
    pageNumber: 4,
    status: "Identified",
    consequences: "Statutory interest under applicable Payment of Wages regulations",
  },
  {
    id: "ob-6",
    party: "Acme Technologies Pvt. Ltd. (Employer)",
    duty: "Provide statutory provident fund (EPF), gratuity coverage, and group medical health insurance benefits.",
    deadline: "Effective from commencement date",
    clauseReference: "Section 3.3",
    pageNumber: 4,
    status: "Identified",
    consequences: "Compliance enforcement under statutory labour laws",
  },
  {
    id: "ob-7",
    party: "Acme Technologies Pvt. Ltd. (Employer)",
    duty: "Provide thirty (30) days written notice or pay in lieu thereof in the event of termination without cause.",
    deadline: "At time of notice issuance",
    clauseReference: "Section 7.1",
    pageNumber: 9,
    status: "Identified",
    consequences: "Wrongful termination claim if procedural notice not respected",
  },
  {
    id: "ob-8",
    party: "Acme Technologies Pvt. Ltd. (Employer)",
    duty: "Maintain confidentiality of employee personal records and medical data in accordance with applicable data privacy laws.",
    deadline: "Ongoing during and post-employment",
    clauseReference: "Section 5.4",
    pageNumber: 7,
    status: "Identified",
    consequences: "Breach under Indian Digital Personal Data Protection Act framework",
  },
];

export const IMPORTANT_DATES: ImportantDateItem[] = [
  {
    id: "dt-1",
    event: "Effective Date of Agreement",
    dateOrDuration: "01 April 2026",
    type: "calendar_date",
    sourceSection: "Section 1.1",
    pageNumber: 1,
    description: "Date on which employment tenure, salary accrual, and contractual obligations officially commence.",
  },
  {
    id: "dt-2",
    event: "Probationary Performance Review",
    dateOrDuration: "30 June 2026 (3 Months)",
    type: "calendar_date",
    sourceSection: "Section 2.2",
    pageNumber: 2,
    description: "Conclusion of initial 3-month probation window for formal confirmation of employment.",
  },
  {
    id: "dt-3",
    event: "Voluntary Resignation Notice Period",
    dateOrDuration: "90 Calendar Days",
    type: "notice_period",
    sourceSection: "Section 7.2",
    pageNumber: 9,
    description: "Required written advance notice duration for employee-initiated separation.",
  },
  {
    id: "dt-4",
    event: "Annual Performance & Compensation Review",
    dateOrDuration: "12 Months from Effective Date",
    type: "renewal_period",
    sourceSection: "Section 3.2",
    pageNumber: 4,
    description: "Annual milestone for appraisal, merit revision, and role evaluation.",
  },
];

export const COPILOT_SUGGESTIONS = [
  "What are the termination conditions?",
  "What obligations do I have?",
  "Are there any clauses I should review carefully?",
  "What happens if I resign?",
  "Summarize the confidentiality section.",
];

export const COPILOT_QA_PAIRS: Record<string, CopilotQAPair> = {
  termination: {
    question: "What are the termination conditions?",
    answer:
      "Under Section 7, either party may terminate the contract with written notice. The employee is required to provide 90 days notice for resignation, while the employer may terminate without cause with 30 days notice or pay in lieu. Immediate termination without notice applies in cases of proven misconduct or breach of confidentiality.",
    sectionReference: "Section 7.1 & 7.2",
    pageNumber: 9,
    evidenceExcerpt:
      "Either party may terminate the employment relationship by providing ninety (90) calendar days prior written notice. The Company may terminate immediately for cause without notice or severance pay.",
    suggestedNextStep:
      "You may want to verify whether the 90-day requirement aligns with your career planning and discuss whether buyout terms can be clarified.",
  },
  obligations: {
    question: "What obligations do I have?",
    answer:
      "Your primary obligations include: (1) maintaining strict confidentiality over proprietary information indefinitely (Section 5.1), (2) returning all company assets and credentials upon separation (Section 7.3), (3) providing 90 days notice before resigning (Section 7.2), and (4) complying with workplace security and conduct policies (Section 4.2).",
    sectionReference: "Sections 4.2, 5.1, 7.2, 7.3",
    pageNumber: 6,
    evidenceExcerpt:
      "The Employee shall hold in strict trust and confidence all Proprietary Information... and return all Company assets, documentation, and credentials on or before the final working day.",
    suggestedNextStep:
      "Review the Obligations tab for a clear breakdown distinguishing your duties from the employer's commitments.",
  },
  review: {
    question: "Are there any clauses I should review carefully?",
    answer:
      "LexiGuide identified three clauses that may warrant closer attention: (1) Section 7.2 requiring a 90-day resignation notice with unilateral employer buyout discretion, (2) Section 6.1 defining an extensive intellectual property assignment that could include off-hours work, and (3) Section 5.3 containing post-employment non-compete restrictions.",
    sectionReference: "Sections 5.3, 6.1, 7.2",
    pageNumber: 9,
    evidenceExcerpt:
      "All intellectual property conceived or created during the term of employment shall be deemed the sole property of the Company... Either party may terminate with ninety (90) calendar days notice.",
    suggestedNextStep:
      "Inspect the Potential Concerns tab to view balanced analysis and recommended points to discuss with legal counsel.",
  },
  resign: {
    question: "What happens if I resign?",
    answer:
      "If you resign, Section 7.2 requires submitting ninety (90) calendar days written notice. During this period, you are expected to assist in handovers. The company retains discretion to waive the notice period or accept pay in lieu. Upon completion, you must return all company property (Section 7.3) and continue observing confidentiality obligations (Section 5.1).",
    sectionReference: "Section 7.2",
    pageNumber: 9,
    evidenceExcerpt:
      "Either party may terminate the employment relationship by providing ninety (90) calendar days prior written notice. The Company reserves the sole discretion to accept salary in lieu of notice.",
    suggestedNextStep:
      "Review Section 7.2 and consult the Human Resources handover guidelines.",
  },
  confidentiality: {
    question: "Summarize the confidentiality section.",
    answer:
      "Section 5.1 requires safeguarding all company trade secrets, proprietary algorithms, financial data, and client lists. These non-disclosure duties survive the termination of employment indefinitely. Permitted disclosures are restricted to legally compelled court orders with prior notification to the company.",
    sectionReference: "Section 5.1",
    pageNumber: 6,
    evidenceExcerpt:
      "The Employee shall hold in strict trust and confidence all Proprietary Information and shall not disclose, duplicate or utilize such information... The obligations under this clause shall survive termination of employment indefinitely.",
    suggestedNextStep:
      "Verify whether you have pre-existing open-source contributions or personal projects that need clear demarcation.",
  },
};

export const COPILOT_NOT_FOUND_RESPONSE = {
  answer:
    "I couldn't locate specific clauses or provisions addressing this question in the uploaded document (Employment_Agreement_2026.pdf).",
  notice:
    "LexiGuide AI answers based on the uploaded document text and does not invent terms not present in the contract.",
  suggestedNextStep:
    "You may want to check whether this topic is covered in separate addenda, offer letters, or company employee handbooks.",
};
