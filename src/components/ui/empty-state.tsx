import * as React from "react";
import { FileQuestion } from "lucide-react";
import { cn } from "@/lib/utils";

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-[var(--radius-lg)] border border-dashed border-[var(--border-strong)] bg-[var(--surface-subtle)] text-[var(--foreground)]",
        className
      )}
      {...props}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--surface-muted)] text-[var(--foreground-muted)] mb-4">
        {icon || <FileQuestion className="h-6 w-6 stroke-[1.5]" aria-hidden="true" />}
      </div>

      <h4 className="text-base font-semibold tracking-tight text-[var(--foreground)] mb-1">
        {title}
      </h4>

      <p className="max-w-md text-xs sm:text-sm text-[var(--foreground-muted)] leading-relaxed mb-6">
        {description}
      </p>

      {action && <div className="inline-flex items-center">{action}</div>}
    </div>
  );
}
