import { NextRequest, NextResponse } from "next/server";
import {
  resolveAnonymousSession,
  attachSessionCookie,
  rateLimiter,
  validateOrigin,
  AnonymousSession
} from "./index";
import { AiEngineError, toSafeUserMessage } from "@/lib/ai/errors";

export interface ApiContext {
  session: AnonymousSession;
  requestId: string;
  reqTag: string;
}

export type ApiHandlerFunction = (
  request: NextRequest,
  context: ApiContext
) => Promise<NextResponse>;

/**
 * Higher-order wrapper for API route handlers that enforces LexiGuide security standards:
 * - CSRF / Origin Validation
 * - Anonymous Session Resolution
 * - Sliding-Window Rate Limiting
 * - Structured Error Handling (AiEngineError)
 * - Session Cookie Attachment
 * 
 * Note: Quota checking and concurrency locks are domain-specific and must be 
 * handled within the wrapped handler using the provided `ApiContext`.
 */
export function withApiSecurity(
  featureName: "qa" | "analysis" | "comparison",
  handler: ApiHandlerFunction
) {
  return async function (request: NextRequest): Promise<NextResponse> {
    const reqStart = Date.now();
    const headerReqId = request.headers.get(`x-${featureName}-request-id`);
    const requestId = headerReqId || `${featureName.substring(0,3)}_${Math.random().toString(36).substring(2, 9)}_${Date.now().toString(36)}`;
    const reqTag = `[${requestId}]`;

    console.log(`[API-DIAG]${reqTag} POST /api/${featureName} request received at T+0ms`);

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
        { status: 403, headers: { [`x-${featureName}-request-id`]: requestId } }
      );
    }

    // 2. Resolve Anonymous Session
    const session = resolveAnonymousSession(request);

    try {
      // 3. Sliding-Window Rate Limiting
      const rateLimit = rateLimiter.checkRateLimit(session.sessionId, featureName);
      if (!rateLimit.allowed) {
        const res = NextResponse.json(
          {
            success: false,
            error: {
              code: "RATE_LIMITED",
              message: `Too many requests. Please wait ${rateLimit.retryAfterSeconds} seconds before trying again.`,
            },
            requestId,
          },
          {
            status: 429,
            headers: {
              [`x-${featureName}-request-id`]: requestId,
              "Retry-After": String(rateLimit.retryAfterSeconds),
            },
          }
        );
        return attachSessionCookie(res, session.sessionId);
      }

      // 4. Run the specific handler
      const response = await handler(request, { session, requestId, reqTag });
      
      // The handler returns a NextResponse, which we ensure has the session cookie attached
      return attachSessionCookie(response, session.sessionId);

    } catch (error: unknown) {
      const totalDuration = Date.now() - reqStart;
      
      if (error instanceof AiEngineError) {
        console.error(
          `[API-DIAG]${reqTag} POST /api/${featureName} failed with AiEngineError: code=${error.code}, status=${error.statusCode}, duration=${totalDuration}ms`
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
            headers: { [`x-${featureName}-request-id`]: requestId },
          }
        );
        return attachSessionCookie(res, session.sessionId);
      }

      const safeMessage = toSafeUserMessage(error);
      console.error(
        `[API-DIAG]${reqTag} POST /api/${featureName} unexpected error after ${totalDuration}ms: ${safeMessage}`
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
          headers: { [`x-${featureName}-request-id`]: requestId },
        }
      );
      return attachSessionCookie(res, session.sessionId);
    }
  };
}
