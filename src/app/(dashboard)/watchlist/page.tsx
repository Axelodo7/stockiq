"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Plus,
  Star,
  TrendingUp,
  TrendingDown,
  LayoutGrid,
  List,
  Search,
  X,
} from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { GlowBadge } from "@/components/ui/glow-badge";
import { GradientButton } from "@/components/ui/gradient-button";
import { MiniSparkline } from "@/components/charts/mini-sparkline";
import { formatCurrency, formatCompact, formatPercent, cn, seededRandom } from "@/lib/utils";
import { useStockPrices } from "@/hooks/use-stock-prices";

interface WatchlistStock {
  id: string;
  ticker: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  status: "watching" | "interested" | "pending";
  sector: string;
}

const WATCHLIST_TICKERS = ["AAPL", "MSFT", "NVDA", "GOOGL", "TSLA", "AMZN", "META", "JPM"];

const fallbackStocks: WatchlistStock[] = [
  { id: "1", ticker: "AAPL", name: "Apple Inc.", price: 298.01, change: 2.06, changePercent: 0.70, volume: 76_700_000, marketCap: 4.62e12, status: "watching", sector: "Technology" },
  { id: "2", ticker: "MSFT", name: "Microsoft Corp.", price: 379.40, change: 0.49, changePercent: 0.13, volume: 58_466_000, marketCap: 2.82e12, status: "interested", sector: "Technology" },
  { id: "3", ticker: "NVDA", name: "NVIDIA Corp.", price: 210.69, change: 6.04, changePercent: 2.95, volume: 238_264_000, marketCap: 5.13e12, status: "watching", sector: "Technology" },
  { id: "4", ticker: "GOOGL", name: "Alphabet Inc.", price: 368.03, change: 4.24, changePercent: 1.17, volume: 44_359_000, marketCap: 2.15e12, status: "watching", sector: "Technology" },
  { id: "5", ticker: "TSLA", name: "Tesla Inc.", price: 400.49, change: 4.11, changePercent: 1.04, volume: 54_706_000, marketCap: 1.29e12, status: "pending", sector: "Automotive" },
  { id: "6", ticker: "AMZN", name: "Amazon.com Inc.", price: 220.12, change: -0.87, changePercent: -0.39, volume: 42_100_000, marketCap: 2.32e12, status: "interested", sector: "E-Commerce" },
  { id: "7", ticker: "META", name: "Meta Platforms Inc.", price: 612.77, change: 8.91, changePercent: 1.47, volume: 18_300_000, marketCap: 1.56e12, status: "watching", sector: "Technology" },
  { id: "8", ticker: "JPM", name: "JPMorgan Chase & Co.", price: 267.43, change: -1.24, changePercent: -0.46, volume: 9_800_000, marketCap: 771e9, status: "watching", sector: "Financial" },
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

const statusConfig: Record<string, { label: string; variant: "success" | "warning" | "default" }> = {
  watching: { label: "Watching", variant: "success" },
  interested: { label: "Interested", variant: "warning" },
  pending: { label: "Pending", variant: "default" },
};

export default function WatchlistPage() {
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [search, setSearch] = useState("");
  const { prices } = useStockPrices({ tickers: WATCHLIST_TICKERS });

  const watchlistStocks: WatchlistStock[] = WATCHLIST_TICKERS.map((ticker) => {
    const q = prices[ticker];
    const fb = fallbackStocks.find((s) => s.ticker === ticker)!;
    if (q) {
      return {
        ...fb,
        price: q.price,
        change: q.change,
        changePercent: q.changePercent,
        volume: q.volume || fb.volume,
      };
    }
    return fb;
  });

  const filtered = watchlistStocks.filter(
    (s) =>
      s.ticker.toLowerCase().includes(search.toLowerCase()) ||
      s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="font-display text-xl font-bold tracking-tight sm:text-2xl">
            <span className="gradient-text">Watchlist</span>
          </h1>
          <p className="mt-1 text-xs text-muted sm:text-sm">Stocks you&apos;re monitoring</p>
        </div>
        <GradientButton variant="brand" size="sm">
          <Plus className="h-3.5 w-3.5" />
          Add Stock
        </GradientButton>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Search watchlist..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-panel-elevated py-2 pl-9 pr-8 text-xs text-foreground placeholder:text-muted focus:border-accent/30 focus:outline-none focus:ring-1 focus:ring-accent/20"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
        <GlowBadge variant="default">{filtered.length} stocks</GlowBadge>
        <div className="flex rounded-lg border border-border bg-panel-elevated p-0.5">
          <button
            onClick={() => setViewMode("grid")}
            className={cn(
              "rounded-md p-1.5 transition-colors",
              viewMode === "grid" ? "bg-accent/20 text-accent" : "text-muted hover:text-foreground"
            )}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setViewMode("table")}
            className={cn(
              "rounded-md p-1.5 transition-colors",
              viewMode === "table" ? "bg-accent/20 text-accent" : "text-muted hover:text-foreground"
            )}
          >
            <List className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Grid View */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((stock) => (
            <Link key={stock.id} href={`/stock/${stock.ticker}`}>
              <GlassCard hover className="group">
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold">{stock.ticker}</span>
                      <GlowBadge variant={statusConfig[stock.status].variant}>
                        {statusConfig[stock.status].label}
                      </GlowBadge>
                    </div>
                    <p className="mt-0.5 text-[10px] text-muted">{stock.name}</p>
                  </div>
                  <Star className="h-4 w-4 text-amber fill-amber" />
                </div>
                <MiniSparkline
                  data={generateSparkData(stock.price, stock.change >= 0)}
                  positive={stock.change >= 0}
                  width={200}
                  height={40}
                />
                <div className="mt-3 flex items-end justify-between">
                  <p className="font-mono text-lg font-bold">{formatCurrency(stock.price)}</p>
                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      {stock.change >= 0 ? (
                        <TrendingUp className="h-3 w-3 text-positive" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-negative" />
                      )}
                      <span
                        className={cn(
                          "font-mono text-xs font-bold",
                          stock.change >= 0 ? "text-positive" : "text-negative"
                        )}
                      >
                        {stock.change >= 0 ? "+" : ""}
                        {stock.changePercent.toFixed(2)}%
                      </span>
                    </div>
                    <p className="text-[10px] text-muted">{formatCompact(stock.volume)} vol</p>
                  </div>
                </div>
              </GlassCard>
            </Link>
          ))}
        </div>
      ) : (
        /* Table View */
        <GlassCard padding="none">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase text-muted">
                  <th className="px-4 py-2 font-medium">Stock</th>
                  <th className="px-4 py-2 text-right font-medium">Price</th>
                  <th className="px-4 py-2 text-right font-medium">Change</th>
                  <th className="px-4 py-2 text-right font-medium">Volume</th>
                  <th className="px-4 py-2 text-right font-medium">Mkt Cap</th>
                  <th className="px-4 py-2 text-right font-medium">Trend</th>
                  <th className="px-4 py-2 text-right font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((stock) => (
                  <tr key={stock.id} className="hover:bg-panel">
                    <td className="px-4 py-3">
                      <Link href={`/stock/${stock.ticker}`} className="flex items-center gap-2">
                        <Star className="h-3 w-3 text-amber fill-amber" />
                        <div>
                          <p className="font-mono text-xs font-bold">{stock.ticker}</p>
                          <p className="text-[10px] text-muted">{stock.name}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold">
                      {formatCurrency(stock.price)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {stock.change >= 0 ? (
                          <TrendingUp className="h-3 w-3 text-positive" />
                        ) : (
                          <TrendingDown className="h-3 w-3 text-negative" />
                        )}
                        <span
                          className={cn(
                            "font-mono font-bold",
                            stock.change >= 0 ? "text-positive" : "text-negative"
                          )}
                        >
                          {stock.change >= 0 ? "+" : ""}
                          {stock.changePercent.toFixed(2)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-muted">
                      {formatCompact(stock.volume)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-muted">
                      {formatCompact(stock.marketCap)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <MiniSparkline
                        data={generateSparkData(stock.price, stock.change >= 0)}
                        positive={stock.change >= 0}
                        width={60}
                        height={20}
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <GlowBadge variant={statusConfig[stock.status].variant}>
                        {statusConfig[stock.status].label}
                      </GlowBadge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}
    </div>
  );
}
