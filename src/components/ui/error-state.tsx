import * as React from "react";
import { AlertCircle, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

export interface ErrorStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  onRetry?: () => void;
  action?: React.ReactNode;
}

export function ErrorState({
  title = "Unable to complete request",
  description = "An unexpected error occurred while processing this information. Please try again.",
  onRetry,
  action,
  className,
  ...props
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center p-6 sm:p-10 text-center rounded-[var(--radius-lg)] border border-[var(--danger)]/30 bg-[var(--danger-subtle)] text-[var(--foreground)]",
        className
      )}
      {...props}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-[var(--danger)] mb-4">
        <AlertCircle className="h-6 w-6 stroke-[1.75]" aria-hidden="true" />
      </div>

      <h4 className="text-base font-semibold tracking-tight text-[var(--foreground)] mb-1">
        {title}
      </h4>

      <p className="max-w-md text-xs sm:text-sm text-[var(--foreground-muted)] leading-relaxed mb-6">
        {description}
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 w-full sm:w-auto">
        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
            className="w-full sm:w-auto justify-center"
          >
            Try Again
          </Button>
        )}
        {action}
      </div>
    </div>
  );
}
