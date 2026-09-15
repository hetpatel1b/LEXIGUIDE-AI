import { NextRequest, NextResponse } from "next/server";
import { analyzeDocument } from "@/lib/ai/analysis/analysis-service";
import { serverDocumentStore } from "@/lib/server-document-store";
import { isLegacyDemoDocument } from "@/lib/document-storage";
import { AnalysisRequestSchema } from "@/schemas/api-requests";
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
 * POST /api/analysis
 * Accepts document reference, validates session authorization,
 * enforces server-side rate limits & daily quotas, prevents in-flight duplicate requests,
 * processes through NVIDIA Nemotron 3 Super 120B with bounded context, and returns
 * verified AnalysisResult.
 */
async function analysisHandler(request: NextRequest, context: ApiContext): Promise<NextResponse> {
  const { session, requestId, reqTag } = context;

  // 1. Parse and Validate Request Payload with Zod
  const rawBody = await request.json().catch(() => null);
  const parseResult = AnalysisRequestSchema.safeParse(rawBody);

  if (!parseResult.success) {
    const errorIssues = parseResult.error.issues.map((i) => i.message).join(" ");
    console.warn(`[AI-DIAG]${reqTag} POST /api/analysis validation failed: ${errorIssues}`);
    return NextResponse.json(
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
  }

  const validData = parseResult.data;

  // 2. Resolve and Authorize Document
  const docId = validData.documentId || validData.document?.id || "";

  // Reject legacy demo fixtures in production
  if (docId === "doc-ea-2026") {
    return NextResponse.json(
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
    return NextResponse.json(
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
  }

  if (!document.chunks || document.chunks.length === 0) {
    return NextResponse.json(
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
  }

  // 3. In-Flight Concurrency Guard (Prevent duplicate clicks / parallel analysis for same doc)
  const lockAcquired = concurrencyGuard.acquire(session.sessionId, "analysis", docId);
  if (!lockAcquired) {
    console.warn(`[AI-DIAG]${reqTag} In-flight duplicate request rejected for docId=${docId}`);
    return NextResponse.json(
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
  }

  try {
    // 4. Daily Quota Check (Enforced BEFORE expensive NVIDIA call)
    const quota = quotaStore.checkQuota(session.sessionId, "analysis");
    if (!quota.allowed) {
      const errorInfo = getQuotaErrorMessage("analysis", quota.limit);
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
            "x-analysis-request-id": requestId,
            "Retry-After": String(quota.retryAfterSeconds),
          },
        }
      );
    }

    console.log(
      `[AI-DIAG]${reqTag} Analyzing document id=${document.id}, title=${document.displayName}, chunks=${document.chunks.length}`
    );

    // 5. Execute Analysis Service with NVIDIA Nemotron
    const reqStart = Date.now();
    const result = await analyzeDocument(document, undefined, requestId);

    // 6. Consume Daily Analysis Quota on Success
    quotaStore.consumeQuota(session.sessionId, "analysis");

    const totalDuration = Date.now() - reqStart;
    console.log(
      `[AI-DIAG]${reqTag} POST /api/analysis completed successfully in ${totalDuration}ms`
    );

    return NextResponse.json(
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
  } finally {
    // Release in-flight concurrency lock
    concurrencyGuard.release(session.sessionId, "analysis", docId);
  }
}

export const POST = withApiSecurity("analysis", analysisHandler);
