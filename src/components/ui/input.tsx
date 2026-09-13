import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  errorMessage?: string;
  successMessage?: string;
  state?: "default" | "error" | "success";
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = "text",
      label,
      helperText,
      errorMessage,
      successMessage,
      state = "default",
      leftIcon,
      rightIcon,
      id: customId,
      disabled,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const id = customId || generatedId;
    const errorId = `${id}-error`;
    const helperId = `${id}-helper`;

    const effectiveState = errorMessage ? "error" : successMessage ? "success" : state;

    const stateStyles = {
      default:
        "border-[var(--border-strong)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--focus-ring)]",
      error:
        "border-[var(--danger)] focus:border-[var(--danger)] focus:ring-2 focus:ring-red-500/20 text-[var(--danger)]",
      success:
        "border-[var(--success)] focus:border-[var(--success)] focus:ring-2 focus:ring-emerald-500/20",
    };

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label
            htmlFor={id}
            className="block text-xs font-semibold tracking-wide text-[var(--foreground-secondary)]"
          >
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          {leftIcon && (
            <div className="pointer-events-none absolute left-3 flex items-center text-[var(--foreground-muted)]">
              {leftIcon}
            </div>
          )}

          <input
            id={id}
            ref={ref}
            type={type}
            disabled={disabled}
            aria-invalid={effectiveState === "error"}
            aria-describedby={
              errorMessage ? errorId : helperText || successMessage ? helperId : undefined
            }
            className={cn(
              "w-full rounded-[var(--radius-md)] border bg-[var(--surface)] px-3.5 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-subtle)] outline-none transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-50 h-10",
              leftIcon && "pl-9",
              rightIcon && "pr-9",
              stateStyles[effectiveState],
              className
            )}
            {...props}
          />

          {rightIcon && (
            <div className="pointer-events-none absolute right-3 flex items-center text-[var(--foreground-muted)]">
              {rightIcon}
            </div>
          )}
        </div>

        {errorMessage && (
          <p id={errorId} className="text-xs text-[var(--danger)] font-medium flex items-center gap-1">
            <span aria-hidden="true">&bull;</span> {errorMessage}
          </p>
        )}

        {!errorMessage && successMessage && (
          <p id={helperId} className="text-xs text-[var(--success-foreground)] font-medium flex items-center gap-1">
            <span aria-hidden="true">&bull;</span> {successMessage}
          </p>
        )}

        {!errorMessage && !successMessage && helperText && (
          <p id={helperId} className="text-xs text-[var(--foreground-muted)]">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
