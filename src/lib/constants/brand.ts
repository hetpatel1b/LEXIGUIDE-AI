/**
 * LexiGuide AI Official Brand Constants & Design Tokens.
 * Derived from approved brand identity specifications.
 */
export const BRAND = {
  name: "LexiGuide AI",
  shortName: "LexiGuide",
  tagline: "Understand. Compare. Act with confidence.",
  mission:
    "LexiGuide AI is a legal document intelligence and legal information assistant designed to provide clarity on legal documents, highlight obligations and risks, and guide users with confidence.",
  disclaimer:
    "LexiGuide AI provides legal information and document intelligence assistance. It is NOT an AI lawyer and does not provide formal legal advice. Always consult a qualified legal professional for binding legal counsel.",

  // Official Brand Palette
  colors: {
    primaryNavy: "#0B1F44",
    primaryBlue: "#2563EB",
    accentCyan: "#38BDF8",
    nearWhite: "#F8FAFC",
  },

  // Official Asset Paths (located in /public/brand/)
  assets: {
    logoLight: "/brand/lexiguide-logo-light.png",
    logoDark: "/brand/lexiguide-logo-dark.png",
    logoFull: "/brand/lexiguide-logo-full.png",
    icon: "/brand/lexiguide-icon.png",
    appIcon: "/brand/lexiguide-app-icon.png",
    favicon: "/brand/favicon.png",
    brandSheet: "/brand/brand-guidelines.png",
  },
} as const;

export type BrandConfig = typeof BRAND;
