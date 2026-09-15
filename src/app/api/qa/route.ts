import { NextRequest, NextResponse } from "next/server";
import { defaultQaService } from "@/lib/ai/qa/qa-service";
import { serverDocumentStore } from "@/lib/server-document-store";
import { isLegacyDemoDocument } from "@/lib/document-storage";
import { QaRequestSchema } from "@/schemas/api-requests";
import type { NormalizedDocument } from "@/lib/document-engine/types";
import {
  quotaStore,
  getQuotaErrorMessage,
  concurrencyGuard,
  withApiSecurity,
  ApiContext,
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
async function qaHandler(request: NextRequest, context: ApiContext): Promise<NextResponse> {
  const { session, requestId, reqTag } = context;

  // 1. Parse and Validate Request Payload with Zod
  const rawBody = await request.json().catch(() => null);
  const parseResult = QaRequestSchema.safeParse(rawBody);

  if (!parseResult.success) {
    const errorIssues = parseResult.error.issues.map((i) => i.message).join(" ");
    console.warn(`[QA-DIAG]${reqTag} POST /api/qa validation failed: ${errorIssues}`);
    return NextResponse.json(
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
  }

  const { documentId, question } = parseResult.data;

  // 2. Legacy Demo Guard
  if (
    documentId === "doc-ea-2026" ||
    (rawBody?.document && typeof rawBody.document === "object" && isLegacyDemoDocument(rawBody.document as NormalizedDocument))
  ) {
    return NextResponse.json(
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
  }

  // 3. Resolve Authoritative Document with Session Verification
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
    return NextResponse.json(
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
  }

  if (!document.chunks || document.chunks.length === 0) {
    return NextResponse.json(
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
  }

  // 4. In-Flight Concurrency Guard
  const lockAcquired = concurrencyGuard.acquire(session.sessionId, "qa", documentId);
  if (!lockAcquired) {
    console.warn(`[QA-DIAG]${reqTag} In-flight duplicate Q&A rejected for docId=${documentId}`);
    return NextResponse.json(
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
  }

  try {
    // 5. Daily Quota Check (Enforced BEFORE expensive processing)
    const quota = quotaStore.checkQuota(session.sessionId, "qa", documentId);
    if (!quota.allowed) {
      const errorInfo = getQuotaErrorMessage("qa", quota.limit);
      return NextResponse.json(
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
    }

    // 6. Execute Grounded Legal Q&A Service
    const reqStart = Date.now();
    const qaResult = await defaultQaService.answerQuestion(document, question, requestId);

    // 7. Consume Daily Question Quota for this document
    quotaStore.consumeQuota(session.sessionId, "qa", documentId);

    const totalDuration = Date.now() - reqStart;
    console.log(
      `[QA-DIAG]${reqTag} POST /api/qa completed in ${totalDuration}ms (status: ${qaResult.answerStatus}, sources: ${qaResult.sources.length})`
    );

    return NextResponse.json(
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
  } finally {
    // Release in-flight lock
    concurrencyGuard.release(session.sessionId, "qa", documentId);
  }
}

export const POST = withApiSecurity("qa", qaHandler);
