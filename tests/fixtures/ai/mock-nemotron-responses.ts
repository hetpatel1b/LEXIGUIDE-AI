/**
 * Deterministic mocked Nemotron responses for unit and integration testing.
 */

export const MOCK_VALID_EMPLOYMENT_RESPONSE = JSON.stringify({
  analysisSchemaVersion: "1.0",
  metadata: {
    documentType: "Executive Employment Agreement",
    parties: [
      { role: "Employer", name: "Acme Technologies Pvt. Ltd." },
      { role: "Employee", name: "Rahul Mehta" }
    ],
    effectiveDate: "01 April 2026",
    terminationDate: "31 March 2029",
    jurisdiction: "Bengaluru, Karnataka",
    governingLaw: "Laws of India",
    financialTerms: "INR 45,00,000 per annum"
  },
  executiveSummary: {
    overview: "This Executive Employment Agreement engages Rahul Mehta as Principal Systems Engineer at Acme Technologies Pvt. Ltd. commencing 01 April 2026.",
    keyThemes: [
      "Executive role with annual base salary of INR 45,00,000",
      "Confidentiality and 12-month post-termination non-compete covenant",
      "90-day mutual notice requirement for termination"
    ],
    majorObligationsSummary: [
      "Employee must maintain confidentiality of proprietary information indefinitely",
      "Employer must pay base salary monthly on the last working day"
    ],
    reviewPriorities: [
      "Post-employment non-compete enforceability under Indian Contract Act",
      "Immediate termination severance calculation provisions"
    ]
  },
  keyClauses: [
    {
      id: "clause_1",
      title: "Compensation and Benefits",
      category: "Compensation",
      summary: "Annual compensation fixed at INR 45,00,000 payable monthly on last working day.",
      importance: "critical",
      source: {
        chunkId: "chk_doc_test_employment_001_001",
        sectionId: "sec_02",
        sectionTitle: "Compensation & Benefits",
        pageNumber: 1,
        quote: "Base salary shall be INR 45,00,000 per annum, paid monthly on the last working day."
      }
    },
    {
      id: "clause_2",
      title: "Confidentiality and Proprietary Information",
      category: "Confidentiality",
      summary: "Employee obligated to protect proprietary information during and after employment.",
      importance: "standard",
      source: {
        chunkId: "chk_doc_test_employment_001_002",
        sectionId: "sec_03",
        sectionTitle: "Confidentiality & Non-Compete",
        pageNumber: 2,
        quote: "The Employee agrees not to disclose any Proprietary Information during or after employment."
      }
    }
  ],
  potentialConcerns: [
    {
      id: "concern_1",
      title: "Post-Employment Non-Compete Restriction",
      severity: "high",
      explanation: "The agreement imposes a 12-month restrictive non-compete post termination within Bengaluru.",
      whyItMatters: "Section 27 of the Indian Contract Act generally restricts covenants in restraint of trade post-employment.",
      suggestedReviewQuestion: "Is this 12-month restrictive non-compete enforceable under applicable state labour laws?",
      source: {
        chunkId: "chk_doc_test_employment_001_002",
        sectionId: "sec_03",
        sectionTitle: "Confidentiality & Non-Compete",
        pageNumber: 2,
        quote: "for a period of 12 months following termination, the Employee shall not directly or indirectly engage in competitive business"
      }
    }
  ],
  obligations: [
    {
      id: "ob_1",
      description: "Pay base salary monthly on the last working day.",
      party: "Employer",
      responsibleParty: "Acme Technologies Pvt. Ltd.",
      deadline: "Monthly on the last working day",
      consequence: null,
      source: {
        chunkId: "chk_doc_test_employment_001_001",
        sectionId: "sec_02",
        sectionTitle: "Compensation & Benefits",
        pageNumber: 1,
        quote: "paid monthly on the last working day."
      }
    }
  ],
  importantDates: [
    {
      id: "date_1",
      label: "Effective Start Date",
      dateOrDuration: "01 April 2026",
      type: "calendar_date",
      source: {
        chunkId: "chk_doc_test_employment_001_000",
        sectionId: "sec_01",
        sectionTitle: "Definitions & Engagement",
        pageNumber: 1,
        quote: "entered into on 01 April 2026"
      }
    },
    {
      id: "date_2",
      label: "Termination Notice Period",
      dateOrDuration: "90 days",
      type: "notice_period",
      source: {
        chunkId: "chk_doc_test_employment_001_003",
        sectionId: "sec_04",
        sectionTitle: "Term & Termination",
        pageNumber: 3,
        quote: "providing a 90-day prior written notice."
      }
    }
  ],
  analysisNotes: [
    "Document contains 4 numbered sections with clear compensation and separation terms."
  ]
});

export const MOCK_VALID_NDA_RESPONSE = JSON.stringify({
  analysisSchemaVersion: "1.0",
  metadata: {
    documentType: "Mutual Non-Disclosure Agreement",
    parties: [
      { role: "Disclosing/Receiving Party", name: "Alpha Innovations LLC" },
      { role: "Disclosing/Receiving Party", name: "Beta Technologies Corp." }
    ],
    effectiveDate: null,
    terminationDate: null,
    jurisdiction: "State of Delaware",
    governingLaw: "State of Delaware",
    financialTerms: "Not found in the uploaded document."
  },
  executiveSummary: {
    overview: "Mutual confidentiality agreement governing proprietary disclosures between Alpha Innovations and Beta Technologies.",
    keyThemes: ["5-year confidentiality obligation", "14-day return of materials upon demand"],
    majorObligationsSummary: ["Do not disclose confidential info to third parties"],
    reviewPriorities: ["Absence of dispute resolution and arbitration provisions"]
  },
  keyClauses: [
    {
      id: "clause_nda_1",
      title: "Non-Disclosure Duration",
      category: "Confidentiality",
      summary: "5-year protection window for disclosed confidential information.",
      importance: "critical",
      source: {
        chunkId: "chk_doc_test_nda_002_000",
        sectionId: "sec_nda_01",
        sectionTitle: "Scope of Confidentiality",
        pageNumber: null,
        quote: "Neither party shall disclose Confidential Information to any third party for a period of 5 years from disclosure."
      }
    }
  ],
  potentialConcerns: [],
  obligations: [
    {
      id: "ob_nda_1",
      description: "Return or destroy materials within 14 calendar days upon request.",
      party: "Receiving Party",
      responsibleParty: "Receiving Party",
      deadline: "14 calendar days",
      consequence: null,
      source: {
        chunkId: "chk_doc_test_nda_002_001",
        sectionId: "sec_nda_02",
        sectionTitle: "Term & Return of Materials",
        pageNumber: null,
        quote: "return or destroy all physical materials within 14 calendar days."
      }
    }
  ],
  importantDates: [
    {
      id: "date_nda_1",
      label: "Confidentiality Window",
      dateOrDuration: "5 years",
      type: "duration",
      source: {
        chunkId: "chk_doc_test_nda_002_000",
        sectionId: "sec_nda_01",
        sectionTitle: "Scope of Confidentiality",
        pageNumber: null,
        quote: "period of 5 years from disclosure."
      }
    }
  ],
  analysisNotes: [
    "Arbitration and financial terms were not found in the uploaded document."
  ]
});

export const MOCK_FABRICATED_QUOTE_RESPONSE = JSON.stringify({
  analysisSchemaVersion: "1.0",
  metadata: {
    documentType: "Agreement",
    parties: [],
    effectiveDate: null,
    terminationDate: null,
    jurisdiction: null,
    governingLaw: null,
    financialTerms: null
  },
  executiveSummary: {
    overview: "Agreement overview with fabricated sources.",
    keyThemes: [],
    majorObligationsSummary: [],
    reviewPriorities: []
  },
  keyClauses: [
    {
      id: "clause_fake_1",
      title: "Fabricated Clause",
      category: "Liability",
      summary: "Completely invented clause.",
      importance: "critical",
      source: {
        chunkId: "chk_nonexistent_999",
        sectionId: "sec_none",
        quote: "This quote was completely fabricated by hallucinating model."
      }
    },
    {
      id: "clause_fake_2",
      title: "Real Chunk Fake Quote",
      category: "Compensation",
      summary: "Real chunk but quote is false.",
      importance: "standard",
      source: {
        chunkId: "chk_doc_test_employment_001_000",
        sectionId: "sec_01",
        quote: "Employee gets 100 million dollars bonus immediately upon signing."
      }
    }
  ],
  potentialConcerns: [],
  obligations: [],
  importantDates: [],
  analysisNotes: []
});

export const MOCK_INVALID_SCHEMA_RESPONSE = JSON.stringify({
  randomKey: "This does not adhere to the analysisSchemaVersion: 1.0 schema",
  executiveSummary: "String instead of object"
});
