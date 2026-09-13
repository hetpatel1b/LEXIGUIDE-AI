import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive" | "link";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-all duration-150 rounded-[var(--radius-md)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer";

    const variantStyles = {
      primary:
        "bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)] active:bg-[var(--primary-active)] focus-visible:ring-[var(--ring)] shadow-[var(--shadow-subtle)]",
      secondary:
        "bg-[var(--color-brand-navy)] text-white hover:bg-[#142952] active:bg-[#0B1F44] dark:bg-[var(--surface-raised)] dark:hover:bg-[var(--border-strong)] focus-visible:ring-[var(--ring)] shadow-[var(--shadow-subtle)]",
      outline:
        "border border-[var(--border-strong)] bg-transparent hover:bg-[var(--surface-muted)] active:bg-[var(--border)] text-[var(--foreground)] focus-visible:ring-[var(--ring)]",
      ghost:
        "bg-transparent hover:bg-[var(--surface-muted)] active:bg-[var(--border)] text-[var(--foreground)] focus-visible:ring-[var(--ring)]",
      destructive:
        "bg-[var(--danger)] text-white hover:bg-[#b91c1c] active:bg-[#991b1b] focus-visible:ring-[var(--danger)] shadow-[var(--shadow-subtle)]",
      link:
        "bg-transparent text-[var(--primary)] hover:underline underline-offset-4 p-0 h-auto font-normal focus-visible:ring-0",
    };

    const sizeStyles = {
      sm: "text-xs px-3 py-1.5 h-8 gap-1.5",
      md: "text-sm px-4 py-2 h-10 gap-2",
      lg: "text-base px-6 py-2.5 h-12 gap-2.5 min-w-[44px]",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
        className={cn(
          baseStyles,
          variantStyles[variant],
          variant !== "link" && sizeStyles[size],
          fullWidth && "w-full",
          className
        )}
        {...props}
      >
        {isLoading ? (
          <span
            aria-hidden="true"
            className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          />
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}
        <span>{children}</span>
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = "Button";
