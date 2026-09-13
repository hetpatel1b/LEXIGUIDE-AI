import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helperText?: string;
  errorMessage?: string;
  options?: SelectOption[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      label,
      helperText,
      errorMessage,
      options,
      children,
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
          <select
            id={id}
            ref={ref}
            disabled={disabled}
            aria-invalid={!!errorMessage}
            aria-describedby={errorMessage ? errorId : helperText ? helperId : undefined}
            className={cn(
              "w-full appearance-none rounded-[var(--radius-md)] border bg-[var(--surface)] px-3.5 py-2 pr-10 text-sm text-[var(--foreground)] outline-none transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-50 h-10 cursor-pointer",
              errorMessage
                ? "border-[var(--danger)] focus:border-[var(--danger)] focus:ring-2 focus:ring-red-500/20"
                : "border-[var(--border-strong)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--focus-ring)]",
              className
            )}
            {...props}
          >
            {options
              ? options.map((opt) => (
                  <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                    {opt.label}
                  </option>
                ))
              : children}
          </select>

          <div className="pointer-events-none absolute right-3 flex items-center text-[var(--foreground-muted)]">
            <ChevronDown className="h-4 w-4" aria-hidden="true" />
          </div>
        </div>

        {errorMessage && (
          <p id={errorId} className="text-xs text-[var(--danger)] font-medium flex items-center gap-1">
            <span aria-hidden="true">&bull;</span> {errorMessage}
          </p>
        )}

        {!errorMessage && helperText && (
          <p id={helperId} className="text-xs text-[var(--foreground-muted)]">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";
