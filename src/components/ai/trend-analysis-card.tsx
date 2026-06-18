"use client";

import {
  TrendingUp,
  TrendingDown,
  Activity,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { GlowBadge } from "@/components/ui/glow-badge";
import type { TrendAnalysis } from "@/lib/services/python-client";
import { cn } from "@/lib/utils";

interface TrendAnalysisCardProps {
  data: TrendAnalysis | null;
  isLoading?: boolean;
}

export function TrendAnalysisCard({ data, isLoading }: TrendAnalysisCardProps) {
  if (isLoading) {
    return (
      <GlassCard>
        <div className="animate-pulse space-y-3">
          <div className="h-4 w-32 rounded bg-white/[0.05]" />
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-3 rounded bg-white/[0.05]" />
            ))}
          </div>
        </div>
      </GlassCard>
    );
  }

  if (!data) return null;

  return (
    <GlassCard>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-purple" />
          <h3 className="font-display text-sm font-semibold">Trend Analysis</h3>
        </div>
        <GlowBadge variant="info">Trends</GlowBadge>
      </div>

      {/* Trend Periods */}
      <div className="mb-4 space-y-2">
        <p className="text-[10px] font-medium uppercase text-muted">Trend Periods</p>
        {data.trends.map((trend, i) => (
          <div key={i} className="flex items-center justify-between rounded-lg border border-white/[0.04] px-3 py-2">
            <div className="flex items-center gap-2">
              {trend.direction === "up" ? (
                <ArrowUpRight className="h-4 w-4 text-positive" />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-negative" />
              )}
              <div>
                <p className="text-xs font-medium capitalize">{trend.period.replace("_", " ")}</p>
                <p className="text-[10px] text-muted">{trend.days} days</p>
              </div>
            </div>
            <div className="text-right">
              <p className={cn(
                "font-mono text-xs font-bold",
                trend.direction === "up" ? "text-positive" : "text-negative"
              )}>
                {trend.slope_pct_per_day > 0 ? "+" : ""}{trend.slope_pct_per_day.toFixed(2)}%/day
              </p>
              <p className="text-[10px] text-muted">R² {trend.strength.toFixed(2)}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Momentum */}
      <div className="mb-4">
        <p className="mb-2 text-[10px] font-medium uppercase text-muted">Momentum</p>
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg bg-white/[0.03] p-2 text-center">
            <p className="font-mono text-sm font-bold">{data.momentum.rsi_14}</p>
            <p className="text-[10px] text-muted">RSI (14)</p>
          </div>
          <div className="rounded-lg bg-white/[0.03] p-2 text-center">
            <p className={cn(
              "font-mono text-sm font-bold",
              data.momentum.roc_10d >= 0 ? "text-positive" : "text-negative"
            )}>
              {data.momentum.roc_10d > 0 ? "+" : ""}{data.momentum.roc_10d.toFixed(1)}%
            </p>
            <p className="text-[10px] text-muted">ROC (10D)</p>
          </div>
          <div className="rounded-lg bg-white/[0.03] p-2 text-center">
            <p className={cn(
              "font-mono text-sm font-bold",
              data.momentum.momentum_score >= 0 ? "text-positive" : "text-negative"
            )}>
              {data.momentum.momentum_score > 0 ? "+" : ""}{data.momentum.momentum_score.toFixed(2)}
            </p>
            <p className="text-[10px] text-muted">Score</p>
          </div>
        </div>
      </div>

      {/* Patterns */}
      {data.patterns.length > 0 && (
        <div className="mb-4">
          <p className="mb-2 text-[10px] font-medium uppercase text-muted">Patterns Detected</p>
          <div className="space-y-1.5">
            {data.patterns.map((p, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg bg-amber/5 px-3 py-2">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-3 w-3 text-amber" />
                  <span className="text-xs">{p.description}</span>
                </div>
                <span className="font-mono text-[10px] text-amber">{(p.confidence * 100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Support/Resistance */}
      <div>
        <p className="mb-2 text-[10px] font-medium uppercase text-muted">Pivot Points</p>
        <div className="grid grid-cols-3 gap-1.5 text-center">
          {Object.entries(data.support_resistance).map(([key, value]) => (
            <div key={key} className="rounded bg-white/[0.03] py-1.5">
              <p className="text-[9px] uppercase text-muted">{key}</p>
              <p className="font-mono text-[10px] font-bold">${value.toFixed(2)}</p>
            </div>
          ))}
        </div>
      </div>
    </GlassCard>
  );
}
