"use client";

import { useState, useCallback } from "react";
import {
  Trophy,
  RefreshCw,
  Loader2,
  TrendingUp,
  TrendingDown,
  Sparkles,
  AlertCircle,
  Cpu,
  Target,
} from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { GlowBadge } from "@/components/ui/glow-badge";
import { GradientButton } from "@/components/ui/gradient-button";
import { formatCurrency, formatPercent, cn } from "@/lib/utils";

interface RankedStock {
  ticker: string;
  probability: number;
  direction: "bullish" | "bearish";
  confidence: number;
  model_agreement: number;
  model_type: string;
  momentum_20d: number;
  last_close: number;
}

interface RankResponse {
  rankings: RankedStock[];
  model_type: string;
  scored_count: number;
  universe_count: number;
  bars_used_per_ticker: number;
  generated_at: string;
}

const MODEL_OPTIONS = ["ENSEMBLE", "XGBOOST", "RANDOM_FOREST", "LSTM", "TRANSFORMER"];

export function RankPanel() {
  const [data, setData] = useState<RankResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modelType, setModelType] = useState("ENSEMBLE");

  const runRanking = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/rank", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model_type: modelType, limit: 25 }),
      });
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        setError(json.error || "Ranking failed");
      }
    } catch {
      setError("Failed to reach the ranking service");
    } finally {
      setLoading(false);
    }
  }, [modelType]);

  return (
    <div className="space-y-4">
      {/* Controls */}
      <GlassCard>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1.5">
            {MODEL_OPTIONS.map((m) => (
              <button
                key={m}
                onClick={() => setModelType(m)}
                className={cn(
                  "min-h-[36px] rounded-lg px-2.5 py-1.5 font-mono text-[10px] font-bold transition-colors",
                  modelType === m
                    ? "bg-accent text-accent-fg"
                    : "bg-panel-elevated text-muted hover:text-foreground"
                )}
              >
                {m}
              </button>
            ))}
          </div>
          <GradientButton
            variant="brand"
            size="sm"
            className="min-h-[40px]"
            onClick={runRanking}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Training &amp; Scoring...
              </>
            ) : (
              <>
                <Trophy className="h-3.5 w-3.5" />
                Rank Universe
              </>
            )}
          </GradientButton>
        </div>
        <p className="mt-3 text-[10px] text-muted leading-relaxed">
          Trains a model per ticker on real historical OHLCV (35 technical features), then ranks the
          universe by predicted probability of a bullish outcome.
        </p>
      </GlassCard>

      {error && (
        <GlassCard>
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">Ranking unavailable</p>
              <p className="text-xs text-muted mt-0.5">{error}</p>
            </div>
          </div>
        </GlassCard>
      )}

      {data && data.rankings.length === 0 && (
        <GlassCard>
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Cpu className="h-8 w-8 text-muted mb-3" />
            <p className="text-sm font-medium">No models could be trained</p>
            <p className="text-xs text-muted mt-1">
              The ML service may be unavailable, or the universe lacks sufficient history.
            </p>
          </div>
        </GlassCard>
      )}

      {data && data.rankings.length > 0 && (
        <>
          {/* Summary */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <GlassCard padding="sm">
              <p className="text-[10px] uppercase tracking-wider text-muted">Model</p>
              <p className="font-mono text-base font-bold text-foreground">{data.model_type}</p>
            </GlassCard>
            <GlassCard padding="sm">
              <p className="text-[10px] uppercase tracking-wider text-muted">Scored</p>
              <p className="font-mono text-base font-bold text-foreground">
                {data.scored_count}
                <span className="text-xs text-muted">/{data.universe_count}</span>
              </p>
            </GlassCard>
            <GlassCard padding="sm">
              <p className="text-[10px] uppercase tracking-wider text-muted">Bullish</p>
              <p className="font-mono text-base font-bold text-emerald-400">
                {data.rankings.filter((r) => r.direction === "bullish").length}
              </p>
            </GlassCard>
            <GlassCard padding="sm">
              <p className="text-[10px] uppercase tracking-wider text-muted">Bars / Ticker</p>
              <p className="font-mono text-base font-bold text-foreground">{data.bars_used_per_ticker}</p>
            </GlassCard>
          </div>

          {/* Rankings */}
          <GlassCard padding="none">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-amber" />
                <h2 className="font-display text-sm font-semibold">ML Stock Rankings</h2>
              </div>
              <GlowBadge variant="info">{data.model_type}</GlowBadge>
            </div>

            <div className="divide-y divide-border">
              {data.rankings.map((rank, i) => {
                const isBullish = rank.direction === "bullish";
                return (
                  <div
                    key={rank.ticker}
                    className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-panel-elevated"
                  >
                    {/* Rank */}
                    <div
                      className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg font-mono text-xs font-bold",
                        i === 0
                          ? "bg-amber-500/20 text-amber-400"
                          : i === 1
                          ? "bg-zinc-400/20 text-zinc-300"
                          : i === 2
                          ? "bg-orange-700/20 text-orange-400"
                          : "bg-panel-elevated text-muted"
                      )}
                    >
                      {i + 1}
                    </div>

                    {/* Ticker */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-sm font-bold">{rank.ticker}</span>
                        {isBullish ? (
                          <TrendingUp className="h-3 w-3 text-emerald-400" />
                        ) : (
                          <TrendingDown className="h-3 w-3 text-red-400" />
                        )}
                      </div>
                      <p className="text-[10px] text-muted">
                        {rank.momentum_20d > 0 ? "+" : ""}
                        {rank.momentum_20d.toFixed(1)}% 20d · {formatCurrency(rank.last_close)}
                      </p>
                    </div>

                    {/* Probability bar */}
                    <div className="hidden w-32 sm:block">
                      <div className="mb-1 flex items-center justify-between text-[10px]">
                        <span className="text-muted">P(bullish)</span>
                        <span className="font-mono font-bold text-foreground">
                          {(rank.probability * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-panel-elevated">
                        <div
                          className={cn(
                            "h-full rounded-full",
                            isBullish ? "bg-emerald-500" : "bg-red-500"
                          )}
                          style={{ width: `${rank.probability * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* Agreement */}
                    <div className="hidden w-20 text-right md:block">
                      <p className="text-[10px] text-muted">Agreement</p>
                      <p className="font-mono text-xs font-semibold text-foreground">
                        {(rank.model_agreement * 100).toFixed(0)}%
                      </p>
                    </div>

                    {/* Probability (mobile) */}
                    <div className="text-right sm:hidden">
                      <p className="font-mono text-xs font-bold text-foreground">
                        {(rank.probability * 100).toFixed(0)}%
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </GlassCard>
        </>
      )}
    </div>
  );
}
