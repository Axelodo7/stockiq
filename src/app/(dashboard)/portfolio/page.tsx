"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  Plus,
  Briefcase,
  Trash2,
  Search,
  X,
} from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { MetricGlass } from "@/components/ui/metric-glass";
import { GlowBadge } from "@/components/ui/glow-badge";
import { GradientButton } from "@/components/ui/gradient-button";
import { EquityCurveChart } from "@/components/charts/equity-curve";
import { PortfolioAllocation } from "@/components/charts/portfolio-allocation";
import { MiniSparkline } from "@/components/charts/mini-sparkline";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { formatCurrency, formatPercent, formatCompact, cn, seededRandom } from "@/lib/utils";
import { getStockInfo, stockData } from "@/lib/services/market-mock";

interface Position {
  id: string;
  ticker: string;
  name: string;
  shares: number;
  avgCost: number;
}

const STORAGE_KEY = "stockiq_portfolio_positions";
const COLORS = ["#00d4ff", "#00e676", "#ffab00", "#ff1744", "#7c4dff", "#00bfa5", "#ff9100", "#d500f9"];

function loadPositions(): Position[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function savePositions(positions: Position[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
}

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

const allTickers = Object.keys(stockData);

export default function PortfolioPage() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
  const [shares, setShares] = useState("");
  const [avgCost, setAvgCost] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setPositions(loadPositions());
    setMounted(true);
  }, []);

  const searchUpper = search.toUpperCase().trim();
  const isValidTicker = /^[A-Z]{1,6}$/.test(searchUpper);
  const isKnownTicker = allTickers.includes(searchUpper);

  const filteredTickers = allTickers.filter(
    (t) =>
      t.toLowerCase().includes(search.toLowerCase()) ||
      stockData[t].name.toLowerCase().includes(search.toLowerCase())
  );

  const showCustomOption = isValidTicker && !isKnownTicker && !selectedTicker && search.length > 0;

  const addPosition = useCallback(() => {
    if (!selectedTicker || !shares || !avgCost) return;
    const numShares = parseFloat(shares);
    const numCost = parseFloat(avgCost);
    if (isNaN(numShares) || numShares <= 0 || isNaN(numCost) || numCost <= 0) return;

    const info = getStockInfo(selectedTicker);
    const newPos: Position = {
      id: Date.now().toString(),
      ticker: selectedTicker.toUpperCase(),
      name: info.name,
      shares: numShares,
      avgCost: numCost,
    };

    const updated = [...positions, newPos];
    setPositions(updated);
    savePositions(updated);
    setDialogOpen(false);
    setSearch("");
    setSelectedTicker(null);
    setShares("");
    setAvgCost("");
  }, [positions, selectedTicker, shares, avgCost]);

  const removePosition = useCallback(
    (id: string) => {
      const updated = positions.filter((p) => p.id !== id);
      setPositions(updated);
      savePositions(updated);
    },
    [positions]
  );

  const enriched = positions.map((p) => {
    const info = getStockInfo(p.ticker);
    const currentPrice = info.price;
    return {
      ...p,
      currentPrice,
      totalCost: p.shares * p.avgCost,
      currentValue: p.shares * currentPrice,
      gainLoss: (currentPrice - p.avgCost) * p.shares,
      gainLossPercent: ((currentPrice - p.avgCost) / p.avgCost) * 100,
    };
  });

  const totalValue = enriched.reduce((sum, p) => sum + p.currentValue, 0);
  const totalCost = enriched.reduce((sum, p) => sum + p.totalCost, 0);
  const totalGainLoss = totalValue - totalCost;
  const totalGainLossPercent = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;
  const dayChange = totalValue * 0.0234;

  if (!mounted) {
    return (
      <div className="space-y-6">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="font-display text-xl font-bold tracking-tight sm:text-2xl">
              <span className="gradient-text">Portfolio</span>
            </h1>
            <p className="mt-1 text-xs text-muted sm:text-sm">Track your positions and performance</p>
          </div>
        </div>
        <GlassCard>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Briefcase className="mb-4 h-10 w-10 text-muted" />
            <p className="text-sm text-muted">Loading...</p>
          </div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="font-display text-xl font-bold tracking-tight sm:text-2xl">
            <span className="gradient-text">Portfolio</span>
          </h1>
          <p className="mt-1 text-xs text-muted sm:text-sm">Track your positions and performance</p>
        </div>
        <GradientButton variant="brand" size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="h-3.5 w-3.5" />
          Add Position
        </GradientButton>
      </div>

      {positions.length === 0 ? (
        /* Empty State */
        <GlassCard>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10">
              <Briefcase className="h-8 w-8 text-accent" />
            </div>
            <h3 className="mb-1 font-display text-lg font-semibold">No positions yet</h3>
            <p className="mb-6 max-w-sm text-sm text-muted">
              Add your first position to start tracking your portfolio performance and allocation.
            </p>
            <GradientButton variant="brand" size="md" onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              Add Your First Position
            </GradientButton>
          </div>
        </GlassCard>
      ) : (
        <>
          {/* Portfolio Metrics */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MetricGlass label="Total Value" value={`$${formatCompact(totalValue)}`} change={totalGainLossPercent} />
            <MetricGlass label="Day Change" value={`+$${formatCompact(dayChange)}`} change={2.34} />
            <MetricGlass label="Total Return" value={formatCurrency(totalGainLoss)} change={totalGainLossPercent} />
            <MetricGlass label="Positions" value={positions.length.toString()} />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <GlassCard className="lg:col-span-2">
              <div className="mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-cyan" />
                <h2 className="font-display text-sm font-semibold">Equity Curve</h2>
              </div>
              <EquityCurveChart
                data={[
                  { date: "2024-01-01", equity: totalCost * 0.85 },
                  { date: "2024-02-01", equity: totalCost * 0.90 },
                  { date: "2024-03-01", equity: totalCost * 0.93 },
                  { date: "2024-04-01", equity: totalCost * 0.97 },
                  { date: "2024-05-01", equity: totalCost * 1.01 },
                  { date: "2024-06-01", equity: totalValue },
                ]}
                benchmark={[
                  { date: "2024-01-01", value: totalCost * 0.85 },
                  { date: "2024-02-01", value: totalCost * 0.87 },
                  { date: "2024-03-01", value: totalCost * 0.89 },
                  { date: "2024-04-01", value: totalCost * 0.91 },
                  { date: "2024-05-01", value: totalCost * 0.93 },
                  { date: "2024-06-01", value: totalCost * 0.95 },
                ]}
                height={280}
              />
            </GlassCard>

            <GlassCard>
              <div className="mb-3 flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-purple" />
                <h2 className="font-display text-sm font-semibold">Allocation</h2>
              </div>
              <PortfolioAllocation
                items={enriched.map((p, i) => ({
                  name: p.ticker,
                  value: p.currentValue,
                  color: COLORS[i % COLORS.length],
                  percent: (p.currentValue / totalValue) * 100,
                }))}
              />
            </GlassCard>
          </div>

          {/* Positions Table */}
          <GlassCard padding="none">
            <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-accent" />
                <h2 className="font-display text-sm font-semibold">Positions</h2>
              </div>
              <GlowBadge variant="default">{positions.length} holdings</GlowBadge>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/[0.04] text-left text-xs uppercase text-muted">
                    <th className="px-4 py-2 font-medium">Stock</th>
                    <th className="px-4 py-2 text-right font-medium">Shares</th>
                    <th className="px-4 py-2 text-right font-medium">Avg Cost</th>
                    <th className="px-4 py-2 text-right font-medium">Current</th>
                    <th className="px-4 py-2 text-right font-medium">Value</th>
                    <th className="px-4 py-2 text-right font-medium">Gain/Loss</th>
                    <th className="px-4 py-2 text-right font-medium">Trend</th>
                    <th className="px-4 py-2 text-right font-medium"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {enriched.map((p) => (
                    <tr key={p.id} className="hover:bg-white/[0.02]">
                      <td className="px-4 py-3">
                        <Link href={`/stock/${p.ticker}`} className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 font-mono text-[10px] font-bold text-accent">
                            {p.ticker.slice(0, 2)}
                          </div>
                          <div>
                            <p className="font-mono text-xs font-bold">{p.ticker}</p>
                            <p className="text-[10px] text-muted">{p.name}</p>
                          </div>
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-right font-mono">{p.shares}</td>
                      <td className="px-4 py-3 text-right font-mono">{formatCurrency(p.avgCost)}</td>
                      <td className="px-4 py-3 text-right font-mono font-bold">{formatCurrency(p.currentPrice)}</td>
                      <td className="px-4 py-3 text-right font-mono font-bold">{formatCurrency(p.currentValue)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {p.gainLoss >= 0 ? (
                            <TrendingUp className="h-3 w-3 text-positive" />
                          ) : (
                            <TrendingDown className="h-3 w-3 text-negative" />
                          )}
                          <div>
                            <p className={cn("font-mono font-bold", p.gainLoss >= 0 ? "text-positive" : "text-negative")}>
                              {p.gainLoss >= 0 ? "+" : ""}
                              {formatCurrency(p.gainLoss)}
                            </p>
                            <p className={cn("text-[10px] font-mono", p.gainLoss >= 0 ? "text-positive" : "text-negative")}>
                              {formatPercent(p.gainLossPercent)}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <MiniSparkline
                          data={generateSparkData(p.currentPrice, p.gainLoss >= 0)}
                          positive={p.gainLoss >= 0}
                          width={60}
                          height={20}
                        />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => removePosition(p.id)}
                          className="rounded-md p-1.5 text-muted transition-colors hover:bg-red/10 hover:text-red"
                          title="Remove position"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-white/[0.06]">
                    <td className="px-4 py-3 font-bold">Total</td>
                    <td className="px-4 py-3 text-right font-mono text-muted">—</td>
                    <td className="px-4 py-3 text-right font-mono text-muted">—</td>
                    <td className="px-4 py-3 text-right font-mono text-muted">—</td>
                    <td className="px-4 py-3 text-right font-mono text-sm font-bold">{formatCurrency(totalValue)}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={cn("font-mono text-sm font-bold", totalGainLoss >= 0 ? "text-positive" : "text-negative")}>
                        {totalGainLoss >= 0 ? "+" : ""}
                        {formatCurrency(totalGainLoss)}
                      </span>
                    </td>
                    <td className="px-4 py-3"></td>
                    <td className="px-4 py-3"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </GlassCard>
        </>
      )}

      {/* Add Position Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Position</DialogTitle>
            <DialogDescription>
              Search for a stock and enter your position details.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Ticker Search */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted">Stock</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
                <input
                  type="text"
                  placeholder="Search ticker or company..."
                  value={selectedTicker ? `${selectedTicker} — ${stockData[selectedTicker]?.name || ""}` : search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setSelectedTicker(null);
                  }}
                  className="w-full rounded-lg border border-white/[0.06] bg-white/[0.03] py-2 pl-9 pr-8 text-xs text-foreground placeholder:text-muted focus:border-accent/30 focus:outline-none focus:ring-1 focus:ring-accent/20"
                />
                {(search || selectedTicker) && (
                  <button
                    onClick={() => { setSearch(""); setSelectedTicker(null); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
              {!selectedTicker && search && (
                <div className="mt-1 max-h-40 overflow-y-auto rounded-lg border border-white/[0.06] bg-panel">
                  {filteredTickers.length === 0 && !showCustomOption ? (
                    <div className="px-3 py-2 text-xs text-muted">No results found</div>
                  ) : (
                    <>
                      {filteredTickers.slice(0, 8).map((t) => {
                        const info = getStockInfo(t);
                        return (
                          <button
                            key={t}
                            onClick={() => {
                              setSelectedTicker(t);
                              setSearch("");
                              setAvgCost(info.price.toFixed(2));
                            }}
                            className="flex w-full items-center justify-between px-3 py-2 text-left text-xs transition-colors hover:bg-white/[0.04]"
                          >
                            <div>
                              <span className="font-mono font-bold">{t}</span>
                              <span className="ml-2 text-muted">{info.name}</span>
                            </div>
                            <span className="font-mono text-muted">{formatCurrency(info.price)}</span>
                          </button>
                        );
                      })}
                      {showCustomOption && (
                        <button
                          onClick={() => {
                            const info = getStockInfo(searchUpper);
                            setSelectedTicker(searchUpper);
                            setSearch("");
                            setAvgCost(info.price.toFixed(2));
                          }}
                          className="flex w-full items-center justify-between px-3 py-2 text-left text-xs transition-colors hover:bg-white/[0.04] border-t border-white/[0.06]"
                        >
                          <div>
                            <span className="font-mono font-bold">{searchUpper}</span>
                            <span className="ml-2 text-accent">Use this ticker</span>
                          </div>
                          <span className="font-mono text-muted">{formatCurrency(getStockInfo(searchUpper).price)}</span>
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Shares */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted">Shares</label>
              <input
                type="number"
                min="0"
                step="any"
                placeholder="0"
                value={shares}
                onChange={(e) => setShares(e.target.value)}
                className="w-full rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-xs text-foreground placeholder:text-muted focus:border-accent/30 focus:outline-none focus:ring-1 focus:ring-accent/20"
              />
            </div>

            {/* Average Cost */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted">Average Cost per Share</label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={avgCost}
                onChange={(e) => setAvgCost(e.target.value)}
                className="w-full rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-xs text-foreground placeholder:text-muted focus:border-accent/30 focus:outline-none focus:ring-1 focus:ring-accent/20"
              />
            </div>

            {/* Preview */}
            {selectedTicker && shares && avgCost && (
              <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
                <div className="flex justify-between text-xs">
                  <span className="text-muted">Total Cost</span>
                  <span className="font-mono font-bold">
                    {formatCurrency(parseFloat(shares) * parseFloat(avgCost))}
                  </span>
                </div>
                <div className="mt-1 flex justify-between text-xs">
                  <span className="text-muted">Current Value</span>
                  <span className="font-mono font-bold">
                    {formatCurrency(parseFloat(shares) * getStockInfo(selectedTicker).price)}
                  </span>
                </div>
                {parseFloat(avgCost) > 0 && (
                  <div className="mt-1 flex justify-between text-xs">
                    <span className="text-muted">Unrealized P/L</span>
                    <span
                      className={cn(
                        "font-mono font-bold",
                        getStockInfo(selectedTicker).price >= parseFloat(avgCost) ? "text-positive" : "text-negative"
                      )}
                    >
                      {formatPercent(
                        ((getStockInfo(selectedTicker).price - parseFloat(avgCost)) / parseFloat(avgCost)) * 100
                      )}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Submit */}
            <GradientButton
              variant="brand"
              size="md"
              className="w-full"
              disabled={!selectedTicker || !shares || !avgCost}
              onClick={addPosition}
            >
              <Plus className="h-4 w-4" />
              Add Position
            </GradientButton>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
