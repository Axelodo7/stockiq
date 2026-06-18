"use client";

import {
  Calendar,
  TrendingUp,
  TrendingDown,
  Zap,
  BarChart3,
} from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { GlowBadge } from "@/components/ui/glow-badge";
import type { EarningsAnalysis } from "@/lib/services/python-client";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface EarningsAnalysisCardProps {
  data: EarningsAnalysis | null;
  isLoading?: boolean;
}

export function EarningsAnalysisCard({ data, isLoading }: EarningsAnalysisCardProps) {
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
          <Calendar className="h-4 w-4 text-amber" />
          <h3 className="font-display text-sm font-semibold">Earnings Analysis</h3>
        </div>
        {data.expectations.beat !== null && (
          <GlowBadge variant={data.expectations.beat ? "success" : "danger"} glow>
            {data.expectations.beat ? "Beat" : "Miss"}
          </GlowBadge>
        )}
      </div>

      {/* Price & Surprise */}
      <div className="mb-4 grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-white/[0.03] p-3">
          <p className="text-[10px] text-muted">Current Price</p>
          <p className="font-mono text-lg font-bold">{formatCurrency(data.current_price)}</p>
        </div>
        <div className="rounded-lg bg-white/[0.03] p-3">
          <p className="text-[10px] text-muted">EPS Surprise</p>
          <p className={cn(
            "font-mono text-lg font-bold",
            data.expectations.surprise_pct !== null
              ? data.expectations.surprise_pct > 0 ? "text-positive" : "text-negative"
              : "text-muted"
          )}>
            {data.expectations.surprise_pct !== null ? `${data.expectations.surprise_pct > 0 ? "+" : ""}${data.expectations.surprise_pct.toFixed(1)}%` : "N/A"}
          </p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="mb-4 grid grid-cols-3 gap-2">
        <div className="rounded-lg bg-white/[0.03] p-2 text-center">
          <div className="flex items-center justify-center gap-1">
            {data.price_reaction !== null && data.price_reaction > 0 ? (
              <TrendingUp className="h-3 w-3 text-positive" />
            ) : (
              <TrendingDown className="h-3 w-3 text-negative" />
            )}
          </div>
          <p className={cn(
            "font-mono text-xs font-bold",
            data.price_reaction !== null ? (data.price_reaction > 0 ? "text-positive" : "text-negative") : "text-muted"
          )}>
            {data.price_reaction !== null ? `${data.price_reaction > 0 ? "+" : ""}${data.price_reaction.toFixed(1)}%` : "N/A"}
          </p>
          <p className="text-[9px] text-muted">Price Reaction</p>
        </div>
        <div className="rounded-lg bg-white/[0.03] p-2 text-center">
          <Zap className={cn("mx-auto h-3 w-3", data.volume_spike > 2 ? "text-amber" : "text-muted")} />
          <p className={cn("font-mono text-xs font-bold", data.volume_spike > 2 ? "text-amber" : "")}>
            {data.volume_spike.toFixed(1)}x
          </p>
          <p className="text-[9px] text-muted">Volume Spike</p>
        </div>
        <div className="rounded-lg bg-white/[0.03] p-2 text-center">
          <BarChart3 className="mx-auto h-3 w-3 text-muted" />
          <p className="font-mono text-xs font-bold">
            {data.expectations.magnitude || "N/A"}
          </p>
          <p className="text-[9px] text-muted">Magnitude</p>
        </div>
      </div>

      {/* Drift Analysis */}
      {data.drift_analysis && (
        <div className="mb-4">
          <p className="mb-2 text-[10px] font-medium uppercase text-muted">Post-Earnings Drift</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-white/[0.03] p-2">
              <p className="text-[9px] text-muted">Avg 1D Return</p>
              <p className={cn("font-mono text-xs font-bold", data.drift_analysis.avg_1d_return >= 0 ? "text-positive" : "text-negative")}>
                {data.drift_analysis.avg_1d_return > 0 ? "+" : ""}{data.drift_analysis.avg_1d_return.toFixed(2)}%
              </p>
            </div>
            <div className="rounded-lg bg-white/[0.03] p-2">
              <p className="text-[9px] text-muted">Avg 5D Return</p>
              <p className={cn("font-mono text-xs font-bold", data.drift_analysis.avg_5d_return >= 0 ? "text-positive" : "text-negative")}>
                {data.drift_analysis.avg_5d_return > 0 ? "+" : ""}{data.drift_analysis.avg_5d_return.toFixed(2)}%
              </p>
            </div>
            <div className="rounded-lg bg-white/[0.03] p-2">
              <p className="text-[9px] text-muted">Positive Days</p>
              <p className="font-mono text-xs font-bold">{data.drift_analysis.positive_days_pct.toFixed(1)}%</p>
            </div>
            <div className="rounded-lg bg-white/[0.03] p-2">
              <p className="text-[9px] text-muted">Return Volatility</p>
              <p className="font-mono text-xs font-bold">{data.drift_analysis.volatility_of_returns.toFixed(2)}%</p>
            </div>
          </div>
        </div>
      )}

      {/* Assessment */}
      <p className="text-xs text-muted leading-relaxed">{data.assessment}</p>
    </GlassCard>
  );
}
