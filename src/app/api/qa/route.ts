import { NextRequest, NextResponse } from "next/server";
import { defaultQaService } from "@/lib/ai/qa/qa-service";
import { serverDocumentStore } from "@/lib/server-document-store";
import { isLegacyDemoDocument } from "@/lib/document-storage";
import { AiEngineError, toSafeUserMessage } from "@/lib/ai/errors";
import { QaRequestSchema } from "@/schemas/api-requests";
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
 * POST /api/qa
 * Grounded legal Q&A endpoint.
 * Retrieves targeted evidence from the active document and invokes
 * NVIDIA Nemotron 3 Super 120B with source verification.
 *
 * Hardened with:
 * - Anonymous session resolution and HttpOnly cookie attachment
 * - CSRF origin validation
 * - Zod request validation (trimmed question <= 1000 chars, valid documentId)
 * - Session-bound document authorization
 * - In-flight concurrency locking per document
 * - Sliding-window rate limiting (10 queries / min)
 * - Daily quota per document (20 questions / doc / day)
 * - Grounded source verification and safe error responses
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const reqStart = Date.now();
  const headerReqId = request.headers.get("x-qa-request-id");
  let requestId = headerReqId || `qa_${Math.random().toString(36).substring(2, 9)}_${Date.now().toString(36)}`;
  let reqTag = `[${requestId}]`;

  console.log(`[QA-DIAG]${reqTag} POST /api/qa request received`);

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
      { status: 403, headers: { "x-qa-request-id": requestId } }
    );
  }

  // 2. Resolve Anonymous Session
  const session = resolveAnonymousSession(request);

  // 3. Parse and Validate Request Payload with Zod
  const rawBody = await request.json().catch(() => null);
  const parseResult = QaRequestSchema.safeParse(rawBody);

  if (!parseResult.success) {
    const errorIssues = parseResult.error.issues.map((i) => i.message).join(" ");
    console.warn(`[QA-DIAG]${reqTag} POST /api/qa validation failed: ${errorIssues}`);
    const res = NextResponse.json(
      {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: errorIssues || "Invalid Q&A request payload.",
        },
        requestId,
      },
      { status: 400, headers: { "x-qa-request-id": requestId } }
    );
    return attachSessionCookie(res, session.sessionId);
  }

  const { documentId, question } = parseResult.data;
  if (parseResult.data.requestId && !headerReqId) {
    requestId = String(parseResult.data.requestId);
    reqTag = `[${requestId}]`;
  }

  // 4. Legacy Demo Guard
  if (
    documentId === "doc-ea-2026" ||
    (rawBody?.document && typeof rawBody.document === "object" && isLegacyDemoDocument(rawBody.document as NormalizedDocument))
  ) {
    const res = NextResponse.json(
      {
        success: false,
        error: {
          code: "DOCUMENT_INVALID",
          message: "Legacy demo documents are not supported for Q&A.",
        },
        requestId,
      },
      { status: 400, headers: { "x-qa-request-id": requestId } }
    );
    return attachSessionCookie(res, session.sessionId);
  }

  // 5. Resolve Authoritative Document with Session Verification
  let document = serverDocumentStore.getDocument(documentId, session.sessionId);

  // Fallback: If server restarted and document is provided in request body
  if (!document && rawBody?.document && typeof rawBody.document === "object") {
    const candidateDoc = rawBody.document as NormalizedDocument;
    if (candidateDoc.id === documentId && !isLegacyDemoDocument(candidateDoc)) {
      serverDocumentStore.registerDocument(candidateDoc, session.sessionId);
      document = candidateDoc;
    }
  }

  if (!document) {
    console.warn(`[QA-DIAG]${reqTag} Document not found or unauthorized for docId=${documentId} and session=${session.sessionId}`);
    const res = NextResponse.json(
      {
        success: false,
        error: {
          code: "DOCUMENT_NOT_FOUND",
          message: "The requested document was not found or is not accessible in this session.",
        },
        requestId,
      },
      { status: 404, headers: { "x-qa-request-id": requestId } }
    );
    return attachSessionCookie(res, session.sessionId);
  }

  if (!document.chunks || document.chunks.length === 0) {
    const res = NextResponse.json(
      {
        success: false,
        error: {
          code: "EMPTY_DOCUMENT",
          message: "The document contains no readable text chunks to answer questions.",
        },
        requestId,
      },
      { status: 422, headers: { "x-qa-request-id": requestId } }
    );
    return attachSessionCookie(res, session.sessionId);
  }

  // 6. In-Flight Concurrency Guard
  const lockAcquired = concurrencyGuard.acquire(session.sessionId, "qa", documentId);
  if (!lockAcquired) {
    console.warn(`[QA-DIAG]${reqTag} In-flight duplicate Q&A rejected for docId=${documentId}`);
    const res = NextResponse.json(
      {
        success: false,
        error: {
          code: "REQUEST_IN_PROGRESS",
          message: "A question is already being processed for this document. Please wait for it to complete.",
        },
        requestId,
      },
      { status: 429, headers: { "x-qa-request-id": requestId } }
    );
    return attachSessionCookie(res, session.sessionId);
  }

  try {
    // 7. Sliding-Window Rate Limiting
    const rateLimit = rateLimiter.checkRateLimit(session.sessionId, "qa");
    if (!rateLimit.allowed) {
      const res = NextResponse.json(
        {
          success: false,
          error: {
            code: "RATE_LIMITED",
            message: `Too many Q&A queries. Please wait ${rateLimit.retryAfterSeconds} seconds before asking another question.`,
          },
          requestId,
        },
        {
          status: 429,
          headers: {
            "x-qa-request-id": requestId,
            "Retry-After": String(rateLimit.retryAfterSeconds),
          },
        }
      );
      return attachSessionCookie(res, session.sessionId);
    }

    // 8. Daily Quota Check (Enforced BEFORE expensive processing)
    const quota = quotaStore.checkQuota(session.sessionId, "qa", documentId);
    if (!quota.allowed) {
      const errorInfo = getQuotaErrorMessage("qa", quota.limit);
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
            "x-qa-request-id": requestId,
            "Retry-After": String(quota.retryAfterSeconds),
          },
        }
      );
      return attachSessionCookie(res, session.sessionId);
    }

    // 9. Execute Grounded Legal Q&A Service
    const qaResult = await defaultQaService.answerQuestion(document, question, requestId);

    // 10. Consume Daily Question Quota for this document
    quotaStore.consumeQuota(session.sessionId, "qa", documentId);

    const totalDuration = Date.now() - reqStart;
    console.log(
      `[QA-DIAG]${reqTag} POST /api/qa completed in ${totalDuration}ms (status: ${qaResult.answerStatus}, sources: ${qaResult.sources.length})`
    );

    const response = NextResponse.json(
      {
        success: true,
        data: qaResult,
        timestamp: Date.now(),
        durationMs: totalDuration,
        requestId,
      },
      {
        status: 200,
        headers: { "x-qa-request-id": requestId },
      }
    );

    return attachSessionCookie(response, session.sessionId);
  } catch (error: unknown) {
    const totalDuration = Date.now() - reqStart;

    if (error instanceof AiEngineError) {
      console.error(
        `[QA-DIAG]${reqTag} POST /api/qa failed with AiEngineError: code=${error.code}, status=${error.statusCode}, duration=${totalDuration}ms`
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
          headers: { "x-qa-request-id": requestId },
        }
      );
      return attachSessionCookie(res, session.sessionId);
    }

    const safeMessage = toSafeUserMessage(error);
    console.error(
      `[QA-DIAG]${reqTag} POST /api/qa unexpected error after ${totalDuration}ms: ${safeMessage}`
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
        headers: { "x-qa-request-id": requestId },
      }
    );
    return attachSessionCookie(res, session.sessionId);
  } finally {
    // Release in-flight lock
    concurrencyGuard.release(session.sessionId, "qa", documentId);
  }
}
