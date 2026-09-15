import crypto from "node:crypto";
import type { NextRequest, NextResponse } from "next/server";
import { SESSION_CONFIG } from "./quota-config";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface AnonymousSession {
  sessionId: string;
  isNew: boolean;
}

/**
 * Resolves or establishes an opaque, server-controlled anonymous session identity.
 * Strictly anonymous: does not track IP, email, or user-provided identifiers.
 * Prevents enumeration and user-forged session hijacking.
 */
export function resolveAnonymousSession(request: NextRequest): AnonymousSession {
  // 1. Check HttpOnly cookie
  const cookieValue = request.cookies.get(SESSION_CONFIG.cookieName)?.value?.trim();
  if (cookieValue && UUID_REGEX.test(cookieValue)) {
    return {
      sessionId: cookieValue.toLowerCase(),
      isNew: false,
    };
  }

  // 2. Check x-anonymous-session-id header (for automated testing or direct API clients)
  const headerValue = request.headers.get("x-anonymous-session-id")?.trim();
  if (headerValue && UUID_REGEX.test(headerValue)) {
    return {
      sessionId: headerValue.toLowerCase(),
      isNew: false,
    };
  }

  // 3. Mint fresh cryptographic UUID
  const newSessionId = crypto.randomUUID().toLowerCase();
  return {
    sessionId: newSessionId,
    isNew: true,
  };
}

/**
 * Attaches the anonymous session cookie to the outgoing NextResponse if it is new
 * or needs renewal.
 */
export function attachSessionCookie(response: NextResponse, sessionId: string): NextResponse {
  if (!sessionId || !UUID_REGEX.test(sessionId)) {
    return response;
  }

  const isProd = process.env.NODE_ENV === "production";

  response.cookies.set({
    name: SESSION_CONFIG.cookieName,
    value: sessionId,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: isProd,
    maxAge: SESSION_CONFIG.cookieMaxAgeSeconds,
  });

  response.headers.set("x-anonymous-session-id", sessionId);

  return response;
}
