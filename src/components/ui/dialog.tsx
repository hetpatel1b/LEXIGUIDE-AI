"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { IconButton } from "./icon-button";

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function Dialog({
  isOpen,
  onClose,
  title,
  description,
  children,
  className,
}: DialogProps) {
  const titleId = React.useId();
  const descId = React.useId();

  // Escape key handling
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? titleId : undefined}
      aria-describedby={description ? descId : undefined}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm transition-opacity"
      />

      {/* Dialog Surface */}
      <div
        className={cn(
          "relative w-full max-w-lg rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-raised)] text-[var(--foreground)] z-10 space-y-4 animate-in fade-in-0 zoom-in-95 duration-150",
          className
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1 text-left">
            {title && (
              <h2 id={titleId} className="text-lg font-semibold tracking-tight text-[var(--foreground)]">
                {title}
              </h2>
            )}
            {description && (
              <p id={descId} className="text-xs sm:text-sm text-[var(--foreground-muted)] leading-relaxed">
                {description}
              </p>
            )}
          </div>

          <IconButton
            size="sm"
            variant="ghost"
            aria-label="Close dialog"
            onClick={onClose}
            className="-mr-2 -mt-2 text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
          >
            <X className="h-4 w-4" />
          </IconButton>
        </div>

        <div className="text-left text-sm">{children}</div>
      </div>
    </div>
  );
}

export function DialogFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 pt-4 border-t border-[var(--border-muted)] mt-6",
        className
      )}
      {...props}
    />
  );
}
