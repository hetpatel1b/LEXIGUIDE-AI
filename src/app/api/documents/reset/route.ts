import { NextRequest, NextResponse } from "next/server";
import { serverDocumentStore } from "@/lib/server-document-store";
import { temporaryComparisonStore } from "@/lib/comparison/temporary-comparison-store";
import {
  resolveAnonymousSession,
  attachSessionCookie,
  validateOrigin,
} from "@/lib/security";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Endpoint to completely reset the active document workspace for the current session.
 *
 * Requirements:
 * - Purges all active and session-registered documents from serverDocumentStore.
 * - Purges any temporary comparison documents from temporaryComparisonStore.
 * - Leaves the anonymous user identity (UUID and HttpOnly cookie) intact.
 * - Leaves daily quotas and rate-limit counters strictly unchanged (NOT a logout or quota reset).
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

  // 2. Resolve Anonymous Session (Strictly preserved, NOT regenerated)
  const session = resolveAnonymousSession(request);

  // 3. Clear all session documents and active workspace pointers from server stores
  const removedDocs = serverDocumentStore.clearSession(session.sessionId);
  const removedComparisonDocs = temporaryComparisonStore.clearSession(session.sessionId);

  console.log(
    `[WORKSPACE-RESET] Session ${session.sessionId} workspace cleared: ${removedDocs} doc(s), ${removedComparisonDocs} comparison doc(s). Quotas preserved.`
  );

  const response = NextResponse.json(
    {
      success: true,
      message: "Current document workspace has been completely reset.",
      data: {
        activeDocument: null,
        clearedDocuments: removedDocs + removedComparisonDocs,
      },
      timestamp: new Date().toISOString(),
    },
    { status: 200 }
  );

  // 4. Attach session cookie to preserve anonymous identity
  return attachSessionCookie(response, session.sessionId);
}
