import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppHeader, AppFooter } from "@/components/layout";
import { BRAND } from "@/lib/constants";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const viewport: Viewport = {
  themeColor: "#0B1F44",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: {
    default: `${BRAND.name} — ${BRAND.tagline}`,
    template: `%s | ${BRAND.name}`,
  },
  description:
    "LexiGuide AI is a legal document intelligence and legal information assistant. Understand legal documents, identify key clauses, detect risks, compare agreements, and take actionable next steps with clarity.",
  applicationName: BRAND.name,
  keywords: [
    "Legal Document Intelligence",
    "Contract Analysis",
    "Document Comparison",
    "Legal Information Assistant",
    "Risk Detection",
    "LexiGuide AI",
  ],
  authors: [{ name: "LexiGuide AI Engineering" }],
  icons: {
    icon: [
      { url: BRAND.assets.appIcon, sizes: "192x192", type: "image/png" },
      { url: BRAND.assets.appIcon, type: "image/png" },
    ],
    apple: [{ url: BRAND.assets.appIcon, sizes: "180x180" }],
    shortcut: BRAND.assets.appIcon,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    title: `${BRAND.name} — ${BRAND.tagline}`,
    description:
      "Understand. Compare. Act with confidence. A legal document intelligence and information assistant.",
    siteName: BRAND.name,
    images: [
      {
        url: BRAND.assets.logoLight,
        width: 800,
        height: 267,
        alt: `${BRAND.name} Brand Identity`,
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen flex flex-col font-sans bg-[var(--background)] text-[var(--foreground)] selection:bg-blue-100">
        {/* Accessible Skip Link */}
        <nav aria-label="Skip links">
          <a
            href="#main-content"
            className="sr-only sr-only-focusable z-50 p-3 bg-[var(--color-brand-blue)] text-white font-medium rounded-b-md shadow-lg"
          >
            Skip to main content
          </a>
        </nav>

        {/* Global Application Shell Header */}
        <AppHeader />

        {/* Main Application Content */}
        <main id="main-content" className="flex-1 flex flex-col">
          {children}
        </main>

        {/* Global Application Shell Footer */}
        <AppFooter />
      </body>
    </html>
  );
}
