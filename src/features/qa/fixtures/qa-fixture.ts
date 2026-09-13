import type {
  QATopicGroup,
  QuestionMessage,
} from "@/types";

export const QA_TOPIC_GROUPS: QATopicGroup[] = [
  {
    id: "understand",
    title: "Understand Document",
    description: "High-level overview, parties, and deal structure",
    iconName: "FileText",
    questions: [
      "What is this agreement about?",
      "Summarize the key terms.",
      "Who are the parties and their roles?",
    ],
  },
  {
    id: "obligations",
    title: "Obligations & Deadlines",
    description: "What you must do vs what the employer owes",
    iconName: "CheckSquare",
    questions: [
      "What do I have to do?",
      "What does the employer have to do?",
      "What deadlines and notice requirements apply?",
    ],
  },
  {
    id: "concerns",
    title: "Potential Concerns",
    description: "Points flagged for legal review or negotiation",
    iconName: "AlertTriangle",
    questions: [
      "Which clauses should I review carefully?",
      "Are there restrictive post-employment covenants?",
      "What provisions may deserve professional review?",
    ],
  },
  {
    id: "clauses",
    title: "Specific Clauses",
    description: "In-depth breakdown of individual sections",
    iconName: "Scale",
    questions: [
      "Explain the termination clause.",
      "Explain the confidentiality clause.",
      "What does the IP assignment clause say?",
    ],
  },
];

export interface QAAnswerRecord {
  directAnswer: string;
  explanation: string;
  sectionReference: string;
  pageNumber: number;
  evidenceExcerpt: string;
  suggestedNextStep?: string;
}

export const QA_FIXTURE_DATABASE: Record<string, QAAnswerRecord> = {
  "what is this agreement about?": {
    directAnswer: "This is a full-time Employment Agreement establishing terms of employment.",
    explanation:
      "The agreement defines the professional relationship between Acme Technologies Pvt. Ltd. (Employer) and Rahul Mehta (Employee). It governs key provisions including remuneration, operational duties, intellectual property rights, non-disclosure commitments, termination notice requirements, and arbitration dispute procedures.",
    sectionReference: "Section 1 & 2",
    pageNumber: 1,
    evidenceExcerpt:
      "This Employment Agreement is entered into by and between Acme Technologies Pvt. Ltd. and Rahul Mehta, setting forth the mutual covenants, responsibilities, and terms of service.",
    suggestedNextStep: "Review the Summary view for a full breakdown of key contractual milestones.",
  },
  "summarize the key terms.": {
    directAnswer: "Core terms include fixed compensation, 90-day resignation notice, IP assignment, and 12-month non-solicitation.",
    explanation:
      "The contract provides a monthly salary paid by the 5th of each month, a 3-month probation period expiring on 30 June 2026, broad assignment of intellectual property created during employment, indefinite confidentiality survival, and 90-day notice for voluntary separation.",
    sectionReference: "Sections 2.2, 3.1, 5.1, 6.1, 7.2",
    pageNumber: 4,
    evidenceExcerpt:
      "The Employee shall receive fixed monthly gross compensation... and observe ninety (90) calendar days prior written notice prior to separation.",
    suggestedNextStep: "Inspect the Key Clauses tab in the Analysis workspace for detailed clause categorization.",
  },
  "who are the parties and their roles?": {
    directAnswer: "The parties are Acme Technologies Pvt. Ltd. (Employer) and Rahul Mehta (Employee).",
    explanation:
      "Acme Technologies is an Indian private limited company registered in Bengaluru, Karnataka acting as the employing corporate entity. Rahul Mehta is appointed to a full-time professional technical role.",
    sectionReference: "Recitals & Section 1",
    pageNumber: 1,
    evidenceExcerpt:
      "Party of the First Part: Acme Technologies Pvt. Ltd... Party of the Second Part: Rahul Mehta, an individual residing in Bengaluru, Karnataka.",
    suggestedNextStep: "Check Document Details in the document panel for party identification metadata.",
  },
  "what do i have to do?": {
    directAnswer: "You must maintain confidentiality, return all assets upon leaving, follow company policies, and give 90 days notice.",
    explanation:
      "Your primary affirmative duties include: (1) safeguarding proprietary code and trade secrets indefinitely under Section 5.1, (2) returning laptops, badges, and documentation under Section 7.3, (3) providing 90 days advance notice before resigning under Section 7.2, and (4) observing standard 40-hour work week obligations.",
    sectionReference: "Section 5.1 & 7.2",
    pageNumber: 6,
    evidenceExcerpt:
      "The Employee shall hold in strict trust and confidence all Proprietary Information... and provide ninety (90) calendar days prior written notice before resignation.",
    suggestedNextStep: "Add these duties to your Action Center checklist to monitor compliance.",
  },
  "what does the employer have to do?": {
    directAnswer: "The employer must pay monthly compensation on time, provide benefits, and provide 30 days notice for termination without cause.",
    explanation:
      "Under Section 3.1 and 3.3, the Company is obligated to disburse fixed compensation on or before the 5th of each calendar month, provide statutory EPF and medical insurance benefits, and provide 30 days written notice or pay in lieu thereof in the event of termination without cause.",
    sectionReference: "Section 3.1 & 7.1",
    pageNumber: 4,
    evidenceExcerpt:
      "The Company shall disburse the monthly gross compensation... on or before the fifth (5th) calendar day of the subsequent calendar month.",
    suggestedNextStep: "Verify whether salary payment schedules match your banking expectations.",
  },
  "what deadlines and notice requirements apply?": {
    directAnswer: "90 days notice for employee resignation; 30 days notice for company termination without cause.",
    explanation:
      "Notice obligations are asymmetric: Section 7.2 obligates the employee to serve 90 calendar days notice for resignation, while Section 7.1 permits the company to terminate employment with 30 calendar days notice or equivalent salary payout.",
    sectionReference: "Section 7.1 & 7.2",
    pageNumber: 9,
    evidenceExcerpt:
      "Either party may terminate the employment relationship by providing ninety (90) calendar days prior written notice. The Company reserves the sole discretion to accept salary in lieu of notice.",
    suggestedNextStep: "Consider discussing the 90-day notice requirement if you require flexibility for future transitions.",
  },
  "which clauses should i review carefully?": {
    directAnswer: "Section 7.2 (Termination Notice), Section 6.1 (IP Assignment Scope), and Section 5.3 (Non-Compete Covenants).",
    explanation:
      "LexiGuide AI flagged three specific areas: (1) Section 7.2 grants the employer unilateral discretion over notice buyout, (2) Section 6.1 defines an expansive assignment that may capture personal inventions, and (3) Section 5.3 restricts post-employment competition for 12 months.",
    sectionReference: "Sections 5.3, 6.1, 7.2",
    pageNumber: 9,
    evidenceExcerpt:
      "All intellectual property, discoveries, and code created during the term of employment shall belong exclusively to the Company... for twelve (12) months following separation, the Employee covenants not to engage...",
    suggestedNextStep: "Navigate to the Action Center to track these specific discussion points.",
  },
  "are there restrictive post-employment covenants?": {
    directAnswer: "Yes. Section 5.3 imposes 12 months non-solicitation and restrictive covenants.",
    explanation:
      "The agreement includes a 12-month post-employment covenant restricting engagement with competing entities and prohibiting solicitation of clients or colleagues. Under Section 27 of the Indian Contract Act, post-employment non-competes face strict scrutiny in Indian courts.",
    sectionReference: "Section 5.3",
    pageNumber: 6,
    evidenceExcerpt:
      "For a period of twelve (12) months following separation of employment, the Employee covenants not to solicit, recruit or endeavor to entice away any employee or client.",
    suggestedNextStep: "Consider discussing practical enforceability and non-solicitation boundaries with a qualified legal advisor.",
  },
  "what provisions may deserve professional review?": {
    directAnswer: "Unilateral employee indemnity in Section 7.4 and broad IP assignment in Section 6.1.",
    explanation:
      "Section 7.4 contains an unreciprocated employee indemnity for policy breaches without a financial cap. A legal professional can advise on requesting a mutual limitation of liability or capping indemnity to one month's salary.",
    sectionReference: "Section 6.1 & 7.4",
    pageNumber: 10,
    evidenceExcerpt:
      "The Employee agrees to indemnify and hold harmless the Company against any damages, losses, or legal costs arising out of any breach of company policy.",
    suggestedNextStep: "Copy the suggested question in Action Center to present directly to your legal advisor.",
  },
  "explain the termination clause.": {
    directAnswer: "Section 7 outlines notice requirements, termination for cause, and return of property.",
    explanation:
      "Voluntary resignation requires 90 days written notice (Section 7.2). Termination without cause by the company requires 30 days notice or pay in lieu (Section 7.1). Termination for cause (misconduct, fraud, confidentiality breach) is immediate without notice or severance.",
    sectionReference: "Section 7.1, 7.2, 7.3",
    pageNumber: 9,
    evidenceExcerpt:
      "Either party may terminate the employment relationship by providing ninety (90) calendar days prior written notice. The Company may terminate immediately for cause without notice or severance pay.",
    suggestedNextStep: "Review the full clause text in the Key Clauses tab.",
  },
  "explain the confidentiality clause.": {
    directAnswer: "Section 5.1 imposes an indefinite duty of non-disclosure regarding proprietary information.",
    explanation:
      "The confidentiality commitment covers trade secrets, client lists, software algorithms, and commercial data. The obligation continues after employment ends with no expiration date. Permitted disclosure is restricted to court orders with advance notice to the company.",
    sectionReference: "Section 5.1",
    pageNumber: 6,
    evidenceExcerpt:
      "The Employee shall hold in strict trust and confidence all Proprietary Information... The obligations under this clause shall survive termination of employment indefinitely.",
    suggestedNextStep: "Ensure you clearly separate proprietary assets from public open-source libraries.",
  },
  "what does the ip assignment clause say?": {
    directAnswer: "Section 6.1 assigns all inventions and software created during employment to the company.",
    explanation:
      "All intellectual property, source code, patents, and copyrightable works created or reduced to practice during employment are deemed works made for hire and owned exclusively by Acme Technologies Pvt. Ltd.",
    sectionReference: "Section 6.1",
    pageNumber: 7,
    evidenceExcerpt:
      "All intellectual property, discoveries, code, inventions, and derivative works conceived or reduced to practice by the Employee shall be the sole exclusive property of the Company.",
    suggestedNextStep: "If you develop personal projects outside work, seek a written carve-out agreement.",
  },
};

export const QA_NOT_FOUND_RECORD: QAAnswerRecord = {
  directAnswer: "Not found in the uploaded document.",
  explanation:
    "I couldn't locate specific clauses or provisions addressing this question in the available content of Employment_Agreement_2026.pdf. LexiGuide AI answers are strictly grounded in the document text and do not speculate on unstated terms.",
  sectionReference: "Uploaded Document Boundary",
  pageNumber: 1,
  evidenceExcerpt: "No matching excerpt found in Employment_Agreement_2026.pdf.",
  suggestedNextStep:
    "Try asking about a specific section covered by this contract (e.g., compensation, termination, confidentiality, non-compete, or governing law).",
};
