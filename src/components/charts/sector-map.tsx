"use client";

import { cn } from "@/lib/utils";

export interface SectorData {
  name: string;
  changePercent: number;
  marketCap?: number;
  topStocks?: string[];
}

interface SectorMapProps {
  sectors: SectorData[];
  onClick?: (sector: string) => void;
}

function getSectorColor(change: number): string {
  if (change > 2) return "bg-positive/20";
  if (change > 0.5) return "bg-positive/10";
  if (change > -0.5) return "bg-panel-elevated";
  if (change > -2) return "bg-negative/10";
  return "bg-negative/20";
}

function getSectorBorder(change: number): string {
  if (change > 2) return "border-positive/30";
  if (change > 0.5) return "border-positive/20";
  if (change > -0.5) return "border-border";
  if (change > -2) return "border-negative/20";
  return "border-negative/30";
}

function getTextColor(change: number): string {
  if (change > 0.5) return "text-positive";
  if (change < -0.5) return "text-negative";
  return "text-muted";
}

export function SectorMap({ sectors, onClick }: SectorMapProps) {
  const maxCap = Math.max(...sectors.map((s) => s.marketCap || 1));

  return (
    <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4 md:grid-cols-6">
      {sectors.map((sector) => {
        const size = sector.marketCap
          ? Math.max(0.6, Math.min(1, sector.marketCap / maxCap))
          : 0.8;

        return (
          <button
            key={sector.name}
            onClick={() => onClick?.(sector.name)}
            className={cn(
              "group relative flex flex-col items-center justify-center rounded-lg border p-3 transition-colors duration-150",
              getSectorColor(sector.changePercent),
              getSectorBorder(sector.changePercent),
              "hover:border-accent/30",
              onClick && "cursor-pointer"
            )}
            style={{
              minHeight: `${Math.round(80 * size)}px`,
            }}
          >
            <span className="text-[10px] font-medium text-muted group-hover:text-foreground">
              {sector.name}
            </span>
            <span
              className={cn(
                "mt-0.5 font-mono text-sm font-bold",
                getTextColor(sector.changePercent)
              )}
            >
              {sector.changePercent >= 0 ? "+" : ""}
              {sector.changePercent.toFixed(1)}%
            </span>
            {sector.topStocks && sector.topStocks.length > 0 && (
              <span className="mt-1 text-[8px] text-muted">
                {sector.topStocks.slice(0, 2).join(", ")}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
