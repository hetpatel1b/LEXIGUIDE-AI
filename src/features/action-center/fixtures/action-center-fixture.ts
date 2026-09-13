import type {
  ActionItem,
  ActionSummaryMetrics,
} from "@/types";

export const ACTION_CENTER_METRICS: ActionSummaryMetrics = {
  total: 10,
  completed: 2,
  reviewCount: 4,
  upcomingCount: 2,
  confirmCount: 2,
  discussCount: 2,
};

export const INITIAL_ACTION_ITEMS: ActionItem[] = [
  // Category: Review
  {
    id: "act-1",
    title: "Review the termination notice period & buyout terms",
    category: "review",
    status: "needs_review",
    description:
      "Section 7.2 requires 90 calendar days notice for voluntary employee resignation, with unilateral employer discretion regarding notice buyout.",
    whyItMatters:
      "A 90-day notice requirement is lengthy and may limit flexibility when pursuing subsequent career opportunities unless buyout terms are mutually agreed.",
    sourceSection: "Section 7.2",
    pageNumber: 9,
    isChecked: false,
    evidenceSnippet:
      "Either party may terminate the employment relationship by providing ninety (90) calendar days prior written notice. The Company reserves the sole discretion to accept salary in lieu of notice.",
  },
  {
    id: "act-2",
    title: "Review intellectual property assignment scope for personal projects",
    category: "review",
    status: "needs_review",
    description:
      "Section 6.1 broadly assigns all discoveries, software, and code conceived during the term of employment to Acme Technologies.",
    whyItMatters:
      "Without an explicit exception or pre-existing invention schedule, code or side projects created independently in your personal time could be subject to employer claims.",
    sourceSection: "Section 6.1",
    pageNumber: 7,
    isChecked: false,
    evidenceSnippet:
      "All intellectual property, discoveries, code, inventions, and derivative works conceived or reduced to practice by the Employee during the term of employment shall belong exclusively to the Company.",
  },
  {
    id: "act-3",
    title: "Review unilateral employee indemnity clause",
    category: "review",
    status: "needs_review",
    description:
      "Section 7.4 obligates the employee to indemnify the company for policy breaches without a reciprocal company commitment or financial liability cap.",
    whyItMatters:
      "Uncapped indemnities in employment contracts create disproportionate personal financial exposure for unintentional or administrative policy infringements.",
    sourceSection: "Section 7.4",
    pageNumber: 10,
    isChecked: false,
    evidenceSnippet:
      "The Employee agrees to indemnify and hold harmless the Company against any damages, losses, or legal costs arising out of any breach of company policy.",
  },
  {
    id: "act-4",
    title: "Review post-employment non-compete covenants",
    category: "review",
    status: "needs_review",
    description:
      "Section 5.3 restricts engagement with competing software entities for 12 months following separation of employment.",
    whyItMatters:
      "In India, Section 27 of the Indian Contract Act generally renders post-termination non-compete agreements void, though non-solicitation of clients remains enforceable.",
    sourceSection: "Section 5.3",
    pageNumber: 6,
    isChecked: true, // Example completed state
    evidenceSnippet:
      "For a period of twelve (12) months following separation of employment, the Employee covenants not to solicit, recruit or endeavor to entice away any employee or client.",
  },

  // Category: Upcoming
  {
    id: "act-5",
    title: "Contract Effective Date Commencement",
    category: "upcoming",
    status: "upcoming",
    description:
      "Official start date of employment tenure, compensation accrual, and contractual obligations.",
    whyItMatters:
      "Ensures timely reporting, signing of joining documentation, and activation of statutory employee provident fund accounts.",
    sourceSection: "Section 1.1",
    pageNumber: 1,
    dueDate: "01 April 2026",
    isChecked: true, // Example completed state
    evidenceSnippet:
      "This Employment Agreement shall become effective as of 01 April 2026.",
  },
  {
    id: "act-6",
    title: "Probationary Performance Review Window",
    category: "upcoming",
    status: "upcoming",
    description:
      "Initial 3-month probation period concludes on 30 June 2026 for formal written appraisal and employment confirmation.",
    whyItMatters:
      "Notice periods during probation may differ from confirmed tenure; track this date to ensure formal confirmation letter is received.",
    sourceSection: "Section 2.2",
    pageNumber: 2,
    dueDate: "30 June 2026",
    isChecked: false,
    evidenceSnippet:
      "The initial appointment shall be subject to a probationary period of three (3) months, expiring on 30 June 2026.",
  },

  // Category: Confirm
  {
    id: "act-7",
    title: "Confirm pre-existing code & side-project carve-out",
    category: "confirm",
    status: "confirm",
    description:
      "Clarify in writing whether any open-source contributions or personal hobby projects are officially excluded from Section 6.1.",
    whyItMatters:
      "Securing written acknowledgment prior to signing eliminates ambiguity regarding ownership of previous technical work.",
    sourceSection: "Section 6.1",
    pageNumber: 7,
    isChecked: false,
    evidenceSnippet:
      "All intellectual property... shall be deemed works made for hire and the sole exclusive property of the Company.",
  },
  {
    id: "act-8",
    title: "Confirm statutory provident fund (EPF) & health insurance coverage",
    category: "confirm",
    status: "confirm",
    description:
      "Verify that corporate HR enrolls you under statutory EPF provisions and provides group medical policy terms from Day 1.",
    whyItMatters:
      "Ensures social security compliance and medical protection for you and eligible dependents.",
    sourceSection: "Section 3.3",
    pageNumber: 4,
    isChecked: false,
    evidenceSnippet:
      "The Company shall provide statutory employee benefits, including contributions toward Employee Provident Fund (EPF) and medical insurance.",
  },

  // Category: Discuss
  {
    id: "act-9",
    title: "Ask a legal professional about non-compete enforceability under Indian law",
    category: "discuss",
    status: "discuss",
    description:
      "Raise Section 5.3 with a licensed advocate to understand the legal enforceability of non-compete restrictions versus non-solicitation in your jurisdiction.",
    suggestedQuestion:
      "Under Section 27 of the Indian Contract Act, 1872, is the 12-month post-employment non-compete clause in Section 5.3 practically enforceable against a technical employee?",
    whyItMatters:
      "Understanding statutory case law precedents prevents unnecessary anxiety about future employment moves.",
    sourceSection: "Section 5.3",
    pageNumber: 6,
    isChecked: false,
    evidenceSnippet:
      "For a period of twelve (12) months following separation of employment, the Employee covenants not to solicit, recruit or endeavor to entice away...",
  },
  {
    id: "act-10",
    title: "Discuss mutual cap on employee indemnification liability",
    category: "discuss",
    status: "discuss",
    description:
      "Consult legal counsel on standard negotiation language to cap employee indemnity to one month's salary or limit it to gross negligence.",
    suggestedQuestion:
      "How should Section 7.4 be amended so that employee indemnity is capped at a fixed reasonable sum and excludes inadvertent administrative errors?",
    whyItMatters:
      "A qualified attorney can provide standard market carve-outs that employers routinely accept during pre-signing reviews.",
    sourceSection: "Section 7.4",
    pageNumber: 10,
    isChecked: false,
    evidenceSnippet:
      "The Employee agrees to indemnify and hold harmless the Company against any damages, losses, or legal costs...",
  },
];
