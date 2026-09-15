import { NextRequest, NextResponse } from "next/server";
import { processDocument, DocumentEngineError } from "@/lib/document-engine";
import { temporaryComparisonStore } from "@/lib/comparison/temporary-comparison-store";
import {
  resolveAnonymousSession,
  attachSessionCookie,
  rateLimiter,
  quotaStore,
  getQuotaErrorMessage,
  validateOrigin,
} from "@/lib/security";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Dedicated comparison document upload endpoint.
 * Accepts multipart/form-data with a single comparison document (Document B).
 * Processes through the canonical document engine and stores it strictly in the
 * ephemeral temporaryComparisonStore with TTL and session ownership scoping.
 *
 * Hardened with:
 * - Anonymous session resolution and HttpOnly cookie attachment
 * - CSRF origin validation
 * - Sliding-window rate limiting (5 uploads / min)
 * - Daily upload quota enforcement (5 uploads / day)
 * - Session and comparisonId scoping (never accessible to other sessions)
 * - Controlled, sanitized error handling
 */
export async function POST(request: NextRequest) {
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
        timestamp: new Date().toISOString(),
      },
      { status: 403 }
    );
  }

  // 2. Resolve Anonymous Session
  const session = resolveAnonymousSession(request);

  // 3. Sliding-Window Rate Limit Check
  const rateLimit = rateLimiter.checkRateLimit(session.sessionId, "upload");
  if (!rateLimit.allowed) {
    const res = NextResponse.json(
      {
        success: false,
        error: {
          code: "RATE_LIMITED",
          message: `Too many upload requests. Please wait ${rateLimit.retryAfterSeconds} seconds before uploading another document.`,
          suggestion: "Please wait a moment before retrying.",
        },
        timestamp: new Date().toISOString(),
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimit.retryAfterSeconds),
        },
      }
    );
    return attachSessionCookie(res, session.sessionId);
  }

  // 4. Daily Upload Quota Check
  const quota = quotaStore.checkQuota(session.sessionId, "upload");
  if (!quota.allowed) {
    const errorInfo = getQuotaErrorMessage("upload", quota.limit);
    const res = NextResponse.json(
      {
        success: false,
        error: {
          code: errorInfo.code,
          message: errorInfo.message,
          suggestion: errorInfo.suggestion,
        },
        timestamp: new Date().toISOString(),
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(quota.retryAfterSeconds),
        },
      }
    );
    return attachSessionCookie(res, session.sessionId);
  }

  try {
    const contentType = request.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      const res = NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid content-type. Expected multipart/form-data.",
            suggestion: "Please upload your comparison document as a multipart form data file.",
          },
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
      return attachSessionCookie(res, session.sessionId);
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const comparisonIdHeader = request.headers.get("x-comparison-id");
    const comparisonIdBody = formData.get("comparisonId");
    const existingComparisonId =
      (typeof comparisonIdBody === "string" && comparisonIdBody.trim()) ||
      (typeof comparisonIdHeader === "string" && comparisonIdHeader.trim()) ||
      undefined;

    if (!file || !(file instanceof Blob)) {
      const res = NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "No document file was provided in the request.",
            suggestion: "Please select a PDF, DOCX, or TXT document to compare.",
          },
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
      return attachSessionCookie(res, session.sessionId);
    }

    const filename = file instanceof File ? file.name : "document";
    const mimeType = file.type || undefined;

    // Convert file to Node Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Process through the canonical document engine pipeline
    const normalizedDocument = await processDocument(buffer, filename, mimeType);

    // Register strictly in the temporary comparison store with TTL and session ownership
    const compId = temporaryComparisonStore.registerTemporaryDocument(
      normalizedDocument,
      existingComparisonId,
      undefined,
      session.sessionId
    );

    // Authoritative Quota Consumption
    quotaStore.consumeQuota(session.sessionId, "upload");

    const response = NextResponse.json(
      {
        success: true,
        data: normalizedDocument,
        comparisonId: compId,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );

    return attachSessionCookie(response, session.sessionId);
  } catch (error: unknown) {
    if (error instanceof DocumentEngineError) {
      const res = NextResponse.json(error.toResponse(), { status: error.statusCode });
      return attachSessionCookie(res, session.sessionId);
    }

    const res = NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred while processing the comparison document.",
          suggestion: "Please verify your document is valid and try again.",
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
    return attachSessionCookie(res, session.sessionId);
  }
}
