import test from "node:test";
import assert from "node:assert";
import { NextRequest, NextResponse } from "next/server";
import { resolveAnonymousSession, attachSessionCookie } from "@/lib/security/anonymous-session";
import { SESSION_CONFIG } from "@/lib/security/quota-config";

test("Anonymous Identity - generates cryptographically valid UUID when no session exists", () => {
  const req = new NextRequest("http://localhost:3000/api/documents/process", {
    method: "POST",
  });

  const session = resolveAnonymousSession(req);

  assert.strictEqual(session.isNew, true);
  assert.ok(session.sessionId, "Session ID should be generated");
  assert.match(
    session.sessionId,
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    "Session ID must be a valid UUID"
  );
});

test("Anonymous Identity - preserves existing session from HttpOnly cookie", () => {
  const validUuid = "12345678-1234-4234-8234-1234567890ab";
  const req = new NextRequest("http://localhost:3000/api/documents/process", {
    method: "POST",
    headers: {
      cookie: `${SESSION_CONFIG.cookieName}=${validUuid}`,
    },
  });

  const session = resolveAnonymousSession(req);

  assert.strictEqual(session.isNew, false);
  assert.strictEqual(session.sessionId, validUuid);
});

test("Anonymous Identity - rejects malformed or forge-attempted session cookies and issues fresh ID", () => {
  const badCookies = [
    "admin",
    "../../etc/passwd",
    "12345",
    "Bearer eyJhbGciOiJIUzI1NiJ9",
    "<script>alert(1)</script>",
    "not-a-valid-uuid",
  ];

  for (const badCookie of badCookies) {
    const req = new NextRequest("http://localhost:3000/api/documents/process", {
      method: "POST",
      headers: {
        cookie: `${SESSION_CONFIG.cookieName}=${badCookie}`,
      },
    });

    const session = resolveAnonymousSession(req);

    assert.strictEqual(session.isNew, true);
    assert.notStrictEqual(session.sessionId, badCookie);
    assert.match(
      session.sessionId,
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
  }
});

test("Anonymous Identity - attaches secure cookie with HttpOnly, SameSite=Lax, and MaxAge", () => {
  const sessionId = "a1b2c3d4-e5f6-4a1b-9c2d-e3f4a5b6c7d8";
  const response = NextResponse.json({ success: true });

  const modifiedResponse = attachSessionCookie(response, sessionId);
  const cookie = modifiedResponse.cookies.get(SESSION_CONFIG.cookieName);

  assert.ok(cookie, "Cookie must be set on response");
  assert.strictEqual(cookie.value, sessionId);
  assert.strictEqual(cookie.httpOnly, true);
  assert.strictEqual(cookie.sameSite, "lax");
  assert.strictEqual(cookie.path, "/");
  assert.strictEqual(cookie.maxAge, SESSION_CONFIG.cookieMaxAgeSeconds);
});
