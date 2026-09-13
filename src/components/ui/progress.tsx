import * as React from "react";
import { cn } from "@/lib/utils";

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number; // 0 to 100
  isIndeterminate?: boolean;
  label?: string;
  size?: "sm" | "md";
}

export function Progress({
  value = 0,
  isIndeterminate = false,
  label,
  size = "md",
  className,
  ...props
}: ProgressProps) {
  const clampedValue = Math.min(100, Math.max(0, value));

  const heightStyles = {
    sm: "h-1.5",
    md: "h-2.5",
  };

  return (
    <div className={cn("w-full space-y-1.5", className)} {...props}>
      {label && (
        <div className="flex justify-between text-xs font-medium text-[var(--foreground-muted)]">
          <span>{label}</span>
          {!isIndeterminate && <span className="font-mono">{clampedValue}%</span>}
        </div>
      )}

      <div
        role="progressbar"
        aria-valuenow={isIndeterminate ? undefined : clampedValue}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label || "Processing progress"}
        className={cn(
          "w-full overflow-hidden rounded-[var(--radius-full)] bg-[var(--surface-muted)] border border-[var(--border-muted)]",
          heightStyles[size]
        )}
      >
        {isIndeterminate ? (
          <div className="h-full w-1/3 animate-[indeterminate_1.5s_infinite_linear] rounded-[var(--radius-full)] bg-gradient-to-r from-[var(--color-brand-blue)] to-[var(--color-brand-accent)]" />
        ) : (
          <div
            className="h-full rounded-[var(--radius-full)] bg-[var(--primary)] transition-all duration-300 ease-out"
            style={{ width: `${clampedValue}%` }}
          />
        )}
      </div>
    </div>
  );
}
