"use client";

import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  ArrowRight,
  Globe,
  Activity,
} from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { GlowBadge } from "@/components/ui/glow-badge";
import { MiniSparkline } from "@/components/charts/mini-sparkline";
import { HeatmapGrid } from "@/components/charts/heatmap-grid";
import { SectorMap } from "@/components/charts/sector-map";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { cn, seededRandom } from "@/lib/utils";
import { useStockPrices } from "@/hooks/use-stock-prices";

const indices = [
  { ticker: "SPX", name: "S&P 500", value: 5842.31, change: 0.67, high: 5856.20, low: 5801.44 },
  { ticker: "IXIC", name: "NASDAQ", value: 18439.17, change: 1.12, high: 18502.30, low: 18291.05 },
  { ticker: "DJI", name: "Dow Jones", value: 43127.58, change: 0.34, high: 43210.00, low: 42980.12 },
  { ticker: "RUT", name: "Russell 2000", value: 2241.83, change: -0.21, high: 2258.40, low: 2235.10 },
  { ticker: "VIX", name: "VIX", value: 14.23, change: -5.21, high: 15.10, low: 13.80 },
  { ticker: "TNX", name: "10Y Treasury", value: 4.312, change: 0.08, high: 4.325, low: 4.290 },
];

const sectors = [
  { name: "Technology", changePercent: 1.24, marketCap: 15200 },
  { name: "Healthcare", changePercent: 0.47, marketCap: 7100 },
  { name: "Financial", changePercent: -0.32, marketCap: 8900 },
  { name: "Consumer Disc.", changePercent: 0.88, marketCap: 5800 },
  { name: "Energy", changePercent: -1.15, marketCap: 3200 },
  { name: "Industrials", changePercent: 0.21, marketCap: 4600 },
  { name: "Utilities", changePercent: -0.08, marketCap: 1800 },
  { name: "Real Estate", changePercent: -0.45, marketCap: 1200 },
  { name: "Materials", changePercent: 0.56, marketCap: 2100 },
  { name: "Communication", changePercent: 0.93, marketCap: 3400 },
  { name: "Consumer Staples", changePercent: -0.14, marketCap: 3900 },
];

const STOCK_TICKERS = ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "NVDA", "META", "JPM", "V", "JNJ", "WMT", "XOM"];

const fallbackStocks = [
  { ticker: "AAPL", name: "Apple Inc.", price: 298.01, change: 2.06, changePercent: 0.70, sector: "Technology" },
  { ticker: "MSFT", name: "Microsoft Corp.", price: 379.40, change: 0.49, changePercent: 0.13, sector: "Technology" },
  { ticker: "GOOGL", name: "Alphabet Inc.", price: 368.03, change: 4.24, changePercent: 1.17, sector: "Technology" },
  { ticker: "AMZN", name: "Amazon.com Inc.", price: 220.12, change: -0.87, changePercent: -0.39, sector: "E-Commerce" },
  { ticker: "TSLA", name: "Tesla Inc.", price: 400.49, change: 4.11, changePercent: 1.04, sector: "Automotive" },
  { ticker: "NVDA", name: "NVIDIA Corp.", price: 210.69, change: 6.04, changePercent: 2.95, sector: "Technology" },
  { ticker: "META", name: "Meta Platforms", price: 612.77, change: 8.91, changePercent: 1.47, sector: "Technology" },
  { ticker: "JPM", name: "JPMorgan Chase", price: 267.43, change: -1.24, changePercent: -0.46, sector: "Financial" },
  { ticker: "V", name: "Visa Inc.", price: 320.15, change: 2.04, changePercent: 0.64, sector: "Financial" },
  { ticker: "JNJ", name: "Johnson & Johnson", price: 156.30, change: 0.41, changePercent: 0.26, sector: "Healthcare" },
  { ticker: "WMT", name: "Walmart Inc.", price: 97.12, change: -0.32, changePercent: -0.33, sector: "Consumer Staples" },
  { ticker: "XOM", name: "Exxon Mobil", price: 109.45, change: -1.84, changePercent: -1.66, sector: "Energy" },
];

const sectorMap: Record<string, string> = {
  AAPL: "Technology", MSFT: "Technology", GOOGL: "Technology", AMZN: "E-Commerce",
  TSLA: "Automotive", NVDA: "Technology", META: "Technology", NFLX: "Entertainment",
  JPM: "Financial", V: "Financial", JNJ: "Healthcare", WMT: "Consumer Staples", XOM: "Energy",
};

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

export default function MarketPage() {
  const { prices } = useStockPrices({ tickers: STOCK_TICKERS });

  const stocks = STOCK_TICKERS.map((ticker) => {
    const q = prices[ticker];
    const fb = fallbackStocks.find((s) => s.ticker === ticker)!;
    if (q) {
      return {
        ticker,
        name: q.name || fb.name,
        price: q.price,
        change: q.change,
        changePercent: q.changePercent,
        sector: sectorMap[ticker] || fb.sector,
      };
    }
    return fb;
  });

  const gainers = [...stocks].sort((a, b) => b.changePercent - a.changePercent).slice(0, 5);
  const losers = [...stocks].sort((a, b) => a.changePercent - b.changePercent).slice(0, 5);
  const mostActive = [...stocks].sort((a, b) => {
    const volA = a.price * (seededRandom(a.price * 100)() * 100);
    const volB = b.price * (seededRandom(b.price * 100)() * 100);
    return volB - volA;
  }).slice(0, 5);

  const heatmapItems = stocks.map((s) => ({ ticker: s.ticker, changePercent: s.changePercent }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="font-display text-xl font-bold tracking-tight sm:text-2xl">
            <span className="gradient-text">Markets</span>
          </h1>
          <p className="mt-1 text-xs text-muted sm:text-sm">Indices, sectors, and market-wide performance</p>
        </div>
        <GlowBadge variant="success" glow>Market Open</GlowBadge>
      </div>

      {/* Indices Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {indices.map((idx) => (
          <GlassCard key={idx.ticker} padding="sm" hover>
            <p className="text-[10px] font-medium uppercase text-muted">{idx.ticker}</p>
            <p className="font-mono text-lg font-bold">{idx.value.toLocaleString()}</p>
            <span
              className={cn(
                "font-mono text-xs font-bold",
                idx.change >= 0 ? "text-positive" : "text-negative"
              )}
            >
              {idx.change >= 0 ? "+" : ""}
              {idx.change.toFixed(2)}%
            </span>
          </GlassCard>
        ))}
      </div>

      {/* Heatmap + Sector Map */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <GlassCard>
          <div className="mb-3 flex items-center gap-2">
            <Globe className="h-4 w-4 text-cyan" />
            <h2 className="font-display text-sm font-semibold">Market Heatmap</h2>
          </div>
          <HeatmapGrid items={heatmapItems} size="lg" onClick={(t) => window.location.href = `/stock/${t}`} />
        </GlassCard>

        <GlassCard>
          <div className="mb-3 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-purple" />
            <h2 className="font-display text-sm font-semibold">Sector Performance</h2>
          </div>
          <SectorMap sectors={sectors} />
        </GlassCard>
      </div>

      {/* Sector Table */}
      <GlassCard padding="none">
        <div className="border-b border-white/[0.06] px-4 py-3">
          <h2 className="font-display text-sm font-semibold">All Sectors</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/[0.04] text-left text-xs uppercase text-muted">
                <th className="px-4 py-2 font-medium">Sector</th>
                <th className="px-4 py-2 text-right font-medium">Mkt Cap</th>
                <th className="px-4 py-2 text-right font-medium">Day Change</th>
                <th className="px-4 py-2 text-right font-medium">Performance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {sectors.map((s) => (
                <tr key={s.name} className="hover:bg-white/[0.02]">
                  <td className="px-4 py-2.5 font-medium">{s.name}</td>
                  <td className="px-4 py-2.5 text-right font-mono">
                    {s.marketCap >= 1000 ? `$${(s.marketCap / 1000).toFixed(1)}T` : `$${s.marketCap}B`}
                  </td>
                  <td
                    className={cn(
                      "px-4 py-2.5 text-right font-mono font-bold",
                      s.changePercent >= 0 ? "text-positive" : "text-negative"
                    )}
                  >
                    {s.changePercent >= 0 ? "+" : ""}
                    {s.changePercent.toFixed(2)}%
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <div className="ml-auto h-1.5 w-24 rounded-full bg-white/[0.05]">
                      <div
                        className={cn(
                          "h-1.5 rounded-full",
                          s.changePercent >= 0 ? "bg-positive" : "bg-negative"
                        )}
                        style={{ width: `${Math.min(Math.abs(s.changePercent) * 20, 100)}%` }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Top Movers */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {[
          { title: "Top Gainers", icon: TrendingUp, data: gainers, color: "text-positive" },
          { title: "Top Losers", icon: TrendingDown, data: losers, color: "text-negative" },
          { title: "Most Active", icon: Activity, data: mostActive, color: "text-cyan" },
        ].map((section) => (
          <GlassCard key={section.title} padding="none">
            <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
              <div className="flex items-center gap-2">
                <section.icon className={cn("h-4 w-4", section.color)} />
                <h2 className="font-display text-sm font-semibold">{section.title}</h2>
              </div>
            </div>
            <div className="divide-y divide-white/[0.04]">
              {section.data.map((stock) => (
                <Link
                  key={stock.ticker}
                  href={`/stock/${stock.ticker}`}
                  className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-white/[0.02]"
                >
                  <div className="flex-1">
                    <p className="font-mono text-xs font-bold">{stock.ticker}</p>
                    <p className="text-[10px] text-muted">{stock.name}</p>
                  </div>
                  <div className="w-16">
                    <MiniSparkline
                      data={generateSparkData(stock.price, stock.change >= 0)}
                      positive={stock.change >= 0}
                      width={64}
                      height={20}
                    />
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-xs font-bold">{formatCurrency(stock.price)}</p>
                    <p
                      className={cn(
                        "font-mono text-[10px] font-bold",
                        stock.changePercent >= 0 ? "text-positive" : "text-negative"
                      )}
                    >
                      {stock.changePercent >= 0 ? "+" : ""}
                      {stock.changePercent.toFixed(2)}%
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Full Stock Table */}
      <GlassCard padding="none">
        <div className="border-b border-white/[0.06] px-4 py-3">
          <h2 className="font-display text-sm font-semibold">All Stocks</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/[0.04] text-left text-xs uppercase text-muted">
                <th className="px-4 py-2 font-medium">Ticker</th>
                <th className="px-4 py-2 font-medium">Company</th>
                <th className="px-4 py-2 font-medium">Sector</th>
                <th className="px-4 py-2 text-right font-medium">Price</th>
                <th className="px-4 py-2 text-right font-medium">Change</th>
                <th className="px-4 py-2 text-right font-medium">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {stocks.map((stock) => (
                <tr key={stock.ticker} className="hover:bg-white/[0.02]">
                  <td className="px-4 py-2.5">
                    <Link href={`/stock/${stock.ticker}`} className="font-mono font-bold hover:text-accent">
                      {stock.ticker}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5">{stock.name}</td>
                  <td className="px-4 py-2.5 text-muted">{stock.sector}</td>
                  <td className="px-4 py-2.5 text-right font-mono font-bold">
                    {formatCurrency(stock.price)}
                  </td>
                  <td
                    className={cn(
                      "px-4 py-2.5 text-right font-mono font-bold",
                      stock.changePercent >= 0 ? "text-positive" : "text-negative"
                    )}
                  >
                    {stock.changePercent >= 0 ? "+" : ""}
                    {stock.changePercent.toFixed(2)}%
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <MiniSparkline
                      data={generateSparkData(stock.price, stock.change >= 0)}
                      positive={stock.change >= 0}
                      width={60}
                      height={20}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
