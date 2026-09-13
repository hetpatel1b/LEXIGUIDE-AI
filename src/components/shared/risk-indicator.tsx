import * as React from "react";
import { AlertTriangle, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RiskSeverity } from "@/types";

export interface RiskIndicatorProps extends React.HTMLAttributes<HTMLDivElement> {
  severity: RiskSeverity;
  label?: string;
  showIcon?: boolean;
  size?: "sm" | "md";
}

export function RiskIndicator({
  severity,
  label,
  showIcon = true,
  size = "md",
  className,
  ...props
}: RiskIndicatorProps) {
  const config = {
    high: {
      defaultLabel: "Potential Concern",
      badgeClass:
        "border-red-200 bg-red-50/80 text-red-700",
      icon: <AlertCircle className="shrink-0" aria-hidden="true" />,
    },
    medium: {
      defaultLabel: "Requires Review",
      badgeClass:
        "border-amber-200 bg-amber-50/80 text-amber-700",
      icon: <AlertTriangle className="shrink-0" aria-hidden="true" />,
    },
    low: {
      defaultLabel: "Informational",
      badgeClass:
        "border-sky-200 bg-sky-50/80 text-sky-700",
      icon: <Info className="shrink-0" aria-hidden="true" />,
    },
  };

  const current = config[severity] || config.low;
  const displayLabel = label || current.defaultLabel;

  const sizeStyles = {
    sm: "text-[11px] px-2 py-0.5 gap-1.5 [&_svg]:h-3 [&_svg]:w-3",
    md: "text-xs px-2.5 py-1 gap-1.5 [&_svg]:h-3.5 [&_svg]:w-3.5",
  };

  return (
    <div
      role="status"
      className={cn(
        "inline-flex items-center rounded-full border font-medium tracking-wide transition-colors",
        current.badgeClass,
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {showIcon && current.icon}
      <span>{displayLabel}</span>
    </div>
  );
}
