import * as React from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "interactive" | "selected" | "info" | "warning" | "danger" | "success";
  density?: "spacious" | "compact";
}

export function Card({
  className,
  variant = "default",
  density = "spacious",
  ...props
}: CardProps) {
  const variantStyles = {
    default:
      "border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-subtle)]",
    interactive:
      "border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-subtle)] hover:shadow-[var(--shadow-md)] hover:border-[var(--border-strong)] cursor-pointer transition-all duration-200",
    selected:
      "border-[var(--primary)] bg-[var(--surface-subtle)] ring-1 ring-[var(--primary)] shadow-[var(--shadow-subtle)]",
    info:
      "border-[var(--info)] bg-[var(--info-subtle)] shadow-[var(--shadow-subtle)]",
    warning:
      "border-[var(--warning)] bg-[var(--warning-subtle)] shadow-[var(--shadow-subtle)]",
    danger:
      "border-[var(--danger)] bg-[var(--danger-subtle)] shadow-[var(--shadow-subtle)]",
    success:
      "border-[var(--success)] bg-[var(--success-subtle)] shadow-[var(--shadow-subtle)]",
  };

  return (
    <div
      data-density={density}
      className={cn(
        "rounded-[var(--radius-lg)] border text-[var(--foreground)] transition-colors overflow-hidden",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex flex-col space-y-1.5 p-6 in-data-[density=compact]:p-4",
        className
      )}
      {...props}
    />
  );
}

export function CardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        "text-base font-semibold leading-tight tracking-tight text-[var(--foreground)] in-data-[density=compact]:text-sm",
        className
      )}
      {...props}
    />
  );
}

export function CardDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn(
        "text-xs sm:text-sm text-[var(--foreground-muted)] leading-relaxed in-data-[density=compact]:text-xs",
        className
      )}
      {...props}
    />
  );
}

export function CardContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "p-6 pt-0 in-data-[density=compact]:p-4 in-data-[density=compact]:pt-0",
        className
      )}
      {...props}
    />
  );
}

export function CardFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex items-center p-6 pt-0 border-t border-[var(--border-muted)] mt-4 in-data-[density=compact]:p-4 in-data-[density=compact]:pt-0 in-data-[density=compact]:mt-2",
        className
      )}
      {...props}
    />
  );
}
