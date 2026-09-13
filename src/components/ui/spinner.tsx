import * as React from "react";
import { cn } from "@/lib/utils";

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg";
  label?: string;
}

export function Spinner({
  size = "md",
  label = "Loading...",
  className,
  ...props
}: SpinnerProps) {
  const sizeStyles = {
    sm: "h-4 w-4 border-2",
    md: "h-6 w-6 border-2",
    lg: "h-9 w-9 border-3",
  };

  return (
    <div
      role="status"
      aria-label={label}
      className={cn("inline-flex items-center justify-center", className)}
      {...props}
    >
      <span
        aria-hidden="true"
        className={cn(
          "animate-spin rounded-full border-[var(--border-strong)] border-t-[var(--primary)]",
          sizeStyles[size]
        )}
      />
      <span className="sr-only">{label}</span>
    </div>
  );
}
