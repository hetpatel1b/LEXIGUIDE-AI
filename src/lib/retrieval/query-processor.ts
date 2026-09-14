/**
 * Query preprocessing, normalization, legal synonym expansion,
 * and section reference detection for LexiGuide AI.
 */

const STOP_WORDS = new Set([
  "a",
  "an",
  "the",
  "and",
  "or",
  "but",
  "in",
  "on",
  "at",
  "to",
  "for",
  "with",
  "by",
  "from",
  "of",
  "about",
  "is",
  "are",
  "was",
  "were",
  "be",
  "been",
  "being",
  "have",
  "has",
  "had",
  "do",
  "does",
  "did",
  "can",
  "could",
  "shall",
  "should",
  "will",
  "would",
  "may",
  "might",
  "must",
  "what",
  "when",
  "where",
  "who",
  "whom",
  "which",
  "why",
  "how",
  "this",
  "that",
  "these",
  "those",
  "it",
  "its",
  "they",
  "them",
  "their",
  "there",
  "i",
  "me",
  "my",
  "you",
  "your",
  "we",
  "our",
  "contract",
  "agreement",
  "document",
  "clause",
  "provision",
  "say",
  "says",
  "state",
  "states",
  "tell",
]);

const NUMBER_WORD_PAIRS: Array<[RegExp, string]> = [
  [/\btwenty[- ]four\b/gi, "24"],
  [/\btwenty[- ]four\s*\(\s*24\s*\)/gi, "24"],
  [/\b24\b/g, "twenty-four"],
  [/\bthirty\b/gi, "30"],
  [/\b30\b/g, "thirty"],
  [/\btwelve\b/gi, "12"],
  [/\b12\b/g, "twelve"],
  [/\bfive\b/gi, "5"],
  [/\b5\b/g, "five"],
  [/\bsixty\b/gi, "60"],
  [/\b60\b/g, "sixty"],
  [/\bninety\b/gi, "90"],
  [/\b90\b/g, "ninety"],
  [/\bone\b/gi, "1"],
];

/**
 * Deterministic legal synonym clusters.
 * If a query term matches any item in a cluster, all related cluster terms
 * are added to query expansion candidates.
 */
const LEGAL_SYNONYM_CLUSTERS: string[][] = [
  // Termination & Notice
  [
    "termination",
    "terminate",
    "terminating",
    "terminated",
    "end",
    "ending",
    "ends",
    "dismissal",
    "resignation",
    "resigns",
    "notice",
    "notice period",
    "days notice",
    "days' notice",
  ],
  // Compensation & Pay
  [
    "salary",
    "base salary",
    "compensation",
    "remuneration",
    "fee",
    "fees",
    "payment",
    "pay",
    "bonus",
    "signing bonus",
    "retention award",
    "retention",
    "allowance",
    "per annum",
    "inr",
  ],
  // Confidentiality & Non-disclosure
  [
    "confidential",
    "confidentiality",
    "non-disclosure",
    "nondisclosure",
    "nda",
    "trade secret",
    "trade secrets",
    "proprietary",
    "proprietary information",
  ],
  // Intellectual Property
  [
    "intellectual property",
    "ip",
    "invention",
    "inventions",
    "work product",
    "works for hire",
    "copyright",
    "copyrights",
    "patent",
    "patents",
    "ownership",
    "moral rights",
  ],
  // Dispute Resolution, Arbitration & Governing Law
  [
    "arbitration",
    "arbitrator",
    "seat",
    "arbitral seat",
    "seat of arbitration",
    "dispute",
    "dispute resolution",
    "governing law",
    "jurisdiction",
    "venue",
    "mumbai",
    "laws of india",
  ],
  // Restrictive Covenants & Non-Compete
  [
    "non-compete",
    "non compete",
    "non competition",
    "competitive restriction",
    "competition",
    "compete",
    "restrictive covenant",
    "restraint",
    "solicitation",
    "non-solicit",
    "solicit",
  ],
  // Security Incidents
  [
    "security incident",
    "incident",
    "data breach",
    "breach",
    "reporting",
    "reported",
    "24 hours",
    "twenty-four hours",
  ],
  // Conflicts of Interest
  [
    "conflict of interest",
    "conflicts",
    "disclose",
    "disclosure",
    "disclosed",
    "5 business days",
    "five business days",
  ],
  // Term & Effective Date
  [
    "effective date",
    "commencement date",
    "commence",
    "term",
    "start date",
    "duration",
    "expiration",
    "validity",
  ],
  // Obligations & Post-Termination Duties
  [
    "obligation",
    "obligations",
    "duty",
    "duties",
    "return of property",
    "post-termination",
    "after termination",
    "covenants",
  ],
];

export type QuestionQuality = "specific" | "vague" | "empty";

const VAGUE_PHRASES = [
  "what about this document",
  "what about this",
  "what about the document",
  "tell me about this document",
  "tell me about this contract",
  "tell me about this",
  "what is this document",
  "what is this contract",
  "what is this",
  "explain this document",
  "explain this contract",
  "explain this",
  "explain",
  "overview",
  "summary",
  "summarize",
  "summarize this document",
  "what does this say",
  "what does this document say",
  "what is in this document",
  "give me an overview",
  "help",
  "help me",
];

const GENERIC_INQUIRY_WORDS = new Set([
  "explain",
  "overview",
  "summary",
  "summarize",
  "details",
  "info",
  "information",
  "help",
  "understand",
  "review",
  "look",
  "check",
  "general",
  "anything",
  "everything",
  "something",
  "please",
  "thanks",
  "thank",
]);

/**
 * Deterministically classifies question quality into:
 * - "empty": No question or whitespace only
 * - "vague": Broad or generic phrasing without legal/clause terms
 * - "specific": Factual inquiry targeting terms, dates, amounts, duties, or sections
 */
export function classifyQuestionQuality(query: string): QuestionQuality {
  const trimmed = (query || "").trim();
  if (!trimmed) {
    return "empty";
  }

  const norm = normalizeQueryString(trimmed);
  if (!norm) {
    return "empty";
  }

  // Check explicit vague phrases
  if (VAGUE_PHRASES.includes(norm)) {
    return "vague";
  }

  // Check section target: if an explicit section is referenced (e.g. "Section 8"), it is specific
  const sectionTarget = detectSectionTarget(trimmed);
  if (sectionTarget) {
    return "specific";
  }

  const processed = processQuery(trimmed);

  // If there are zero non-stopword tokens, it is vague
  if (processed.tokens.length === 0) {
    return "vague";
  }

  // If all tokens are generic inquiry words, it is vague
  const nonGenericTokens = processed.tokens.filter((t) => !GENERIC_INQUIRY_WORDS.has(t));
  if (nonGenericTokens.length === 0) {
    return "vague";
  }

  return "specific";
}

export interface ProcessedQuery {
  raw: string;
  normalized: string;
  tokens: string[];
  phrases: string[];
  expandedTerms: string[];
  detectedSectionTarget: string | null;
}

/**
 * Normalizes query string: trims, lowercases, removes excess whitespace,
 * cleans edge punctuation while preserving hyphens and currency symbols.
 */
export function normalizeQueryString(query: string): string {
  if (!query) return "";
  return query
    .toLowerCase()
    .replace(/["'“”‘’]/g, "") // Remove quotation marks
    .replace(/[^\w\s\-.,/₹]/g, " ") // Keep alphanumeric, hyphens, periods, currency
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Detects explicit section/clause/schedule references in the query.
 * Examples: "Section 8", "Section 8.2", "Schedule F", "Clause 4", "termination clause".
 */
export function detectSectionTarget(query: string): string | null {
  const norm = query.toLowerCase();

  // Explicit numbered patterns: "section 8", "section 8.2", "clause 4"
  const secMatch = norm.match(/\b(?:section|sec\.|clause|article)\s*([0-9]+(?:\.[0-9]+)?)\b/i);
  if (secMatch) {
    return `Section ${secMatch[1]}`;
  }

  // Schedule references: "schedule a", "schedule b", "schedule f"
  const schedMatch = norm.match(/\bschedule\s*([a-z0-9]+)\b/i);
  if (schedMatch) {
    return `Schedule ${schedMatch[1].toUpperCase()}`;
  }

  // Named clause references
  const namedMatch = norm.match(
    /\b(termination|confidentiality|intellectual property|compensation|restrictive covenants?|dispute resolution|governing law|indemnity|severability)\s+(?:clause|section|provision)\b/i
  );
  if (namedMatch) {
    return namedMatch[1];
  }

  return null;
}

/**
 * Extracts high-value multi-word phrases (2-4 words) from the query
 * to enable exact multi-word boost.
 */
export function extractQueryPhrases(query: string): string[] {
  const norm = normalizeQueryString(query);
  const words = norm.split(/\s+/).filter((w) => w.length > 0);
  const phrases: string[] = [];

  // Bigrams and Trigrams
  for (let i = 0; i < words.length - 1; i++) {
    const bigram = `${words[i]} ${words[i + 1]}`;
    if (!STOP_WORDS.has(words[i]) || !STOP_WORDS.has(words[i + 1])) {
      phrases.push(bigram);
    }

    if (i < words.length - 2) {
      const trigram = `${words[i]} ${words[i + 1]} ${words[i + 2]}`;
      phrases.push(trigram);
    }
  }

  return Array.from(new Set(phrases));
}

/**
 * Performs full query processing: normalization, tokenization, number expansion,
 * legal synonym expansion, and section reference detection.
 */
export function processQuery(query: string): ProcessedQuery {
  const normalized = normalizeQueryString(query);
  const rawTokens = normalized
    .split(/\s+/)
    .map((t) => t.replace(/^[.,/]+|[.,/]+$/g, ""))
    .filter((t) => t.length > 1);

  // Filter out stop words for core tokens
  const coreTokens = rawTokens.filter((t) => !STOP_WORDS.has(t));

  const phrases = extractQueryPhrases(normalized);
  const detectedSectionTarget = detectSectionTarget(query);

  const expansionSet = new Set<string>();

  // Add all core tokens
  for (const token of coreTokens) {
    expansionSet.add(token);
  }

  // Add phrases
  for (const phrase of phrases) {
    expansionSet.add(phrase);
  }

  // Add number-word expansions
  for (const [regex, replacement] of NUMBER_WORD_PAIRS) {
    if (regex.test(normalized)) {
      expansionSet.add(replacement.toLowerCase());
    }
  }

  // Add legal synonym expansions
  for (const cluster of LEGAL_SYNONYM_CLUSTERS) {
    const matchesCluster = cluster.some(
      (term) =>
        coreTokens.includes(term) ||
        normalized.includes(term) ||
        phrases.some((p) => p === term)
    );

    if (matchesCluster) {
      for (const synonym of cluster) {
        expansionSet.add(synonym);
      }
    }
  }

  return {
    raw: query,
    normalized,
    tokens: coreTokens,
    phrases,
    expandedTerms: Array.from(expansionSet),
    detectedSectionTarget,
  };
}
