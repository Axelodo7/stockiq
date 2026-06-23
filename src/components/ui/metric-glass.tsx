"use client";

import { cn } from "@/lib/utils";

interface MetricGlassProps {
  label: string;
  value: string | number;
  change?: number;
  icon?: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
}

export function MetricGlass({
  label,
  value,
  change,
  icon,
  trend,
  prefix = "",
  suffix = "",
  decimals = 2,
  className,
}: MetricGlassProps) {
  const numericValue = typeof value === "number" ? value : parseFloat(String(value)) || 0;
  const direction = trend || (typeof change === "number" ? (change >= 0 ? "up" : "down") : "neutral");

  const formatted = typeof value === "string"
    ? value
    : `${prefix}${numericValue.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}${suffix}`;

  return (
    <div className={cn("rounded-xl border border-border bg-panel p-4 transition-colors duration-150 hover:border-accent/20", className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted">{label}</p>
          <p className="font-mono text-xl font-bold tracking-tight text-foreground">{formatted}</p>
        </div>
        {icon && (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-panel-elevated">
            {icon}
          </div>
        )}
      </div>
      {typeof change === "number" && (
        <div className="mt-2 flex items-center gap-1.5">
          <span
            className={cn(
              "font-mono text-xs font-semibold",
              direction === "up" && "text-positive",
              direction === "down" && "text-negative",
              direction === "neutral" && "text-muted"
            )}
          >
            {change >= 0 ? "+" : ""}
            {change.toFixed(2)}%
          </span>
          <span className="text-xs text-muted">vs prev</span>
        </div>
      )}
    </div>
  );
}
