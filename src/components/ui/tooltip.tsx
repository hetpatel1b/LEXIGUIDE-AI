"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactElement;
  position?: "top" | "bottom" | "left" | "right";
  className?: string;
}

export function Tooltip({
  content,
  children,
  position = "top",
  className,
}: TooltipProps) {
  const [isVisible, setIsVisible] = React.useState(false);
  const tooltipId = React.useId();

  const positionStyles = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  const trigger = React.cloneElement(children as React.ReactElement<React.HTMLAttributes<HTMLElement>>, {
    onMouseEnter: () => setIsVisible(true),
    onMouseLeave: () => setIsVisible(false),
    onFocus: () => setIsVisible(true),
    onBlur: () => setIsVisible(false),
    "aria-describedby": isVisible ? tooltipId : undefined,
  });

  return (
    <div className="relative inline-flex">
      {trigger}
      {isVisible && (
        <div
          id={tooltipId}
          role="tooltip"
          className={cn(
            "pointer-events-none absolute z-50 rounded-[var(--radius-sm)] bg-slate-900 px-2.5 py-1 text-[11px] font-medium text-slate-100 shadow-[var(--shadow-md)] whitespace-nowrap transition-opacity animate-in fade-in-0 duration-100 border border-slate-700/50",
            positionStyles[position],
            className
          )}
        >
          {content}
        </div>
      )}
    </div>
  );
}
