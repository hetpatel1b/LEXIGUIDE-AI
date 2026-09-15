"use client";

import * as React from "react";
import { X } from "lucide-react";
import { IconButton } from "@/components/ui/icon-button";
import { cn } from "@/lib/utils";
import { useFocusTrap } from "@/hooks/use-focus-trap";

export interface WorkspaceDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  side?: "left" | "right";
  children: React.ReactNode;
}

export function WorkspaceDrawer({
  isOpen,
  onClose,
  title,
  side = "left",
  children,
}: WorkspaceDrawerProps) {
  const drawerRef = React.useRef<HTMLDivElement>(null);
  
  useFocusTrap(drawerRef, isOpen);

  // Handle escape key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={drawerRef}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      tabIndex={-1}
      className="fixed inset-0 z-50 flex outline-none"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        aria-hidden="true"
      />

      {/* Slide-over Content */}
      <div
        className={cn(
          "relative z-10 w-full max-w-sm sm:max-w-md h-full bg-[var(--surface)] shadow-2xl flex flex-col transition-transform duration-200",
          side === "left" ? "mr-auto animate-in slide-in-from-left" : "ml-auto animate-in slide-in-from-right"
        )}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-3.5 px-4 border-b border-[var(--border)] bg-[var(--surface)] shrink-0">
          <h2 className="text-sm font-semibold text-[var(--foreground)] truncate">
            {title}
          </h2>

          <IconButton
            size="sm"
            variant="ghost"
            onClick={onClose}
            aria-label={`Close ${title}`}
            title="Close"
            className="text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
          >
            <X className="h-4 w-4" />
          </IconButton>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto min-h-0 flex flex-col">
          {children}
        </div>
      </div>
    </div>
  );
}
