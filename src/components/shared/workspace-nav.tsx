"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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

export interface WorkspaceNavProps {
  documentName?: string;
  documentType?: string;
  className?: string;
  extraRightControls?: React.ReactNode;
}

export const WORKSPACE_ROUTES = [
  {
    href: "/analyze",
    label: "Analysis",
    icon: LayoutDashboard,
    tooltip: "Comprehensive clause, risk, and obligation analysis",
  },
  {
    href: "/qa",
    label: "Ask Document",
    icon: Sparkles,
    tooltip: "Grounded Q&A assistant for this agreement",
  },
  {
    href: "/compare",
    label: "Compare",
    icon: GitCompare,
    tooltip: "Compare original and updated document revisions",
  },
  {
    href: "/action-center",
    label: "Action Center",
    icon: CheckSquare,
    tooltip: "Review items, upcoming dates, and legal follow-ups",
  },
] as const;

export function WorkspaceNav({
  documentName = "Employment_Agreement_2026.pdf",
  documentType = "Employment Agreement",
  className,
  extraRightControls,
}: WorkspaceNavProps) {
  const pathname = usePathname();

  return (
    <header
      role="banner"
      className={cn(
        "sticky top-0 z-40 w-full border-b border-[var(--border)] bg-[var(--surface)] px-3 sm:px-6 shrink-0 shadow-sm",
        className
      )}
    >
      <div className="flex h-14 items-center justify-between gap-3">
        {/* Left: Brand Identity (Light Wordmark) & Document Context */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center" title="LexiGuide Home">
            <BrandLogo variant="logo" width={114} height={38} priority />
          </div>

          <div className="h-4 w-px bg-[var(--border)] hidden lg:block" />

          {/* Contextual Document Pill */}
          <div className="hidden xl:flex items-center gap-2 px-2.5 py-1 rounded-full bg-[var(--surface-muted)] border border-[var(--border)] text-xs truncate">
            <FileText className="h-3.5 w-3.5 text-red-500 shrink-0" aria-hidden="true" />
            <span className="font-semibold text-[var(--foreground)] truncate max-w-[180px]" title={documentName}>
              {documentName}
            </span>
            <span className="h-1 w-1 rounded-full bg-[var(--foreground-muted)]" />
            <span className="text-[11px] text-[var(--foreground-muted)]">{documentType}</span>
            <Badge variant="success" size="sm" dot>
              Analyzed
            </Badge>
          </div>
        </div>

        {/* Center: Primary 4 Workspace Workflow Links */}
        <nav
          aria-label="Workspace Tools Navigation"
          className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar py-1"
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
                  "flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-medium transition-all whitespace-nowrap",
                  isActive
                    ? "bg-[var(--primary)] text-white font-semibold shadow-xs"
                    : "text-[var(--foreground-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--surface-muted)]"
                )}
              >
                <Icon className={cn("h-3.5 w-3.5 shrink-0", isActive ? "text-white" : "text-[var(--foreground-muted)]")} />
                <span>{route.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right: Extra Controls + Return Home */}
        <div className="flex items-center gap-2 shrink-0">
          {extraRightControls}

          <div className="border-l border-[var(--border)] pl-2 flex items-center">
            <Link
              href="/"
              title="Exit Workspace & Return Home"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[var(--radius-md)] text-xs text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-muted)] transition-colors"
            >
              <ArrowLeft className="h-3 w-3" />
              <span className="hidden sm:inline font-medium">Exit</span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
