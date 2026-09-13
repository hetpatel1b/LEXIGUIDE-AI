"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, Menu, X } from "lucide-react";
import { BrandLogo } from "@/components/shared";
import { Button } from "@/components/ui";

export function AppHeader() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const toggleButtonRef = React.useRef<HTMLButtonElement>(null);

  const isWorkspaceRoute =
    pathname?.startsWith("/analyze") ||
    pathname?.startsWith("/compare") ||
    pathname?.startsWith("/qa") ||
    pathname?.startsWith("/action-center");

  // Adjust mobile menu state during render if pathname changes
  const [prevPathname, setPrevPathname] = React.useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setMobileMenuOpen(false);
  }

  // Lock body scroll and handle Escape key when mobile menu is open
  React.useEffect(() => {
    if (!mobileMenuOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileMenuOpen(false);
        toggleButtonRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileMenuOpen]);

  if (isWorkspaceRoute) {
    return null;
  }

  const closeMenu = () => setMobileMenuOpen(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Brand Identity (Light Wordmark) */}
        <div className="flex items-center gap-3">
          <BrandLogo variant="logo" width={144} height={48} priority />
        </div>

        {/* Center / Right: Desktop Navigation + Primary CTA */}
        <div className="hidden md:flex items-center gap-6">
          <nav aria-label="Main Navigation" className="flex items-center gap-6">
            <Link
              href="#capabilities"
              className="text-sm font-medium text-[var(--foreground-secondary)] hover:text-[var(--primary)] transition-colors py-2"
            >
              Capabilities
            </Link>
            <Link
              href="#how-it-works"
              className="text-sm font-medium text-[var(--foreground-secondary)] hover:text-[var(--primary)] transition-colors py-2"
            >
              How It Works
            </Link>
            <Link
              href="#safety"
              className="text-sm font-medium text-[var(--foreground-secondary)] hover:text-[var(--primary)] transition-colors py-2"
            >
              Safety &amp; Trust
            </Link>
          </nav>

          <Button
            href="#upload-section"
            variant="primary"
            size="sm"
            rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
            className="shadow-[var(--shadow-subtle)] text-sm"
          >
            Analyze a Document
          </Button>
        </div>

        {/* Mobile: Hamburger / Close Toggle Button (<= 767px) */}
        <div className="flex items-center md:hidden">
          <button
            ref={toggleButtonRef}
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-nav-menu"
            aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            className="flex h-11 w-11 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] hover:bg-[var(--surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] transition-colors"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Accessible Mobile Menu Overlay (<= 767px) */}
      {mobileMenuOpen && (
        <div
          id="mobile-nav-menu"
          ref={menuRef}
          role="dialog"
          aria-modal="true"
          aria-label="Mobile Navigation"
          className="fixed inset-x-0 top-16 bottom-0 z-50 bg-[var(--surface)]/98 backdrop-blur-lg border-t border-[var(--border)] p-6 flex flex-col justify-between overflow-y-auto md:hidden"
        >
          <nav aria-label="Mobile Menu Links" className="space-y-2">
            <Link
              href="#capabilities"
              onClick={closeMenu}
              className="flex items-center min-h-[44px] px-3 py-2.5 rounded-[var(--radius-md)] text-base font-semibold text-[var(--foreground)] hover:bg-[var(--surface-muted)] hover:text-[var(--primary)] transition-colors"
            >
              Capabilities
            </Link>
            <Link
              href="#how-it-works"
              onClick={closeMenu}
              className="flex items-center min-h-[44px] px-3 py-2.5 rounded-[var(--radius-md)] text-base font-semibold text-[var(--foreground)] hover:bg-[var(--surface-muted)] hover:text-[var(--primary)] transition-colors"
            >
              How It Works
            </Link>
            <Link
              href="#safety"
              onClick={closeMenu}
              className="flex items-center min-h-[44px] px-3 py-2.5 rounded-[var(--radius-md)] text-base font-semibold text-[var(--foreground)] hover:bg-[var(--surface-muted)] hover:text-[var(--primary)] transition-colors"
            >
              Safety &amp; Trust
            </Link>
          </nav>

          <div className="pt-6 border-t border-[var(--border-muted)] space-y-3">
            <Button
              href="#upload-section"
              variant="primary"
              size="lg"
              onClick={closeMenu}
              rightIcon={<ArrowRight className="h-4 w-4" />}
              className="w-full min-h-[48px] justify-center shadow-[var(--shadow-md)]"
            >
              Analyze a Document
            </Button>
            <p className="text-[11px] text-center text-[var(--foreground-muted)]">
              Confidential &bull; Legal information &bull; Not an AI lawyer
            </p>
          </div>
        </div>
      )}
    </header>
  );
}

