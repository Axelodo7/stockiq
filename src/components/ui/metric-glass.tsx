"use client";

import { useEffect, useRef, useState } from "react";
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
  const [displayValue, setDisplayValue] = useState(0);
  const animatedRef = useRef(false);

  const numericValue = typeof value === "number" ? value : parseFloat(String(value)) || 0;
  const direction = trend || (typeof change === "number" ? (change >= 0 ? "up" : "down") : "neutral");

  useEffect(() => {
    if (animatedRef.current) return;
    animatedRef.current = true;

    const duration = 800;
    const startTime = Date.now();
    const startVal = 0;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(startVal + (numericValue - startVal) * eased);
      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, [numericValue]);

  const formatted = typeof value === "string"
    ? value
    : `${prefix}${displayValue.toFixed(decimals)}${suffix}`;

  return (
    <div className={cn("glass p-4 transition-all duration-200 hover:border-white/10", className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted">{label}</p>
          <p className="font-mono text-xl font-bold tracking-tight">{formatted}</p>
        </div>
        {icon && (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.03]">
            {icon}
          </div>
        )}
      </div>
      {typeof change === "number" && (
        <div className="mt-2 flex items-center gap-1.5">
          <span
            className={cn(
              "font-mono text-xs font-bold",
              direction === "up" && "text-positive",
              direction === "down" && "text-negative",
              direction === "neutral" && "text-muted"
            )}
          >
            {change >= 0 ? "+" : ""}
            {change.toFixed(2)}%
          </span>
          <span className="text-[10px] text-muted">vs prev</span>
        </div>
      )}
    </div>
  );
}
