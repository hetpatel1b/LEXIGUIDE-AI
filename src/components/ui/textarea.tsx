import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  errorMessage?: string;
  showCount?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      label,
      helperText,
      errorMessage,
      showCount = false,
      maxLength,
      value,
      defaultValue,
      onChange,
      id: customId,
      disabled,
      rows = 4,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const id = customId || generatedId;
    const errorId = `${id}-error`;
    const helperId = `${id}-helper`;

    const [charLength, setCharLength] = React.useState<number>(() => {
      if (typeof value === "string") return value.length;
      if (typeof defaultValue === "string") return defaultValue.length;
      return 0;
    });

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setCharLength(e.target.value.length);
      onChange?.(e);
    };

    return (
      <div className="w-full space-y-1.5 text-left">
        <div className="flex items-center justify-between">
          {label && (
            <label
              htmlFor={id}
              className="block text-xs font-semibold tracking-wide text-[var(--foreground-secondary)]"
            >
              {label}
            </label>
          )}

          {showCount && maxLength && (
            <span className="text-[11px] font-mono text-[var(--foreground-subtle)]">
              {charLength}/{maxLength}
            </span>
          )}
        </div>

        <textarea
          id={id}
          ref={ref}
          rows={rows}
          maxLength={maxLength}
          value={value}
          defaultValue={defaultValue}
          onChange={handleChange}
          disabled={disabled}
          aria-invalid={!!errorMessage}
          aria-describedby={errorMessage ? errorId : helperText ? helperId : undefined}
          className={cn(
            "w-full rounded-[var(--radius-md)] border bg-[var(--surface)] p-3 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-subtle)] outline-none transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-50 resize-y",
            errorMessage
              ? "border-[var(--danger)] focus:border-[var(--danger)] focus:ring-2 focus:ring-red-500/20"
              : "border-[var(--border-strong)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--focus-ring)]",
            className
          )}
          {...props}
        />

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

Textarea.displayName = "Textarea";
