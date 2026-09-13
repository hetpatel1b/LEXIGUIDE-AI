import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "neutral" | "brand" | "info" | "warning" | "danger" | "success";
  size?: "sm" | "md";
  dot?: boolean;
}

export function Badge({
  className,
  variant = "brand",
  size = "md",
  dot = false,
  children,
  ...props
}: BadgeProps) {
  const variantStyles = {
    neutral:
      "bg-[var(--surface-muted)] text-[var(--foreground-secondary)] border-[var(--border)]",
    brand:
      "bg-blue-50 text-[var(--primary)] border-blue-200",
    info:
      "bg-[var(--info-subtle)] text-[var(--info-foreground)] border-sky-200",
    warning:
      "bg-[var(--warning-subtle)] text-[var(--warning-foreground)] border-amber-200",
    danger:
      "bg-[var(--danger-subtle)] text-[var(--danger-foreground)] border-red-200",
    success:
      "bg-[var(--success-subtle)] text-[var(--success-foreground)] border-emerald-200",
  };

  const dotStyles = {
    neutral: "bg-slate-400",
    brand: "bg-[var(--primary)]",
    info: "bg-sky-500",
    warning: "bg-amber-500",
    danger: "bg-red-500",
    success: "bg-emerald-500",
  };

  const sizeStyles = {
    sm: "text-[11px] px-2 py-0.5 gap-1",
    md: "text-xs px-2.5 py-0.5 gap-1.5",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[var(--radius-full)] border font-medium tracking-wide transition-colors select-none",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn("h-1.5 w-1.5 rounded-full shrink-0", dotStyles[variant])}
          aria-hidden="true"
        />
      )}
      <span>{children}</span>
    </span>
  );
}
