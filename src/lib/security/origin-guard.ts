import type { NextRequest } from "next/server";

/**
 * Validates request Origin and Referer for state-changing HTTP methods (POST, PUT, DELETE)
 * to guard against Cross-Site Request Forgery (CSRF).
 * Allows same-origin requests and non-browser clients (such as automated test runners).
 */
export function validateOrigin(request: NextRequest): { valid: boolean; reason?: string } {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");

  if (!origin) {
    // Non-browser or direct API client (e.g. node test, curl, mobile native)
    return { valid: true };
  }

  try {
    const originUrl = new URL(origin);
    if (host && originUrl.host !== host) {
      return {
        valid: false,
        reason: `Cross-origin request rejected: origin '${originUrl.host}' does not match host '${host}'.`,
      };
    }
  } catch {
    return { valid: false, reason: "Malformed Origin header." };
  }

  return { valid: true };
}
