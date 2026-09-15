import { NextRequest, NextResponse } from "next/server";
import { analyzeDocument } from "@/lib/ai/analysis/analysis-service";
import { AiEngineError, toSafeUserMessage } from "@/lib/ai/errors";
import { serverDocumentStore } from "@/lib/server-document-store";
import { isLegacyDemoDocument } from "@/lib/document-storage";
import { AnalysisRequestSchema } from "@/schemas/api-requests";
import type { NormalizedDocument } from "@/lib/document-engine/types";
import {
  resolveAnonymousSession,
  attachSessionCookie,
  rateLimiter,
  quotaStore,
  getQuotaErrorMessage,
  concurrencyGuard,
  validateOrigin,
} from "@/lib/security";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST /api/analysis
 * Accepts document reference, validates session authorization,
 * enforces server-side rate limits & daily quotas, prevents in-flight duplicate requests,
 * processes through NVIDIA Nemotron 3 Super 120B with bounded context, and returns
 * verified AnalysisResult.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const reqStart = Date.now();
  const headerReqId = request.headers.get("x-analysis-request-id");
  let requestId = headerReqId || `ana_${Math.random().toString(36).substring(2, 9)}_${Date.now().toString(36)}`;
  let reqTag = `[${requestId}]`;

  console.log(`[AI-DIAG]${reqTag} POST /api/analysis request received at T+0ms`);

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
      { status: 403, headers: { "x-analysis-request-id": requestId } }
    );
  }

  // 2. Resolve Anonymous Session
  const session = resolveAnonymousSession(request);

  // 3. Parse and Validate Request Payload with Zod
  const rawBody = await request.json().catch(() => null);
  const parseResult = AnalysisRequestSchema.safeParse(rawBody);

  if (!parseResult.success) {
    const errorIssues = parseResult.error.issues.map((i) => i.message).join(" ");
    console.warn(`[AI-DIAG]${reqTag} POST /api/analysis validation failed: ${errorIssues}`);
    const res = NextResponse.json(
      {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: errorIssues || "Invalid analysis request payload.",
        },
        requestId,
      },
      { status: 400, headers: { "x-analysis-request-id": requestId } }
    );
    return attachSessionCookie(res, session.sessionId);
  }

  const validData = parseResult.data;
  if (validData.requestId && !headerReqId) {
    requestId = String(validData.requestId);
    reqTag = `[${requestId}]`;
  }

  // 4. Resolve and Authorize Document
  const docId = validData.documentId || validData.document?.id || "";

  // Reject legacy demo fixtures in production
  if (docId === "doc-ea-2026") {
    const res = NextResponse.json(
      {
        success: false,
        error: {
          code: "DOCUMENT_INVALID",
          message: "Legacy demo documents cannot be analyzed in production.",
        },
        requestId,
      },
      { status: 400, headers: { "x-analysis-request-id": requestId } }
    );
    return attachSessionCookie(res, session.sessionId);
  }

  // Authoritative server resolution with session verification
  let document = serverDocumentStore.getDocument(docId, session.sessionId);

  // Fallback: hydration if server restarted and full valid document was supplied
  if (!document && validData.document) {
    const candidate = validData.document as unknown as NormalizedDocument;
    serverDocumentStore.registerDocument(candidate, session.sessionId);
    document = candidate;
  }

  if (!document) {
    console.warn(`[AI-DIAG]${reqTag} Document not found or unauthorized: ${docId} for session ${session.sessionId}`);
    const res = NextResponse.json(
      {
        success: false,
        error: {
          code: "DOCUMENT_NOT_FOUND",
          message: "The requested document was not found or is not accessible in this session.",
        },
        requestId,
      },
      { status: 404, headers: { "x-analysis-request-id": requestId } }
    );
    return attachSessionCookie(res, session.sessionId);
  }

  if (!document.chunks || document.chunks.length === 0) {
    const res = NextResponse.json(
      {
        success: false,
        error: {
          code: "EMPTY_DOCUMENT",
          message: "The document contains no readable text chunks to analyze.",
        },
        requestId,
      },
      { status: 422, headers: { "x-analysis-request-id": requestId } }
    );
    return attachSessionCookie(res, session.sessionId);
  }

  // 5. In-Flight Concurrency Guard (Prevent duplicate clicks / parallel analysis for same doc)
  const lockAcquired = concurrencyGuard.acquire(session.sessionId, "analysis", docId);
  if (!lockAcquired) {
    console.warn(`[AI-DIAG]${reqTag} In-flight duplicate request rejected for docId=${docId}`);
    const res = NextResponse.json(
      {
        success: false,
        error: {
          code: "REQUEST_IN_PROGRESS",
          message: "An analysis request is already in progress for this document. Please wait for it to complete.",
        },
        requestId,
      },
      { status: 429, headers: { "x-analysis-request-id": requestId } }
    );
    return attachSessionCookie(res, session.sessionId);
  }

  try {
    // 6. Sliding-Window Rate Limiting
    const rateLimit = rateLimiter.checkRateLimit(session.sessionId, "analysis");
    if (!rateLimit.allowed) {
      const res = NextResponse.json(
        {
          success: false,
          error: {
            code: "RATE_LIMITED",
            message: `Too many analysis requests. Please wait ${rateLimit.retryAfterSeconds} seconds before requesting another analysis.`,
          },
          requestId,
        },
        {
          status: 429,
          headers: {
            "x-analysis-request-id": requestId,
            "Retry-After": String(rateLimit.retryAfterSeconds),
          },
        }
      );
      return attachSessionCookie(res, session.sessionId);
    }

    // 7. Daily Quota Check (Enforced BEFORE expensive NVIDIA call)
    const quota = quotaStore.checkQuota(session.sessionId, "analysis");
    if (!quota.allowed) {
      const errorInfo = getQuotaErrorMessage("analysis", quota.limit);
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
            "x-analysis-request-id": requestId,
            "Retry-After": String(quota.retryAfterSeconds),
          },
        }
      );
      return attachSessionCookie(res, session.sessionId);
    }

    console.log(
      `[AI-DIAG]${reqTag} Analyzing document id=${document.id}, title=${document.displayName}, chunks=${document.chunks.length}`
    );

    // 8. Execute Analysis Service with NVIDIA Nemotron
    const result = await analyzeDocument(document, undefined, requestId);

    // 9. Consume Daily Analysis Quota on Success
    quotaStore.consumeQuota(session.sessionId, "analysis");

    const totalDuration = Date.now() - reqStart;
    console.log(
      `[AI-DIAG]${reqTag} POST /api/analysis completed successfully in ${totalDuration}ms`
    );

    const response = NextResponse.json(
      {
        success: true,
        data: result,
        timestamp: Date.now(),
        durationMs: totalDuration,
        requestId,
      },
      {
        status: 200,
        headers: { "x-analysis-request-id": requestId },
      }
    );

    return attachSessionCookie(response, session.sessionId);
  } catch (error: unknown) {
    const totalDuration = Date.now() - reqStart;

    if (error instanceof AiEngineError) {
      console.error(
        `[AI-DIAG]${reqTag} POST /api/analysis failed with AiEngineError: code=${error.code}, status=${error.statusCode}, duration=${totalDuration}ms`
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
          headers: { "x-analysis-request-id": requestId },
        }
      );
      return attachSessionCookie(res, session.sessionId);
    }

    const safeMessage = toSafeUserMessage(error);
    console.error(
      `[AI-DIAG]${reqTag} POST /api/analysis unexpected error after ${totalDuration}ms: ${safeMessage}`
    );
    const res = NextResponse.json(
      {
        success: false,
        error: {
          code: "AI_UNKNOWN_ERROR",
          message: safeMessage,
        },
        requestId,
      },
      {
        status: 500,
        headers: { "x-analysis-request-id": requestId },
      }
    );
    return attachSessionCookie(res, session.sessionId);
  } finally {
    // Release in-flight concurrency lock
    concurrencyGuard.release(session.sessionId, "analysis", docId);
  }
}
