/**
 * Centralized security and quota configuration for LexiGuide AI.
 * Enforces server-side resource limits, daily quotas, rate-limiting windows,
 * and bounded AI context limits.
 */

export const QUOTA_CONFIG = {
  // Daily allowances per anonymous user session
  analysesPerDay: 10,
  uploadsPerDay: 5,
  comparisonsPerDay: 3,
  questionsPerDocumentPerDay: 20,

  // Document file & page constraints
  maxFileSizeMB: 25,
  maxFileSizeBytes: 25 * 1024 * 1024,
  maxPages: 150,

  // Question & prompt text bounds
  maxQuestionLength: 1000,
  maxDocumentTextChars: 500_000,

  // Bounded AI context limits
  maxAnalysisContextChars: 20_000, // ~5,000 tokens coverage-aware context
  maxComparisonClauses: 12, // Maximum changed clauses sent to comparison AI
  maxQaRetrievedChunks: 8, // Maximum chunks sent to grounded Q&A prompt
} as const;

export const RATE_LIMIT_CONFIG = {
  // Sliding 60-second window burst limits
  analysisPerMinute: 3,
  uploadPerMinute: 5,
  qaPerMinute: 10,
  comparisonPerMinute: 3,
  windowMs: 60 * 1000,
} as const;

export const SESSION_CONFIG = {
  cookieName: "lexiguide_anon_id",
  cookieMaxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
  sessionTtlMs: 30 * 24 * 60 * 60 * 1000,
  inFlightLockTtlMs: 120 * 1000, // 2 minutes auto-expiration
} as const;
