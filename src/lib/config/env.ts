/**
 * Environment configuration validator and accessor.
 * Enforces strict boundary between client-safe variables and server-only secrets.
 */

export const clientEnv = {
  appName: process.env.NEXT_PUBLIC_APP_NAME || "LexiGuide AI",
  appTagline: process.env.NEXT_PUBLIC_APP_TAGLINE || "Understand. Compare. Act with confidence.",
  appUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  isDev: process.env.NODE_ENV === "development",
  isProd: process.env.NODE_ENV === "production",
} as const;

/**
 * Server-only environment variable accessor.
 * Guaranteed to never be bundled into client-side code.
 */
export function getServerSecret(key: string, fallback?: string): string {
  if (typeof window !== "undefined") {
    throw new Error(`Security Violation: Server secret "${key}" attempted to be accessed in a browser environment.`);
  }

  const value = process.env[key] || fallback;
  if (!value) {
    throw new Error(`Configuration Error: Missing required server environment variable "${key}".`);
  }

  return value;
}
