"use client";

import Link from "next/link";
import { TrendingUp, TrendingDown, ArrowRight, Target, Zap, BarChart3 } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { formatCurrency, formatPercent, cn } from "@/lib/utils";

interface StockRecommendation {
  ticker: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  signal: "strong_buy" | "buy" | "hold" | "sell" | "strong_sell";
  confidence: number;
  indicators: {
    rsi: number | null;
    rsiSignal: "oversold" | "overbought" | "neutral";
    macdSignal: "bullish" | "bearish" | "neutral";
    bollingerSignal: "below_lower" | "above_upper" | "within";
    smaCross: "golden" | "death" | "none";
    momentum: number;
  };
  reasoning: string[];
}

interface PortfolioSellRecommendation {
  ticker: string;
  name: string;
  shares: number;
  avgCost: number;
  currentPrice: number;
  gainLoss: number;
  gainLossPercent: number;
  signal: "sell" | "reduce";
  confidence: number;
  reasoning: string[];
  allocationPercent: number;
  riskLevel: "low" | "medium" | "high";
}

const signalConfig: Record<string, { label: string; color: string; bg: string }> = {
  strong_buy: { label: "STRONG BUY", color: "text-emerald-300", bg: "bg-emerald-500/15 border-emerald-500/30" },
  buy: { label: "BUY", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  hold: { label: "HOLD", color: "text-zinc-300", bg: "bg-zinc-500/10 border-zinc-500/20" },
  sell: { label: "SELL", color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
  strong_sell: { label: "STRONG SELL", color: "text-red-300", bg: "bg-red-500/15 border-red-500/30" },
  reduce: { label: "REDUCE", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
};

const riskColors = {
  low: "text-emerald-400",
  medium: "text-amber-400",
  high: "text-red-400",
};

export function BuyRecommendationCard({ rec }: { rec: StockRecommendation }) {
  const cfg = signalConfig[rec.signal] || signalConfig.hold;

  return (
    <GlassCard hover className="group">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <Link
            href={`/stock/${rec.ticker}`}
            className="font-mono text-lg font-bold text-foreground hover:text-accent transition-colors"
          >
            {rec.ticker}
          </Link>
          <span className={cn("rounded-md border px-2 py-0.5 text-[10px] font-bold tracking-wider", cfg.bg, cfg.color)}>
            {cfg.label}
          </span>
        </div>
        <div className="text-right">
          <p className="font-mono text-lg font-bold text-foreground">{formatCurrency(rec.price)}</p>
          <p className={cn("font-mono text-xs font-semibold", rec.change >= 0 ? "text-emerald-400" : "text-red-400")}>
            {formatPercent(rec.changePercent)}
          </p>
        </div>
      </div>

      <p className="text-xs text-muted mb-3 truncate">{rec.name}</p>

      {/* Confidence bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-muted">Confidence</span>
          <span className="font-mono text-xs font-semibold text-foreground">{rec.confidence}%</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-panel-elevated">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              rec.confidence >= 60 ? "bg-emerald-500" : rec.confidence >= 30 ? "bg-amber-500" : "bg-zinc-500"
            )}
            style={{ width: `${rec.confidence}%` }}
          />
        </div>
      </div>

      {/* Key indicators */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="rounded-lg bg-panel-elevated p-2">
          <p className="text-[10px] text-muted mb-0.5">RSI</p>
          <p className={cn("font-mono text-xs font-bold",
            rec.indicators.rsiSignal === "oversold" ? "text-emerald-400" :
            rec.indicators.rsiSignal === "overbought" ? "text-red-400" : "text-foreground"
          )}>
            {rec.indicators.rsi !== null ? rec.indicators.rsi.toFixed(0) : "—"}
          </p>
        </div>
        <div className="rounded-lg bg-panel-elevated p-2">
          <p className="text-[10px] text-muted mb-0.5">MACD</p>
          <p className={cn("font-mono text-xs font-bold",
            rec.indicators.macdSignal === "bullish" ? "text-emerald-400" :
            rec.indicators.macdSignal === "bearish" ? "text-red-400" : "text-foreground"
          )}>
            {rec.indicators.macdSignal === "bullish" ? "▲ Bull" :
             rec.indicators.macdSignal === "bearish" ? "▼ Bear" : "— Flat"}
          </p>
        </div>
        <div className="rounded-lg bg-panel-elevated p-2">
          <p className="text-[10px] text-muted mb-0.5">Trend</p>
          <p className={cn("font-mono text-xs font-bold",
            rec.indicators.smaCross === "golden" ? "text-emerald-400" :
            rec.indicators.smaCross === "death" ? "text-red-400" : "text-foreground"
          )}>
            {rec.indicators.smaCross === "golden" ? "Golden ✦" :
             rec.indicators.smaCross === "death" ? "Death ✦" : "—"}
          </p>
        </div>
      </div>

      {/* Reasoning */}
      <div className="space-y-1">
        {rec.reasoning.slice(0, 2).map((r, i) => (
          <p key={i} className="text-xs text-muted flex items-start gap-1.5">
            <Zap className="h-3 w-3 mt-0.5 shrink-0 text-accent" />
            {r}
          </p>
        ))}
      </div>

      <Link
        href={`/stock/${rec.ticker}`}
        className="mt-3 flex items-center gap-1 text-xs font-medium text-accent hover:text-accent/80 transition-colors"
      >
        View Analysis <ArrowRight className="h-3 w-3" />
      </Link>
    </GlassCard>
  );
}

export function SellRecommendationCard({ rec }: { rec: PortfolioSellRecommendation }) {
  const cfg = signalConfig[rec.signal] || signalConfig.sell;

  return (
    <GlassCard hover className="group">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <Link
            href={`/stock/${rec.ticker}`}
            className="font-mono text-lg font-bold text-foreground hover:text-accent transition-colors"
          >
            {rec.ticker}
          </Link>
          <span className={cn("rounded-md border px-2 py-0.5 text-[10px] font-bold tracking-wider", cfg.bg, cfg.color)}>
            {cfg.label}
          </span>
          <span className={cn("text-[10px] font-semibold", riskColors[rec.riskLevel])}>
            {rec.riskLevel.toUpperCase()} RISK
          </span>
        </div>
        <div className="text-right">
          <p className={cn("font-mono text-sm font-bold", rec.gainLoss >= 0 ? "text-emerald-400" : "text-red-400")}>
            {rec.gainLoss >= 0 ? "+" : ""}{formatCurrency(rec.gainLoss)}
          </p>
          <p className={cn("font-mono text-xs", rec.gainLossPercent >= 0 ? "text-emerald-400" : "text-red-400")}>
            {formatPercent(rec.gainLossPercent)} overall
          </p>
        </div>
      </div>

      <p className="text-xs text-muted mb-3 truncate">{rec.name}</p>

      {/* Position details */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="rounded-lg bg-panel-elevated p-2">
          <p className="text-[10px] text-muted mb-0.5">Shares</p>
          <p className="font-mono text-xs font-bold text-foreground">{rec.shares}</p>
        </div>
        <div className="rounded-lg bg-panel-elevated p-2">
          <p className="text-[10px] text-muted mb-0.5">Avg Cost</p>
          <p className="font-mono text-xs font-bold text-foreground">{formatCurrency(rec.avgCost)}</p>
        </div>
        <div className="rounded-lg bg-panel-elevated p-2">
          <p className="text-[10px] text-muted mb-0.5">Allocation</p>
          <p className={cn("font-mono text-xs font-bold",
            rec.allocationPercent > 25 ? "text-red-400" :
            rec.allocationPercent > 15 ? "text-amber-400" : "text-foreground"
          )}>
            {rec.allocationPercent.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Confidence bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-muted">Sell Confidence</span>
          <span className="font-mono text-xs font-semibold text-foreground">{rec.confidence}%</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-panel-elevated">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              rec.confidence >= 60 ? "bg-red-500" : rec.confidence >= 30 ? "bg-amber-500" : "bg-zinc-500"
            )}
            style={{ width: `${rec.confidence}%` }}
          />
        </div>
      </div>

      {/* Reasoning */}
      <div className="space-y-1">
        {rec.reasoning.slice(0, 2).map((r, i) => (
          <p key={i} className="text-xs text-muted flex items-start gap-1.5">
            <Target className="h-3 w-3 mt-0.5 shrink-0 text-amber-400" />
            {r}
          </p>
        ))}
      </div>
    </GlassCard>
  );
}

export function EmptyRecommendations({ type }: { type: "buy" | "sell" }) {
  return (
    <GlassCard className="col-span-full">
      <div className="flex flex-col items-center justify-center py-12">
        {type === "buy" ? (
          <BarChart3 className="h-10 w-10 text-muted mb-3" />
        ) : (
          <TrendingDown className="h-10 w-10 text-muted mb-3" />
        )}
        <p className="text-sm font-medium text-foreground mb-1">
          {type === "buy" ? "No Buy Recommendations" : "No Sell Recommendations"}
        </p>
        <p className="text-xs text-muted text-center max-w-xs">
          {type === "buy"
            ? "No stocks in our universe currently meet the buy criteria. Check back later."
            : "Your portfolio positions look healthy — no sell signals detected."}
        </p>
      </div>
    </GlassCard>
  );
}
