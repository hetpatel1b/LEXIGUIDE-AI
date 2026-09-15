import { NextRequest, NextResponse } from "next/server";
import { compareDocuments } from "@/lib/comparison/comparison-service";
import { ComparisonEngineError } from "@/lib/comparison/errors";
import { serverDocumentStore } from "@/lib/server-document-store";
import { temporaryComparisonStore } from "@/lib/comparison/temporary-comparison-store";
import { AiEngineError, toSafeUserMessage } from "@/lib/ai/errors";
import { ComparisonRequestSchema } from "@/schemas/api-requests";
import {
  resolveAnonymousSession,
  attachSessionCookie,
  rateLimiter,
  quotaStore,
  getQuotaErrorMessage,
  validateOrigin,
} from "@/lib/security";
import { serverResultCache } from "@/lib/cache/server-result-cache";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST /api/comparison
 * Production comparison endpoint for real user documents.
 * Compares two NormalizedDocuments, detects section/clause diffs,
 * identifies potential inconsistencies, and enriches changes with Nemotron AI.
 *
 * Hardened with:
 * - Anonymous session resolution and HttpOnly cookie attachment
 * - CSRF origin validation
 * - Zod request validation & same-document protection
 * - Session-bound document authorization for Document A and temporary Document B
 * - In-flight concurrency locking
 * - Sliding-window rate limiting (3 comparisons / min)
 * - Daily quota enforcement (3 comparisons / day)
 * - Controlled, sanitized error handling
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const reqStart = Date.now();
  const headerReqId = request.headers.get("x-comparison-request-id");
  let requestId = headerReqId || `cmp_${Math.random().toString(36).substring(2, 9)}_${Date.now().toString(36)}`;
  let reqTag = `[${requestId}]`;

  console.log(`[COMP-DIAG]${reqTag} POST /api/comparison request received`);

  // 1. Origin / CSRF Validation
  const originCheck = validateOrigin(request);
  if (!originCheck.valid) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "FORBIDDEN",
          message: originCheck.reason || "Cross-origin request rejected.",
        },
        requestId,
      },
      { status: 403, headers: { "x-comparison-request-id": requestId } }
    );
  }

  // 2. Resolve Anonymous Session
  const session = resolveAnonymousSession(request);

  // 3. Parse and Validate Request Payload with Zod
  const rawBody = await request.json().catch(() => null);
  const parseResult = ComparisonRequestSchema.safeParse(rawBody);

  if (!parseResult.success) {
    const errorIssues = parseResult.error.issues.map((i) => i.message).join(" ");
    const isConflict = errorIssues.includes("Cannot compare a document to itself");
    console.warn(`[COMP-DIAG]${reqTag} POST /api/comparison validation failed: ${errorIssues}`);
    const res = NextResponse.json(
      {
        success: false,
        error: {
          code: isConflict ? "COMPARISON_CONFLICT" : "VALIDATION_ERROR",
          message: errorIssues || "Invalid comparison request payload.",
        },
        requestId,
      },
      { status: isConflict ? 409 : 400, headers: { "x-comparison-request-id": requestId } }
    );
    return attachSessionCookie(res, session.sessionId);
  }

  const { documentAId, documentBId, comparisonId, skipAi } = parseResult.data;
  if (parseResult.data.requestId && !headerReqId) {
    requestId = String(parseResult.data.requestId);
    reqTag = `[${requestId}]`;
  }

  // 4. Legacy Demo Document Protection
  if (documentAId === "doc-ea-2026" || documentBId === "doc-ea-2026") {
    const res = NextResponse.json(
      {
        success: false,
        error: {
          code: "DOCUMENT_INVALID",
          message: "Legacy demo documents are not supported for comparison.",
        },
        requestId,
      },
      { status: 400, headers: { "x-comparison-request-id": requestId } }
    );
    return attachSessionCookie(res, session.sessionId);
  }

  try {
    // 6. Sliding-Window Rate Limiting
    const rateLimit = rateLimiter.checkRateLimit(session.sessionId, "comparison");
    if (!rateLimit.allowed) {
      const res = NextResponse.json(
        {
          success: false,
          error: {
            code: "RATE_LIMITED",
            message: `Too many comparison requests. Please wait ${rateLimit.retryAfterSeconds} seconds before comparing again.`,
          },
          requestId,
        },
        {
          status: 429,
          headers: {
            "x-comparison-request-id": requestId,
            "Retry-After": String(rateLimit.retryAfterSeconds),
          },
        }
      );
      return attachSessionCookie(res, session.sessionId);
    }

    // 7. Daily Quota Check (Enforced BEFORE expensive processing)
    const quota = quotaStore.checkQuota(session.sessionId, "comparison");
    if (!quota.allowed) {
      const errorInfo = getQuotaErrorMessage("comparison", quota.limit);
      const res = NextResponse.json(
        {
          success: false,
          error: {
            code: errorInfo.code,
            message: errorInfo.message,
            suggestion: errorInfo.suggestion,
          },
          requestId,
        },
        {
          status: 429,
          headers: {
            "x-comparison-request-id": requestId,
            "Retry-After": String(quota.retryAfterSeconds),
          },
        }
      );
      return attachSessionCookie(res, session.sessionId);
    }

    // 8. Resolve Authoritative Document A & Document B with Session Scoping
    const docA = serverDocumentStore.getDocument(documentAId, session.sessionId);
    const docB =
      temporaryComparisonStore.getTemporaryDocument(documentBId, comparisonId, session.sessionId) ||
      serverDocumentStore.getDocument(documentBId, session.sessionId);

    // Verify both documents exist and are authorized
    if (!docA) {
      const res = NextResponse.json(
        {
          success: false,
          error: {
            code: "DOCUMENT_NOT_FOUND",
            message: `Document A (${documentAId}) is not available or not accessible in this session.`,
          },
          requestId,
        },
        { status: 404, headers: { "x-comparison-request-id": requestId } }
      );
      return attachSessionCookie(res, session.sessionId);
    }

    if (!docB) {
      const res = NextResponse.json(
        {
          success: false,
          error: {
            code: "DOCUMENT_NOT_FOUND",
            message: `Document B (${documentBId}) is not available, has expired, or is not accessible in this session.`,
          },
          requestId,
        },
        { status: 404, headers: { "x-comparison-request-id": requestId } }
      );
      return attachSessionCookie(res, session.sessionId);
    }

    // 9. Execute Comparison Service
    const cacheKey = `comparison:${documentAId}:${documentBId}:${skipAi}`;
    const comparisonResult = await serverResultCache.getOrCompute(cacheKey, session.sessionId, async () => {
      const res = await compareDocuments(docA, docB, {
        requestId,
        skipAi: skipAi === true,
      });
      // 10. Consume Daily Comparison Quota on Success
      quotaStore.consumeQuota(session.sessionId, "comparison");
      return res;
    });

    const totalDuration = Date.now() - reqStart;
    console.log(
      `[COMP-DIAG]${reqTag} POST /api/comparison completed in ${totalDuration}ms (changes: ${comparisonResult.changes.length}, inconsistencies: ${comparisonResult.inconsistencies.length})`
    );

    const response = NextResponse.json(
      {
        success: true,
        data: comparisonResult,
        timestamp: Date.now(),
        durationMs: totalDuration,
        requestId,
      },
      {
        status: 200,
        headers: { "x-comparison-request-id": requestId },
      }
    );

    return attachSessionCookie(response, session.sessionId);
  } catch (error: unknown) {
    const totalDuration = Date.now() - reqStart;

    if (error instanceof ComparisonEngineError) {
      console.error(
        `[COMP-DIAG]${reqTag} POST /api/comparison failed with ComparisonEngineError: code=${error.code}, status=${error.statusCode}, duration=${totalDuration}ms`
      );
      const res = NextResponse.json(
        {
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
          requestId,
        },
        {
          status: error.statusCode,
          headers: { "x-comparison-request-id": requestId },
        }
      );
      return attachSessionCookie(res, session.sessionId);
    }

    if (error instanceof AiEngineError) {
      console.error(
        `[COMP-DIAG]${reqTag} POST /api/comparison AI error: code=${error.code}, status=${error.statusCode}, duration=${totalDuration}ms`
      );
      const res = NextResponse.json(
        {
          success: false,
          error: {
            code: error.code,
            message: toSafeUserMessage(error),
          },
          requestId,
        },
        {
          status: error.statusCode,
          headers: { "x-comparison-request-id": requestId },
        }
      );
      return attachSessionCookie(res, session.sessionId);
    }

    const safeMessage = error instanceof Error ? error.message : "An unexpected error occurred during document comparison.";
    console.error(`[COMP-DIAG]${reqTag} POST /api/comparison unexpected error: ${safeMessage}`);

    const res = NextResponse.json(
      {
        success: false,
        error: {
          code: "COMPARISON_INTERNAL_ERROR",
          message: safeMessage,
        },
        requestId,
      },
      {
        status: 500,
        headers: { "x-comparison-request-id": requestId },
      }
    );
    return attachSessionCookie(res, session.sessionId);
  }
}

/**
 * DELETE /api/comparison
 * Purges ephemeral comparison-scoped documents on explicit user action
 * ("New Document to Compare" / "Replace Document").
 * Preserves anonymous user identity, Document A, and daily quotas.
 */
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const originCheck = validateOrigin(request);
  if (!originCheck.valid) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "FORBIDDEN",
          message: originCheck.reason || "Cross-origin request rejected.",
        },
      },
      { status: 403 }
    );
  }

  const session = resolveAnonymousSession(request);
  let comparisonId: string | undefined;
  let documentBId: string | undefined;

  try {
    const body = await request.json().catch(() => null);
    if (body) {
      if (typeof body.comparisonId === "string") comparisonId = body.comparisonId;
      if (typeof body.documentBId === "string") documentBId = body.documentBId;
    }
  } catch {}

  if (!comparisonId && request.nextUrl.searchParams.has("comparisonId")) {
    comparisonId = request.nextUrl.searchParams.get("comparisonId") || undefined;
  }
  if (!documentBId && request.nextUrl.searchParams.has("documentBId")) {
    documentBId = request.nextUrl.searchParams.get("documentBId") || undefined;
  }

  let clearedCount = 0;
  if (comparisonId) {
    clearedCount += temporaryComparisonStore.clearComparison(comparisonId, session.sessionId);
  }
  if (documentBId) {
    const removed = temporaryComparisonStore.removeTemporaryDocument(documentBId, session.sessionId);
    if (removed) clearedCount++;
  }
  if (!comparisonId && !documentBId) {
    clearedCount = temporaryComparisonStore.clearSession(session.sessionId);
  }

  console.log(
    `[TEMP-COMP-STORE] Cleared comparison data for session ${session.sessionId} (compId: ${comparisonId || "all"}, docB: ${documentBId || "all"}, count: ${clearedCount})`
  );

  const response = NextResponse.json({
    success: true,
    message: "Ephemeral comparison records cleared.",
    data: { clearedCount },
    timestamp: new Date().toISOString(),
  });

  return attachSessionCookie(response, session.sessionId);
}

