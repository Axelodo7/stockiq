"use client";

import {
  Globe,
  TrendingUp,
  TrendingDown,
  Zap,
  BarChart3,
} from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { GlowBadge } from "@/components/ui/glow-badge";
import type { MarketSummary } from "@/lib/services/python-client";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface MarketSummaryCardProps {
  data: MarketSummary | null;
  isLoading?: boolean;
}

export function MarketSummaryCard({ data, isLoading }: MarketSummaryCardProps) {
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
          <Globe className="h-4 w-4 text-cyan" />
          <h3 className="font-display text-sm font-semibold">Market Summary</h3>
        </div>
        <GlowBadge
          variant={data.sentiment === "bullish" ? "success" : data.sentiment === "bearish" ? "danger" : "default"}
          glow
        >
          {data.sentiment}
        </GlowBadge>
      </div>

      {/* Overview Metrics */}
      <div className="mb-4 grid grid-cols-3 gap-2">
        <div className="rounded-lg bg-white/[0.03] p-2.5 text-center">
          <p className={cn("font-mono text-sm font-bold", data.avg_change_pct >= 0 ? "text-positive" : "text-negative")}>
            {data.avg_change_pct > 0 ? "+" : ""}{data.avg_change_pct.toFixed(2)}%
          </p>
          <p className="text-[10px] text-muted">Avg Change</p>
        </div>
        <div className="rounded-lg bg-white/[0.03] p-2.5 text-center">
          <p className={cn("font-mono text-sm font-bold", data.avg_5d_return >= 0 ? "text-positive" : "text-negative")}>
            {data.avg_5d_return > 0 ? "+" : ""}{data.avg_5d_return.toFixed(2)}%
          </p>
          <p className="text-[10px] text-muted">5D Return</p>
        </div>
        <div className="rounded-lg bg-white/[0.03] p-2.5 text-center">
          <p className={cn("font-mono text-sm font-bold", data.avg_20d_return >= 0 ? "text-positive" : "text-negative")}>
            {data.avg_20d_return > 0 ? "+" : ""}{data.avg_20d_return.toFixed(2)}%
          </p>
          <p className="text-[10px] text-muted">20D Return</p>
        </div>
      </div>

      {/* Sentiment Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-muted">Bullish {data.bullish_count}/{data.total_stocks}</span>
          <span className="text-[10px] text-muted">Bearish {data.bearish_count}/{data.total_stocks}</span>
        </div>
        <div className="h-2 w-full rounded-full bg-white/[0.05] overflow-hidden">
          <div className="flex h-full">
            <div className="bg-positive" style={{ width: `${(data.bullish_count / data.total_stocks) * 100}%` }} />
            <div className="bg-muted/30" style={{ width: `${((data.total_stocks - data.bullish_count - data.bearish_count) / data.total_stocks) * 100}%` }} />
            <div className="bg-negative" style={{ width: `${(data.bearish_count / data.total_stocks) * 100}%` }} />
          </div>
        </div>
      </div>

      {/* Top Gainers */}
      {data.top_gainers.length > 0 && (
        <div className="mb-3">
          <p className="mb-1.5 text-[10px] font-medium uppercase text-muted">Top Gainers</p>
          <div className="space-y-1">
            {data.top_gainers.slice(0, 3).map((g) => (
              <div key={g.ticker} className="flex items-center justify-between rounded bg-positive/5 px-2.5 py-1.5">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-3 w-3 text-positive" />
                  <span className="font-mono text-xs font-bold">{g.ticker}</span>
                </div>
                <span className="font-mono text-xs text-positive">
                  +{g.change_pct.toFixed(2)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Losers */}
      {data.top_losers.length > 0 && (
        <div className="mb-3">
          <p className="mb-1.5 text-[10px] font-medium uppercase text-muted">Top Losers</p>
          <div className="space-y-1">
            {data.top_losers.slice(0, 3).map((l) => (
              <div key={l.ticker} className="flex items-center justify-between rounded bg-negative/5 px-2.5 py-1.5">
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-3 w-3 text-negative" />
                  <span className="font-mono text-xs font-bold">{l.ticker}</span>
                </div>
                <span className="font-mono text-xs text-negative">
                  {l.change_pct.toFixed(2)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Unusual Volume */}
      {data.unusual_volume.length > 0 && (
        <div className="mb-3">
          <p className="mb-1.5 text-[10px] font-medium uppercase text-muted">Unusual Volume</p>
          <div className="space-y-1">
            {data.unusual_volume.slice(0, 3).map((v) => (
              <div key={v.ticker} className="flex items-center justify-between rounded bg-amber/5 px-2.5 py-1.5">
                <div className="flex items-center gap-2">
                  <Zap className="h-3 w-3 text-amber" />
                  <span className="font-mono text-xs font-bold">{v.ticker}</span>
                </div>
                <span className="font-mono text-xs text-amber">{v.volume_ratio.toFixed(1)}x</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary */}
      <p className="text-xs text-muted leading-relaxed">{data.summary}</p>
    </GlassCard>
  );
}
