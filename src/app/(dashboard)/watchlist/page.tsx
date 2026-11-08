"use client";

import { useState, useMemo } from "react";
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
  Loader2,
  LogIn,
  Trash2,
} from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { GlowBadge } from "@/components/ui/glow-badge";
import { GradientButton } from "@/components/ui/gradient-button";
import { MiniSparkline } from "@/components/charts/mini-sparkline";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { formatCurrency, formatCompact, formatPercent, cn, seededRandom } from "@/lib/utils";
import { useWatchlist } from "@/hooks/use-watchlist";
import { useStockPrices } from "@/hooks/use-stock-prices";

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

export default function WatchlistPage() {
  const { items, loading, error, isSignedIn, addItem, removeItem } = useWatchlist();
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newTicker, setNewTicker] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const tickers = useMemo(() => items.map((i) => i.stock.ticker), [items]);
  const { prices } = useStockPrices({ tickers });

  const handleAdd = async () => {
    const ticker = newTicker.toUpperCase().trim();
    if (!ticker) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await addItem(ticker);
      setNewTicker("");
      setDialogOpen(false);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to add");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (itemId: string) => {
    try {
      await removeItem(itemId);
    } catch (err) {
      console.error("Failed to remove item:", err);
    }
  };

  const filtered = items.filter((i) =>
    i.stock.ticker.toLowerCase().includes(search.toLowerCase()) ||
    i.stock.companyName.toLowerCase().includes(search.toLowerCase())
  );

  // Not signed in
  if (isSignedIn === false) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            <span className="gradient-text">Watchlist</span>
          </h1>
          <p className="mt-1 text-sm text-muted">Track stocks you&apos;re interested in</p>
        </div>
        <GlassCard>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-accent/10">
              <LogIn className="h-8 w-8 text-accent" />
            </div>
            <h3 className="mb-1 font-display text-lg font-semibold">Sign in to access your watchlist</h3>
            <p className="mb-6 max-w-sm text-sm text-muted">
              Your watchlist syncs across devices and stays secure with your account.
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
  if (loading && items.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            <span className="gradient-text">Watchlist</span>
          </h1>
        </div>
        <GlassCard>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Loader2 className="mb-4 h-8 w-8 animate-spin text-muted" />
            <p className="text-sm text-muted">Loading your watchlist...</p>
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
            <span className="gradient-text">Watchlist</span>
          </h1>
          <p className="mt-1 text-xs text-muted sm:text-sm">
            {items.length} stock{items.length !== 1 ? "s" : ""} on your watchlist
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-border bg-panel p-0.5">
            <button
              onClick={() => setViewMode("grid")}
              className={cn("rounded p-1.5", viewMode === "grid" ? "bg-accent/10 text-accent" : "text-muted hover:text-foreground")}
              aria-label="Grid view"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={cn("rounded p-1.5", viewMode === "table" ? "bg-accent/10 text-accent" : "text-muted hover:text-foreground")}
              aria-label="Table view"
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>
          <GradientButton
            variant="brand"
            size="sm"
            className="min-h-[44px]"
            onClick={() => setDialogOpen(true)}
          >
            <Plus className="h-3.5 w-3.5" />
            Add Stock
          </GradientButton>
        </div>
      </div>

      {/* Search bar */}
      {items.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Filter your watchlist..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-panel py-2 pl-9 pr-4 text-xs text-foreground placeholder:text-muted focus:border-accent/30 focus:outline-none focus:ring-1 focus:ring-accent/20"
          />
        </div>
      )}

      {error && (
        <GlassCard>
          <p className="text-sm text-red-400">{error}</p>
        </GlassCard>
      )}

      {items.length === 0 && !loading ? (
        <GlassCard>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-accent/10">
              <Star className="h-8 w-8 text-accent" />
            </div>
            <h3 className="mb-1 font-display text-lg font-semibold">No stocks yet</h3>
            <p className="mb-6 max-w-sm text-sm text-muted">
              Add stocks to your watchlist to track their prices and never miss an opportunity.
            </p>
            <GradientButton variant="brand" size="md" onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              Add Your First Stock
            </GradientButton>
          </div>
        </GlassCard>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((item) => {
            const q = prices[item.stock.ticker];
            const price = q?.price ?? 0;
            const changePercent = q?.changePercent ?? 0;
            return (
              <GlassCard key={item.id} hover className="relative group">
                <button
                  onClick={() => handleRemove(item.id)}
                  className="absolute right-2 top-2 rounded p-1 text-muted opacity-0 transition-opacity hover:bg-red/10 hover:text-red group-hover:opacity-100"
                  title="Remove"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
                <Link href={`/stock/${item.stock.ticker}`} className="block">
                  <div className="mb-3 flex items-center justify-between pr-6">
                    <div>
                      <p className="font-mono text-base font-bold">{item.stock.ticker}</p>
                      <p className="text-[10px] text-muted truncate">{item.stock.companyName}</p>
                    </div>
                    {q && (
                      <MiniSparkline
                        data={generateSparkData(price, changePercent >= 0)}
                        positive={changePercent >= 0}
                        width={60}
                        height={24}
                      />
                    )}
                  </div>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="font-mono text-lg font-bold">
                        {q ? formatCurrency(price) : <span className="animate-pulse text-muted text-sm">...</span>}
                      </p>
                      <p className={cn("font-mono text-xs font-semibold", changePercent >= 0 ? "text-positive" : "text-negative")}>
                        {q ? formatPercent(changePercent) : ""}
                      </p>
                    </div>
                  </div>
                </Link>
              </GlassCard>
            );
          })}
        </div>
      ) : (
        <GlassCard padding="none">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase text-muted">
                  <th className="px-4 py-2 font-medium">Ticker</th>
                  <th className="hidden px-4 py-2 font-medium md:table-cell">Company</th>
                  <th className="px-4 py-2 text-right font-medium">Price</th>
                  <th className="px-4 py-2 text-right font-medium">Change</th>
                  <th className="hidden px-4 py-2 text-right font-medium sm:table-cell">Trend</th>
                  <th className="px-4 py-2 text-right font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((item) => {
                  const q = prices[item.stock.ticker];
                  const changePercent = q?.changePercent ?? 0;
                  return (
                    <tr key={item.id} className="hover:bg-panel">
                      <td className="px-4 py-3">
                        <Link href={`/stock/${item.stock.ticker}`} className="font-mono text-xs font-bold">
                          {item.stock.ticker}
                        </Link>
                      </td>
                      <td className="hidden px-4 py-3 text-[10px] text-muted md:table-cell">{item.stock.companyName}</td>
                      <td className="px-4 py-3 text-right font-mono font-bold">
                        {q ? formatCurrency(q.price) : <span className="text-muted animate-pulse">Loading...</span>}
                      </td>
                      <td className={cn("px-4 py-3 text-right font-mono font-semibold", changePercent >= 0 ? "text-positive" : "text-negative")}>
                        {q ? formatPercent(changePercent) : "—"}
                      </td>
                      <td className="hidden px-4 py-3 text-right sm:table-cell">
                        {q && (
                          <MiniSparkline
                            data={generateSparkData(q.price, changePercent >= 0)}
                            positive={changePercent >= 0}
                            width={60}
                            height={20}
                          />
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleRemove(item.id)}
                          className="rounded p-1 text-muted hover:bg-red/10 hover:text-red"
                          title="Remove"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}

      {/* Add Stock Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="w-[calc(100%-2rem)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add to Watchlist</DialogTitle>
            <DialogDescription>Enter a stock ticker to track.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted">Ticker</label>
              <input
                type="text"
                placeholder="e.g. AAPL, NVDA, TSLA"
                value={newTicker}
                onChange={(e) => setNewTicker(e.target.value.toUpperCase())}
                onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
                className="w-full rounded-lg border border-border bg-panel-elevated px-3 py-2 font-mono text-xs uppercase text-foreground placeholder:font-sans placeholder:normal-case placeholder:text-muted focus:border-accent/30 focus:outline-none focus:ring-1 focus:ring-accent/20"
                autoFocus
              />
            </div>
            {submitError && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-2 text-xs text-red-400">
                {submitError}
              </div>
            )}
            <GradientButton
              variant="brand"
              size="md"
              className="w-full"
              disabled={!newTicker.trim() || submitting}
              onClick={handleAdd}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Add to Watchlist
                </>
              )}
            </GradientButton>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
