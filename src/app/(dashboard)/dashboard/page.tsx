"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  Brain,
  Bell,
  Briefcase,
  Star,
  ArrowRight,
  BarChart3,
  Zap,
  Globe,
} from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { MetricGlass } from "@/components/ui/metric-glass";
import { GlowBadge } from "@/components/ui/glow-badge";
import { MiniSparkline } from "@/components/charts/mini-sparkline";
import { HeatmapGrid } from "@/components/charts/heatmap-grid";
import { MarketSummaryCard } from "@/components/ai/market-summary-card";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { cn, seededRandom } from "@/lib/utils";
import { useStockPrices } from "@/hooks/use-stock-prices";
import type { MarketSummary } from "@/lib/services/python-client";

const indices = [
  { ticker: "SPX", name: "S&P 500", value: 5842.31, change: 0.67 },
  { ticker: "IXIC", name: "NASDAQ", value: 18439.17, change: 1.12 },
  { ticker: "DJI", name: "Dow Jones", value: 43127.58, change: 0.34 },
  { ticker: "VIX", name: "VIX", value: 14.23, change: -5.21 },
];

const DEFAULT_WATCHLIST_TICKERS = ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "NVDA"];

const fallbackStocks = [
  { ticker: "AAPL", name: "Apple Inc.", price: 298.01, change: 2.06, changePercent: 0.70, sector: "Technology" },
  { ticker: "MSFT", name: "Microsoft Corp.", price: 379.40, change: 0.49, changePercent: 0.13, sector: "Technology" },
  { ticker: "GOOGL", name: "Alphabet Inc.", price: 368.03, change: 4.24, changePercent: 1.17, sector: "Technology" },
  { ticker: "AMZN", name: "Amazon.com Inc.", price: 220.12, change: -0.87, changePercent: -0.39, sector: "E-Commerce" },
  { ticker: "TSLA", name: "Tesla Inc.", price: 400.49, change: 4.11, changePercent: 1.04, sector: "Automotive" },
  { ticker: "NVDA", name: "NVIDIA Corp.", price: 210.69, change: 6.04, changePercent: 2.95, sector: "Technology" },
];

const sectorMap: Record<string, string> = {
  AAPL: "Technology", MSFT: "Technology", GOOGL: "Technology", AMZN: "E-Commerce",
  TSLA: "Automotive", NVDA: "Technology", META: "Technology", NFLX: "Entertainment",
  JPM: "Finance", V: "Finance",
};

const predictions = [
  { ticker: "AAPL", direction: "bullish" as const, confidence: 0.78, price: 221.50, timeframe: "7D" },
  { ticker: "TSLA", direction: "bullish" as const, confidence: 0.65, price: 340.20, timeframe: "7D" },
  { ticker: "GOOGL", direction: "bearish" as const, confidence: 0.62, price: 170.80, timeframe: "7D" },
  { ticker: "NVDA", direction: "bullish" as const, confidence: 0.82, price: 152.40, timeframe: "7D" },
];

const recentActivity = [
  { icon: Brain, label: "AAPL prediction generated", time: "5m ago", color: "text-cyan" },
  { icon: Bell, label: "TSLA price alert triggered", time: "12m ago", color: "text-amber" },
  { icon: Briefcase, label: "Portfolio rebalanced", time: "2h ago", color: "text-purple" },
  { icon: BarChart3, label: "XGBoost model trained", time: "4h ago", color: "text-green" },
];

function generateSparkData(base: number, positive: boolean): number[] {
  const rng = seededRandom(Math.round(base * 100));
  const data: number[] = [];
  let value = base * 0.98;
  for (let i = 0; i < 20; i++) {
    value += (rng() - 0.48) * (base * 0.008);
    data.push(Math.round(value * 100) / 100);
  }
  return data;
}

export default function DashboardPage() {
  const [marketSummary, setMarketSummary] = useState<MarketSummary | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const { prices, loading: pricesLoading } = useStockPrices({ tickers: DEFAULT_WATCHLIST_TICKERS });

  useEffect(() => {
    fetch("/api/ai/market-summary")
      .then((r) => r.json())
      .then((json) => { if (json.success && json.data) setMarketSummary(json.data); })
      .catch(() => {})
      .finally(() => setLoadingSummary(false));
  }, []);

  const stocks = DEFAULT_WATCHLIST_TICKERS.map((ticker) => {
    const q = prices[ticker];
    const fb = fallbackStocks.find((s) => s.ticker === ticker)!;
    if (q) {
      return {
        ticker,
        name: q.name || fb.name,
        price: q.price,
        change: q.change,
        changePercent: q.changePercent,
        sector: sectorMap[ticker] || "Technology",
      };
    }
    return fb;
  });

  const heatmapItems = stocks.map((s) => ({ ticker: s.ticker, changePercent: s.changePercent }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="font-display text-xl font-bold tracking-tight sm:text-2xl">
            <span className="gradient-text">Dashboard</span>
          </h1>
          <p className="mt-1 text-xs text-muted sm:text-sm">Market overview and portfolio insights</p>
        </div>
        <div className="flex items-center gap-2">
          <GlowBadge variant="success" glow>Market Open</GlowBadge>
          <span className="text-xs text-muted">NYSE 9:30 AM ET</span>
        </div>
      </div>

      {/* Index Tickers */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-4">
        {indices.map((idx) => (
          <GlassCard key={idx.ticker} padding="sm" hover>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase text-muted">{idx.ticker}</p>
                <p className="font-mono text-base font-bold sm:text-lg">{idx.value.toLocaleString()}</p>
              </div>
              <span
                className={cn(
                  "font-mono text-xs font-bold",
                  idx.change >= 0 ? "text-positive" : "text-negative"
                )}
              >
                {idx.change >= 0 ? "+" : ""}
                {idx.change.toFixed(2)}%
              </span>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Portfolio Metrics */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricGlass label="Portfolio Value" value="$124,847" change={2.34} prefix="$" />
        <MetricGlass label="Daily P&L" value="+$2,891" change={2.36} />
        <MetricGlass label="Active Alerts" value="7" />
        <MetricGlass label="Watchlist" value="12" />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Watchlist Hub — 2 cols */}
        <GlassCard className="lg:col-span-2" padding="none">
          <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-accent" />
              <h2 className="font-display text-sm font-semibold">Watchlist</h2>
            </div>
            <Link href="/watchlist" className="flex items-center gap-1 text-[10px] text-muted hover:text-foreground">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {stocks.map((stock) => (
              <Link
                key={stock.ticker}
                href={`/stock/${stock.ticker}`}
                className="flex items-center gap-2 px-3 py-2.5 transition-colors hover:bg-white/[0.02] sm:gap-4 sm:px-4 sm:py-3"
              >
                <div className="w-14 sm:w-20">
                  <p className="font-mono text-xs font-bold">{stock.ticker}</p>
                  <p className="text-[10px] text-muted hidden sm:block">{stock.sector}</p>
                </div>
                <div className="hidden flex-1 sm:block">
                  <MiniSparkline
                    data={generateSparkData(stock.price, stock.change >= 0)}
                    positive={stock.change >= 0}
                    width={100}
                    height={28}
                  />
                </div>
                <div className="ml-auto text-right">
                  <p className="font-mono text-xs font-bold sm:text-sm">{formatCurrency(stock.price)}</p>
                  <p
                    className={cn(
                      "font-mono text-[10px] font-bold sm:text-xs",
                      stock.change >= 0 ? "text-positive" : "text-negative"
                    )}
                  >
                    {stock.change >= 0 ? "+" : ""}
                    {stock.change.toFixed(2)} ({formatPercent(stock.changePercent)})
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </GlassCard>

        {/* AI Predictions */}
        <GlassCard padding="none">
          <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-cyan" />
              <h2 className="font-display text-sm font-semibold">AI Predictions</h2>
            </div>
            <Link href="/predictions" className="flex items-center gap-1 text-[10px] text-muted hover:text-foreground">
              All <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {predictions.map((pred) => (
              <div key={pred.ticker} className="px-3 py-2.5 sm:px-4 sm:py-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold">{pred.ticker}</span>
                  <GlowBadge
                    variant={pred.direction === "bullish" ? "success" : "danger"}
                    glow
                  >
                    {pred.direction}
                  </GlowBadge>
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-xs text-muted">{pred.timeframe} target</span>
                  <span className="font-mono text-xs font-bold">
                    {formatCurrency(pred.price)}
                  </span>
                </div>
                <div className="mt-1.5 h-1 w-full rounded-full bg-white/[0.05]">
                  <div
                    className={cn(
                      "h-1 rounded-full",
                      pred.direction === "bullish" ? "bg-positive" : "bg-negative"
                    )}
                    style={{ width: `${pred.confidence * 100}%` }}
                  />
                </div>
                <p className="mt-0.5 text-right text-[10px] text-muted sm:text-xs">
                  {Math.round(pred.confidence * 100)}% confidence
                </p>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Heatmap + Activity + Market Summary */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Heatmap */}
        <GlassCard className="lg:col-span-2">
          <div className="mb-3 flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber" />
            <h2 className="font-display text-sm font-semibold">Market Heatmap</h2>
          </div>
          <HeatmapGrid items={heatmapItems} size="md" onClick={(t) => window.location.href = `/stock/${t}`} />
        </GlassCard>

        {/* Market Summary */}
        <MarketSummaryCard data={marketSummary} isLoading={loadingSummary} />
      </div>

      {/* Recent Activity */}
      <GlassCard padding="none">
        <div className="border-b border-white/[0.06] px-4 py-3">
          <h2 className="font-display text-sm font-semibold">Activity</h2>
        </div>
        <div className="divide-y divide-white/[0.04]">
          {recentActivity.map((item, i) => (
            <div key={i} className="flex items-start gap-3 px-4 py-3">
              <div className={cn("mt-0.5", item.color)}>
                <item.icon className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1">
                <p className="text-xs">{item.label}</p>
                <p className="text-[10px] text-muted">{item.time}</p>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Quick Links */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { href: "/market", label: "Markets", icon: BarChart3, color: "text-cyan" },
          { href: "/portfolio", label: "Portfolio", icon: Briefcase, color: "text-purple" },
          { href: "/risk", label: "Risk", icon: TrendingDown, color: "text-amber" },
          { href: "/earnings", label: "Earnings", icon: Zap, color: "text-green" },
        ].map((link) => (
          <Link key={link.href} href={link.href}>
            <GlassCard hover className="text-center">
              <link.icon className={cn("mx-auto mb-2 h-5 w-5", link.color)} />
              <p className="text-xs font-medium">{link.label}</p>
            </GlassCard>
          </Link>
        ))}
      </div>
    </div>
  );
}
