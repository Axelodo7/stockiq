"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  Plus,
  Briefcase,
  Trash2,
  Search,
  X,
  RefreshCw,
  LogIn,
  Loader2,
} from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { MetricGlass } from "@/components/ui/metric-glass";
import { GlowBadge } from "@/components/ui/glow-badge";
import { GradientButton } from "@/components/ui/gradient-button";
import { EquityCurveChart } from "@/components/charts/equity-curve";
import { PortfolioAllocation } from "@/components/charts/portfolio-allocation";
import { MiniSparkline } from "@/components/charts/mini-sparkline";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { formatCurrency, formatPercent, cn, seededRandom } from "@/lib/utils";
import { getStockInfo, stockData } from "@/lib/services/market-mock";
import { fetchStockQuotes, type RealStockQuote } from "@/lib/services/stock-api";
import { usePortfolio } from "@/hooks/use-portfolio";

const COLORS = ["#00d4ff", "#00e676", "#ffab00", "#ff1744", "#7c4dff", "#00bfa5", "#ff9100", "#d500f9"];

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
  const {
    positions,
    loading,
    error,
    isSignedIn,
    addPosition,
    removePosition,
  } = usePortfolio();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
  const [shares, setShares] = useState("");
  const [avgCost, setAvgCost] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [realPrices, setRealPrices] = useState<Record<string, RealStockQuote>>({});
  const [previewQuote, setPreviewQuote] = useState<RealStockQuote | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const refreshPrices = useCallback(async (force = true) => {
    if (positions.length === 0) return;
    setRefreshing(true);
    const tickers = positions.map((p) => p.stock.ticker);
    const quotes = await fetchStockQuotes(tickers, force);
    setRealPrices(quotes);
    setLastUpdated(new Date());
    setRefreshing(false);
  }, [positions]);

  useEffect(() => {
    if (positions.length > 0) refreshPrices(true);
  }, [positions.length, refreshPrices]);

  // Auto-refresh every 30s
  useEffect(() => {
    if (positions.length === 0) return;
    const interval = setInterval(() => refreshPrices(true), 30_000);
    return () => clearInterval(interval);
  }, [positions.length, refreshPrices]);

  // Fetch real price for selected ticker in dialog
  useEffect(() => {
    if (!selectedTicker) {
      setPreviewQuote(null);
      return;
    }
    fetchStockQuotes([selectedTicker]).then((quotes) => {
      setPreviewQuote(quotes[selectedTicker.toUpperCase()] || null);
    });
  }, [selectedTicker]);

  const searchUpper = search.toUpperCase().trim();
  const isValidTicker = /^[A-Z]{1,10}$/.test(searchUpper);
  const isKnownTicker = allTickers.includes(searchUpper);

  const filteredTickers = allTickers.filter(
    (t) =>
      t.toLowerCase().includes(search.toLowerCase()) ||
      stockData[t].name.toLowerCase().includes(search.toLowerCase())
  );

  const showCustomOption = isValidTicker && !isKnownTicker && !selectedTicker && search.length > 0;

  const handleAddPosition = useCallback(async () => {
    if (!selectedTicker || !shares || !avgCost) return;
    const numShares = parseFloat(shares);
    const numCost = parseFloat(avgCost);
    if (isNaN(numShares) || numShares <= 0 || isNaN(numCost) || numCost <= 0) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      await addPosition({
        stockTicker: selectedTicker.toUpperCase(),
        shares: numShares,
        avgCost: numCost,
      });
      setDialogOpen(false);
      setSearch("");
      setSelectedTicker(null);
      setShares("");
      setAvgCost("");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to add position");
    } finally {
      setSubmitting(false);
    }
  }, [selectedTicker, shares, avgCost, addPosition]);

  const handleRemovePosition = useCallback(
    async (id: string) => {
      try {
        await removePosition(id);
      } catch (err) {
        console.error("Failed to remove position:", err);
      }
    },
    [removePosition]
  );

  const hasRealPrices = positions.length > 0 && positions.every((p) => realPrices[p.stock.ticker]);

  const enriched = useMemo(() => {
    return positions.map((p) => {
      const realQuote = realPrices[p.stock.ticker];
      const mockInfo = getStockInfo(p.stock.ticker);
      const currentPrice = realQuote?.price || mockInfo.price || p.avgCost;
      const stockName = realQuote?.name || p.stock.companyName || mockInfo.name || p.stock.ticker;
      return {
        ...p,
        name: stockName,
        currentPrice,
        totalCost: p.shares * p.avgCost,
        currentValue: p.shares * currentPrice,
        gainLoss: (currentPrice - p.avgCost) * p.shares,
        gainLossPercent: ((currentPrice - p.avgCost) / p.avgCost) * 100,
      };
    });
  }, [positions, realPrices]);

  const totalValue = enriched.reduce((sum, p) => sum + p.currentValue, 0);
  const totalCost = enriched.reduce((sum, p) => sum + p.totalCost, 0);
  const totalGainLoss = totalValue - totalCost;
  const totalGainLossPercent = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;
  const dayChange = enriched.reduce((sum, p) => {
    const realQuote = realPrices[p.stock.ticker];
    if (realQuote) return sum + p.shares * realQuote.change;
    return sum;
  }, 0);

  const totalValueDisplay = hasRealPrices ? `$${totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : "—";
  const dayChangeDisplay = hasRealPrices ? `${dayChange >= 0 ? "+" : ""}$${Math.abs(dayChange).toLocaleString(undefined, { maximumFractionDigits: 0 })}` : "—";
  const dayChangePercent = hasRealPrices && totalValue > 0 ? (dayChange / totalValue) * 100 : 0;
  const totalReturnDisplay = hasRealPrices ? formatCurrency(totalGainLoss) : "—";

  // Not signed in
  if (isSignedIn === false) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-xl font-bold tracking-tight sm:text-2xl">
            <span className="gradient-text">Portfolio</span>
          </h1>
          <p className="mt-1 text-xs text-muted sm:text-sm">Track your positions and performance</p>
        </div>
        <GlassCard>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-accent/10">
              <LogIn className="h-8 w-8 text-accent" />
            </div>
            <h3 className="mb-1 font-display text-lg font-semibold">Sign in to access your portfolio</h3>
            <p className="mb-6 max-w-sm text-sm text-muted">
              Your portfolio is synced across devices and secured to your account.
            </p>
            <Link href="/sign-in">
              <GradientButton variant="brand" size="md">
                <LogIn className="h-4 w-4" />
                Sign In
              </GradientButton>
            </Link>
          </div>
        </GlassCard>
      </div>
    );
  }

  // Loading
  if (loading && positions.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-xl font-bold tracking-tight sm:text-2xl">
            <span className="gradient-text">Portfolio</span>
          </h1>
          <p className="mt-1 text-xs text-muted sm:text-sm">Track your positions and performance</p>
        </div>
        <GlassCard>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Loader2 className="mb-4 h-8 w-8 animate-spin text-muted" />
            <p className="text-sm text-muted">Loading your portfolio...</p>
          </div>
        </GlassCard>
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-xl font-bold tracking-tight sm:text-2xl">
            <span className="gradient-text">Portfolio</span>
          </h1>
        </div>
        <GlassCard>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-sm text-red-400">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 rounded-lg border border-border bg-panel px-4 py-2 text-sm font-medium hover:bg-panel-elevated"
            >
              Retry
            </button>
          </div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-xl font-bold tracking-tight sm:text-2xl">
            <span className="gradient-text">Portfolio</span>
          </h1>
          <div className="mt-1 flex items-center gap-2 text-xs text-muted sm:text-sm">
            <span>Track your positions and performance</span>
            {lastUpdated && positions.length > 0 && (
              <>
                <span>·</span>
                <span className="text-[10px] text-muted">
                  Live · {lastUpdated.toLocaleTimeString()}
                </span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refreshPrices(true)}
            disabled={refreshing || positions.length === 0}
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-border bg-panel-elevated px-3 text-xs text-muted transition-colors hover:text-foreground disabled:opacity-50"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <GradientButton
            variant="brand"
            size="sm"
            className="min-h-[44px] w-full sm:w-auto"
            onClick={() => setDialogOpen(true)}
          >
            <Plus className="h-3.5 w-3.5" />
            Add Position
          </GradientButton>
        </div>
      </div>

      {positions.length === 0 ? (
        <GlassCard>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-accent/10">
              <Briefcase className="h-8 w-8 text-accent" />
            </div>
            <h3 className="mb-1 font-display text-lg font-semibold">No positions yet</h3>
            <p className="mb-6 max-w-sm text-sm text-muted">
              Add your first position to start tracking your portfolio performance and allocation. Your data is saved to your account and syncs across devices.
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
            <MetricGlass label="Total Value" value={totalValueDisplay} change={totalGainLossPercent} />
            <MetricGlass label="Day Change" value={dayChangeDisplay} change={dayChangePercent} />
            <MetricGlass label="Total Return" value={totalReturnDisplay} change={totalGainLossPercent} />
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
                  name: p.stock.ticker,
                  value: p.currentValue,
                  color: COLORS[i % COLORS.length],
                  percent: totalValue > 0 ? (p.currentValue / totalValue) * 100 : 0,
                }))}
              />
            </GlassCard>
          </div>

          {/* Positions Table */}
          <GlassCard padding="none">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-accent" />
                <h2 className="font-display text-sm font-semibold">Positions</h2>
              </div>
              <GlowBadge variant="default">{positions.length} holdings</GlowBadge>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase text-muted">
                    <th className="px-4 py-2 font-medium">Stock</th>
                    <th className="hidden px-4 py-2 text-right font-medium sm:table-cell">Shares</th>
                    <th className="hidden px-4 py-2 text-right font-medium md:table-cell">Avg Cost</th>
                    <th className="hidden px-4 py-2 text-right font-medium md:table-cell">Current</th>
                    <th className="hidden px-4 py-2 text-right font-medium lg:table-cell">Value</th>
                    <th className="px-4 py-2 text-right font-medium">Gain/Loss</th>
                    <th className="hidden px-4 py-2 text-right font-medium sm:table-cell">Trend</th>
                    <th className="px-4 py-2 text-right font-medium"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {enriched.map((p) => (
                    <tr key={p.id} className="hover:bg-panel">
                      <td className="px-4 py-3">
                        <Link href={`/stock/${p.stock.ticker}`} className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 font-mono text-[10px] font-bold text-accent">
                            {p.stock.ticker.slice(0, 2)}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-mono text-xs font-bold">{p.stock.ticker}</p>
                            <p className="hidden truncate text-[10px] text-muted sm:block">{p.name}</p>
                          </div>
                        </Link>
                      </td>
                      <td className="hidden px-4 py-3 text-right font-mono sm:table-cell">{p.shares}</td>
                      <td className="hidden px-4 py-3 text-right font-mono md:table-cell">{formatCurrency(p.avgCost)}</td>
                      <td className="hidden px-4 py-3 text-right font-mono font-bold md:table-cell">
                        {realPrices[p.stock.ticker] ? formatCurrency(p.currentPrice) : <span className="text-muted animate-pulse">Loading...</span>}
                      </td>
                      <td className="hidden px-4 py-3 text-right font-mono font-bold lg:table-cell">
                        {realPrices[p.stock.ticker] ? formatCurrency(p.currentValue) : <span className="text-muted animate-pulse">Loading...</span>}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {realPrices[p.stock.ticker] ? (
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
                        ) : (
                          <span className="text-muted animate-pulse text-xs">Loading...</span>
                        )}
                      </td>
                      <td className="hidden px-4 py-3 text-right sm:table-cell">
                        <MiniSparkline
                          data={generateSparkData(p.currentPrice, p.gainLoss >= 0)}
                          positive={p.gainLoss >= 0}
                          width={60}
                          height={20}
                        />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleRemovePosition(p.id)}
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
                  <tr className="border-t border-border">
                    <td className="px-4 py-3 font-bold">Total</td>
                    <td className="hidden px-4 py-3 text-right font-mono text-muted sm:table-cell">—</td>
                    <td className="hidden px-4 py-3 text-right font-mono text-muted md:table-cell">—</td>
                    <td className="hidden px-4 py-3 text-right font-mono text-muted md:table-cell">—</td>
                    <td className="hidden px-4 py-3 text-right font-mono text-sm font-bold lg:table-cell">{formatCurrency(totalValue)}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={cn("font-mono text-sm font-bold", totalGainLoss >= 0 ? "text-positive" : "text-negative")}>
                        {totalGainLoss >= 0 ? "+" : ""}
                        {formatCurrency(totalGainLoss)}
                      </span>
                    </td>
                    <td className="hidden px-4 py-3 sm:table-cell"></td>
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
        <DialogContent className="w-[calc(100%-2rem)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Position</DialogTitle>
            <DialogDescription>
              Search for a stock and enter your position details.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
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
                  className="w-full rounded-lg border border-border bg-panel-elevated py-2 pl-9 pr-8 text-xs text-foreground placeholder:text-muted focus:border-accent/30 focus:outline-none focus:ring-1 focus:ring-accent/20"
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
                <div className="mt-1 max-h-40 overflow-y-auto rounded-lg border border-border bg-panel">
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
                              setAvgCost(info.price > 0 ? info.price.toFixed(2) : "");
                            }}
                            className="flex w-full items-center justify-between px-3 py-2 text-left text-xs transition-colors hover:bg-panel-elevated"
                          >
                            <div>
                              <span className="font-mono font-bold">{t}</span>
                              <span className="ml-2 text-muted">{info.name}</span>
                            </div>
                            <span className="font-mono text-muted">{info.price > 0 ? formatCurrency(info.price) : "—"}</span>
                          </button>
                        );
                      })}
                      {showCustomOption && (
                        <button
                          onClick={() => {
                            setSelectedTicker(searchUpper);
                            setSearch("");
                            setAvgCost("");
                          }}
                          className="flex w-full items-center justify-between px-3 py-2 text-left text-xs transition-colors hover:bg-panel-elevated border-t border-border"
                        >
                          <div>
                            <span className="font-mono font-bold">{searchUpper}</span>
                            <span className="ml-2 text-accent">Use this ticker</span>
                          </div>
                          <span className="font-mono text-muted">{previewQuote ? formatCurrency(previewQuote.price) : "Loading..."}</span>
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted">Shares</label>
              <input
                type="number"
                min="0"
                step="any"
                placeholder="0"
                value={shares}
                onChange={(e) => setShares(e.target.value)}
                className="w-full rounded-lg border border-border bg-panel-elevated px-3 py-2 text-xs text-foreground placeholder:text-muted focus:border-accent/30 focus:outline-none focus:ring-1 focus:ring-accent/20"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted">Average Cost per Share</label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={avgCost}
                onChange={(e) => setAvgCost(e.target.value)}
                className="w-full rounded-lg border border-border bg-panel-elevated px-3 py-2 text-xs text-foreground placeholder:text-muted focus:border-accent/30 focus:outline-none focus:ring-1 focus:ring-accent/20"
              />
            </div>

            {selectedTicker && shares && avgCost && (
              <div className="rounded-lg border border-border bg-panel p-3">
                <div className="flex justify-between text-xs">
                  <span className="text-muted">Total Cost</span>
                  <span className="font-mono font-bold">
                    {formatCurrency(parseFloat(shares) * parseFloat(avgCost))}
                  </span>
                </div>
                <div className="mt-1 flex justify-between text-xs">
                  <span className="text-muted">Current Value</span>
                  <span className="font-mono font-bold">
                    {previewQuote ? formatCurrency(parseFloat(shares) * previewQuote.price) : <span className="text-muted animate-pulse">Loading...</span>}
                  </span>
                </div>
                {parseFloat(avgCost) > 0 && previewQuote && (
                  <div className="mt-1 flex justify-between text-xs">
                    <span className="text-muted">Unrealized P/L</span>
                    <span
                      className={cn(
                        "font-mono font-bold",
                        previewQuote.price >= parseFloat(avgCost) ? "text-positive" : "text-negative"
                      )}
                    >
                      {formatPercent(
                        ((previewQuote.price - parseFloat(avgCost)) / parseFloat(avgCost)) * 100
                      )}
                    </span>
                  </div>
                )}
              </div>
            )}

            {submitError && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-2 text-xs text-red-400">
                {submitError}
              </div>
            )}

            <GradientButton
              variant="brand"
              size="md"
              className="w-full"
              disabled={!selectedTicker || !shares || !avgCost || submitting}
              onClick={handleAddPosition}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Add Position
                </>
              )}
            </GradientButton>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
