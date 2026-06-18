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
import { formatCurrency, formatCompact, formatPercent } from "@/lib/utils";
import { cn } from "@/lib/utils";

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

const watchlistStocks: WatchlistStock[] = [
  { id: "1", ticker: "AAPL", name: "Apple Inc.", price: 214.29, change: 1.82, changePercent: 0.86, volume: 52_700_000, marketCap: 3.28e12, status: "watching", sector: "Technology" },
  { id: "2", ticker: "MSFT", name: "Microsoft Corp.", price: 450.37, change: 5.63, changePercent: 1.27, volume: 28_400_000, marketCap: 3.35e12, status: "interested", sector: "Technology" },
  { id: "3", ticker: "NVDA", name: "NVIDIA Corp.", price: 143.71, change: 3.28, changePercent: 2.34, volume: 89_100_000, marketCap: 3.51e12, status: "watching", sector: "Technology" },
  { id: "4", ticker: "GOOGL", name: "Alphabet Inc.", price: 176.44, change: -2.31, changePercent: -1.29, volume: 31_800_000, marketCap: 2.17e12, status: "watching", sector: "Technology" },
  { id: "5", ticker: "TSLA", name: "Tesla Inc.", price: 322.56, change: 12.44, changePercent: 4.02, volume: 118_200_000, marketCap: 1.04e12, status: "pending", sector: "Automotive" },
  { id: "6", ticker: "AMZN", name: "Amazon.com Inc.", price: 219.39, change: -0.87, changePercent: -0.39, volume: 42_100_000, marketCap: 2.29e12, status: "interested", sector: "E-Commerce" },
  { id: "7", ticker: "META", name: "Meta Platforms Inc.", price: 612.77, change: 8.91, changePercent: 1.47, volume: 18_300_000, marketCap: 1.56e12, status: "watching", sector: "Technology" },
  { id: "8", ticker: "JPM", name: "JPMorgan Chase & Co.", price: 267.43, change: -1.24, changePercent: -0.46, volume: 9_800_000, marketCap: 771e9, status: "watching", sector: "Financial" },
];

function generateSparkData(base: number, positive: boolean): number[] {
  const data: number[] = [];
  let value = base * 0.98;
  for (let i = 0; i < 20; i++) {
    value += (Math.random() - 0.48) * (base * 0.008);
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

  const filtered = watchlistStocks.filter(
    (s) =>
      s.ticker.toLowerCase().includes(search.toLowerCase()) ||
      s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            <span className="gradient-text">Watchlist</span>
          </h1>
          <p className="mt-1 text-sm text-muted">Stocks you&apos;re monitoring</p>
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
            className="w-full rounded-lg border border-white/[0.06] bg-white/[0.03] py-2 pl-9 pr-8 text-xs text-foreground placeholder:text-muted focus:border-accent/30 focus:outline-none focus:ring-1 focus:ring-accent/20"
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
        <div className="flex rounded-lg border border-white/[0.06] bg-white/[0.03] p-0.5">
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
                <tr className="border-b border-white/[0.04] text-left text-[10px] uppercase text-muted">
                  <th className="px-4 py-2 font-medium">Stock</th>
                  <th className="px-4 py-2 text-right font-medium">Price</th>
                  <th className="px-4 py-2 text-right font-medium">Change</th>
                  <th className="px-4 py-2 text-right font-medium">Volume</th>
                  <th className="px-4 py-2 text-right font-medium">Mkt Cap</th>
                  <th className="px-4 py-2 text-right font-medium">Trend</th>
                  <th className="px-4 py-2 text-right font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filtered.map((stock) => (
                  <tr key={stock.id} className="hover:bg-white/[0.02]">
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
