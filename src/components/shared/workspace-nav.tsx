"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Sparkles,
  GitCompare,
  CheckSquare,
  ArrowLeft,
  FileText,
} from "lucide-react";
import { BrandLogo } from "./brand-logo";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { resetDocumentWorkspace } from "@/lib/document-storage";

export interface WorkspaceNavProps {
  documentName?: string | null;
  documentType?: string | null;
  status?: "analyzed" | "analyzing" | "uploaded" | "none";
  className?: string;
  extraRightControls?: React.ReactNode;
}

export const WORKSPACE_ROUTES = [
  {
    href: "/analyze",
    label: "Analysis",
    shortLabel: "Analysis",
    icon: LayoutDashboard,
    tooltip: "Comprehensive clause, risk, and obligation analysis",
  },
  {
    href: "/qa",
    label: "Ask Document",
    shortLabel: "Ask",
    icon: Sparkles,
    tooltip: "Grounded Q&A assistant for this agreement",
  },
  {
    href: "/compare",
    label: "Compare",
    shortLabel: "Compare",
    icon: GitCompare,
    tooltip: "Compare original and updated document revisions",
  },
  {
    href: "/action-center",
    label: "Action Center",
    shortLabel: "Actions",
    icon: CheckSquare,
    tooltip: "Review items, upcoming dates, and legal follow-ups",
  },
] as const;

export function WorkspaceNav({
  documentName,
  documentType,
  status = "analyzed",
  className,
  extraRightControls,
}: WorkspaceNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isExiting, setIsExiting] = React.useState(false);

  const handleExit = React.useCallback(
    async (e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
      e.preventDefault();
      if (isExiting) return;
      setIsExiting(true);

      // 1. Immediately reset client-side document workspace
      resetDocumentWorkspace();

      // 2. Fire server-side workspace reset (keepalive guarantees delivery during navigation)
      try {
        if (typeof fetch === "function") {
          fetch("/api/documents/reset", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            keepalive: true,
          }).catch((err) => {
            console.warn("Failed to notify server of workspace reset:", err);
          });
        }
      } catch (err) {
        console.warn("Failed to trigger server workspace reset:", err);
      }

      // 3. Navigate cleanly to home using replace so history does not trap the user
      if (typeof window !== "undefined") {
        window.location.replace("/");
      } else {
        router.replace("/");
      }
    },
    [isExiting, router]
  );

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full border-b border-[var(--border)] bg-[var(--surface)] px-2.5 sm:px-6 shrink-0 shadow-sm",
        className
      )}
    >
      <h2 className="sr-only">
        {documentName ? `Document Workspace for ${documentName}` : "Document Workspace"}
      </h2>
      <div className="flex h-14 items-center justify-between gap-2 sm:gap-3">
        {/* Left: Brand Identity (Light Wordmark) & Document Context */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <div className="flex items-center" title="LexiGuide Home">
            <BrandLogo
              variant="logo"
              width={114}
              height={38}
              priority
              className="w-[82px] xs:w-[96px] sm:w-[114px] h-auto shrink-0"
            />
          </div>

          {documentName && (
            <>
              <div className="h-4 w-px bg-[var(--border)] hidden lg:block" />

              {/* Contextual Document Pill (Only rendered when a real document exists) */}
              <div className="hidden xl:flex items-center gap-2 px-2.5 py-1 rounded-full bg-[var(--surface-muted)] border border-[var(--border)] text-xs truncate">
                <FileText className="h-3.5 w-3.5 text-red-500 shrink-0" aria-hidden="true" />
                <span className="font-semibold text-[var(--foreground)] truncate max-w-[180px]" title={documentName}>
                  {documentName}
                </span>
                {documentType && (
                  <>
                    <span className="h-1 w-1 rounded-full bg-[var(--foreground-muted)]" />
                    <span className="text-[11px] text-[var(--foreground-muted)]">{documentType}</span>
                  </>
                )}
                {status === "analyzed" ? (
                  <Badge variant="success" size="sm" dot>
                    Analyzed
                  </Badge>
                ) : status === "analyzing" ? (
                  <Badge variant="brand" size="sm" dot>
                    Analyzing…
                  </Badge>
                ) : (
                  <Badge variant="neutral" size="sm">
                    Ready to Analyze
                  </Badge>
                )}
              </div>
            </>
          )}
        </div>

        {/* Right: Workspace Navigation Tools + Extra Controls + Exit */}
        <div className="flex items-center gap-1 sm:gap-3 min-w-0 flex-1 justify-end">
          <nav
            aria-label="Workspace Tools Navigation"
            className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar py-1 min-w-0"
          >
            {WORKSPACE_ROUTES.map((route) => {
              const isActive = pathname === route.href || (route.href === "/analyze" && pathname.startsWith("/analyze"));
              const Icon = route.icon;

              return (
                <Link
                  key={route.href}
                  href={route.href}
                  title={route.tooltip}
                  className={cn(
                    "flex items-center gap-1 sm:gap-1.5 px-1.5 xs:px-2.5 sm:px-3 py-1.5 rounded-[var(--radius-md)] text-[11px] xs:text-xs font-medium transition-all whitespace-nowrap shrink-0",
                    isActive
                      ? "bg-[var(--primary)] text-white font-semibold shadow-xs"
                      : "text-[var(--foreground-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--surface-muted)]"
                  )}
                >
                  <Icon className={cn("h-3 w-3 xs:h-3.5 xs:w-3.5 shrink-0", isActive ? "text-white" : "text-[var(--foreground-muted)]")} />
                  <span>
                    <span className="inline md:hidden">{route.shortLabel}</span>
                    <span className="hidden md:inline">{route.label}</span>
                  </span>
                </Link>
              );
            })}
          </nav>

          {extraRightControls}

          <div className="border-l border-[var(--border)] pl-1.5 sm:pl-2.5 flex items-center shrink-0">
            <button
              type="button"
              onClick={handleExit}
              disabled={isExiting}
              title="Exit Current Document Workspace & Return to Upload"
              aria-label="Exit Current Document Workspace & Return to Upload"
              className="inline-flex items-center justify-center p-1.5 sm:px-2.5 sm:py-1 rounded-[var(--radius-md)] text-xs text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-muted)] transition-colors min-h-[36px] min-w-[36px] sm:min-h-0 sm:min-w-0 disabled:opacity-50 cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span className="hidden sm:inline font-medium ml-1">Exit</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
