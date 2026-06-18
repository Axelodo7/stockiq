"use client";

import { cn } from "@/lib/utils";

export interface HeatmapItem {
  ticker: string;
  changePercent: number;
  marketCap?: number;
  volume?: number;
}

interface HeatmapGridProps {
  items: HeatmapItem[];
  size?: "sm" | "md" | "lg";
  onClick?: (ticker: string) => void;
}

function getHeatmapClass(change: number): string {
  if (change > 3) return "heatmap-positive-3";
  if (change > 1.5) return "heatmap-positive-2";
  if (change > 0) return "heatmap-positive-1";
  if (change === 0) return "heatmap-neutral";
  if (change > -1.5) return "heatmap-negative-1";
  if (change > -3) return "heatmap-negative-2";
  return "heatmap-negative-3";
}

const sizeClasses = {
  sm: "h-16 min-w-[72px]",
  md: "h-20 min-w-[88px]",
  lg: "h-24 min-w-[100px]",
};

export function HeatmapGrid({ items, size = "md", onClick }: HeatmapGridProps) {
  return (
    <div className="flex flex-wrap gap-1">
      {items.map((item) => (
        <button
          key={item.ticker}
          onClick={() => onClick?.(item.ticker)}
          className={cn(
            "group flex flex-col items-center justify-center rounded-lg p-2 transition-all duration-150",
            "hover:scale-105 hover:ring-1 hover:ring-white/20",
            getHeatmapClass(item.changePercent),
            sizeClasses[size],
            onClick && "cursor-pointer"
          )}
        >
          <span className="font-mono text-xs font-bold text-foreground">{item.ticker}</span>
          <span
            className={cn(
              "font-mono text-[10px] font-bold",
              item.changePercent >= 0 ? "text-positive" : "text-negative"
            )}
          >
            {item.changePercent >= 0 ? "+" : ""}
            {item.changePercent.toFixed(1)}%
          </span>
        </button>
      ))}
    </div>
  );
}
