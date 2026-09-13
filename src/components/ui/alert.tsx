import * as React from "react";
import { Info, CheckCircle2, AlertTriangle, AlertCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "info" | "success" | "warning" | "danger";
  title?: string;
  onDismiss?: () => void;
}

export function Alert({
  className,
  variant = "info",
  title,
  onDismiss,
  children,
  ...props
}: AlertProps) {
  const variantMap = {
    info: {
      container:
        "border-sky-300 bg-sky-50/90 text-sky-950 dark:border-sky-700/60 dark:bg-sky-950/40 dark:text-sky-100",
      icon: <Info className="h-5 w-5 text-sky-600 dark:text-sky-300 shrink-0 mt-0.5" aria-hidden="true" />,
    },
    success: {
      container:
        "border-emerald-300 bg-emerald-50/90 text-emerald-950 dark:border-emerald-700/60 dark:bg-emerald-950/40 dark:text-emerald-100",
      icon: <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-300 shrink-0 mt-0.5" aria-hidden="true" />,
    },
    warning: {
      container:
        "border-amber-300 bg-amber-50/90 text-amber-950 dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-100",
      icon: <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-300 shrink-0 mt-0.5" aria-hidden="true" />,
    },
    danger: {
      container:
        "border-red-300 bg-red-50/90 text-red-950 dark:border-red-700/60 dark:bg-red-950/40 dark:text-red-100",
      icon: <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-300 shrink-0 mt-0.5" aria-hidden="true" />,
    },
  };

  const selected = variantMap[variant];

  return (
    <div
      role={variant === "danger" || variant === "warning" ? "alert" : "status"}
      className={cn(
        "relative flex items-start gap-3 rounded-[var(--radius-lg)] border p-4 text-sm transition-colors",
        selected.container,
        className
      )}
      {...props}
    >
      {selected.icon}

      <div className="flex-1 space-y-1 text-left">
        {title && <h5 className="font-semibold leading-tight text-current">{title}</h5>}
        <div className="text-xs sm:text-sm leading-relaxed opacity-95">{children}</div>
      </div>

      {onDismiss && (
        <button
          onClick={onDismiss}
          aria-label="Dismiss alert"
          className="rounded-md p-1 opacity-70 hover:opacity-100 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
