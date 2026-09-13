import * as React from "react";
import { cn } from "@/lib/utils";

export interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  "aria-label": string;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      className,
      variant = "ghost",
      size = "md",
      isLoading = false,
      disabled,
      children,
      "aria-label": ariaLabel,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-all duration-150 rounded-[var(--radius-md)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer shrink-0";

    const variantStyles = {
      primary:
        "bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)] active:bg-[var(--primary-active)] focus-visible:ring-[var(--ring)] shadow-[var(--shadow-subtle)]",
      secondary:
        "bg-[var(--color-brand-navy)] text-white hover:bg-[#142952] active:bg-[#0B1F44] dark:bg-[var(--surface-raised)] dark:hover:bg-[var(--border-strong)] focus-visible:ring-[var(--ring)] shadow-[var(--shadow-subtle)]",
      outline:
        "border border-[var(--border-strong)] bg-transparent hover:bg-[var(--surface-muted)] active:bg-[var(--border)] text-[var(--foreground)] focus-visible:ring-[var(--ring)]",
      ghost:
        "bg-transparent hover:bg-[var(--surface-muted)] active:bg-[var(--border)] text-[var(--foreground-secondary)] hover:text-[var(--foreground)] focus-visible:ring-[var(--ring)]",
      destructive:
        "bg-[var(--danger)] text-white hover:bg-[#b91c1c] active:bg-[#991b1b] focus-visible:ring-[var(--danger)]",
    };

    const sizeStyles = {
      sm: "h-8 w-8 text-sm",
      md: "h-10 w-10 text-base",
      lg: "h-12 w-12 text-lg min-w-[44px] min-h-[44px]",
    };

    return (
      <button
        ref={ref}
        aria-label={ariaLabel}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        {...props}
      >
        {isLoading ? (
          <span
            aria-hidden="true"
            className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          />
        ) : (
          children
        )}
      </button>
    );
  }
);

IconButton.displayName = "IconButton";
