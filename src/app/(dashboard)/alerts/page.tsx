"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Plus,
  Bell,
  BellOff,
  TrendingUp,
  TrendingDown,
  Activity,
  BarChart3,
  Clock,
  Zap,
  Loader2,
  LogIn,
  Trash2,
} from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { GlowBadge } from "@/components/ui/glow-badge";
import { GradientButton } from "@/components/ui/gradient-button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useAlerts } from "@/hooks/use-alerts";
import { useStockPrices } from "@/hooks/use-stock-prices";
import { fetchStockQuotes } from "@/lib/services/stock-api";

const typeConfig: Record<string, { icon: typeof TrendingUp; label: string; color: string }> = {
  PRICE: { icon: TrendingUp, label: "Price", color: "text-cyan" },
  VOLUME: { icon: BarChart3, label: "Volume", color: "text-purple" },
  PERCENT_CHANGE: { icon: Activity, label: "% Change", color: "text-amber" },
};

const conditionLabels: Record<string, string> = {
  ABOVE: "Above",
  BELOW: "Below",
  PCT_UP: "Up by",
  PCT_DOWN: "Down by",
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  return `${day}d ago`;
}

export default function AlertsPage() {
  const { alerts, loading, error, isSignedIn, createAlert, toggleAlert, removeAlert } = useAlerts();
  const tickers = [...new Set(alerts.map((a) => a.stock.ticker))];
  const { prices } = useStockPrices({ tickers });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [ticker, setTicker] = useState("");
  const [alertType, setAlertType] = useState<"PRICE" | "VOLUME" | "PERCENT_CHANGE">("PRICE");
  const [condition, setCondition] = useState<"ABOVE" | "BELOW" | "PCT_UP" | "PCT_DOWN">("ABOVE");
  const [targetValue, setTargetValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [previewPrice, setPreviewPrice] = useState<number | null>(null);

  // Fetch preview price when ticker changes
  const handleTickerChange = async (val: string) => {
    setTicker(val.toUpperCase());
    const t = val.toUpperCase().trim();
    if (/^[A-Z]{1,10}$/.test(t)) {
      try {
        const quotes = await fetchStockQuotes([t]);
        const q = quotes[t];
        setPreviewPrice(q?.price ?? null);
      } catch {
        setPreviewPrice(null);
      }
    } else {
      setPreviewPrice(null);
    }
  };

  const handleCreate = async () => {
    if (!ticker || !targetValue) return;
    const numValue = parseFloat(targetValue);
    if (isNaN(numValue)) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      await createAlert({
        stockTicker: ticker.toUpperCase(),
        type: alertType,
        condition,
        targetValue: numValue,
      });
      setDialogOpen(false);
      setTicker("");
      setTargetValue("");
      setPreviewPrice(null);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to create alert");
    } finally {
      setSubmitting(false);
    }
  };

  const activeCount = alerts.filter((a) => a.isActive).length;
  const triggeredCount = alerts.filter((a) => a.lastTriggered).length;

  // Not signed in
  if (isSignedIn === false) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            <span className="gradient-text">Alerts</span>
          </h1>
        </div>
        <GlassCard>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-accent/10">
              <LogIn className="h-8 w-8 text-accent" />
            </div>
            <h3 className="mb-1 font-display text-lg font-semibold">Sign in to manage alerts</h3>
            <p className="mb-6 max-w-sm text-sm text-muted">
              Get notified when stocks hit your price targets. Your alerts sync across devices.
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
  if (loading && alerts.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            <span className="gradient-text">Alerts</span>
          </h1>
        </div>
        <GlassCard>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Loader2 className="mb-4 h-8 w-8 animate-spin text-muted" />
            <p className="text-sm text-muted">Loading alerts...</p>
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
            <span className="gradient-text">Alerts</span>
          </h1>
          <p className="mt-1 text-xs text-muted sm:text-sm">
            {activeCount} active alert{activeCount !== 1 ? "s" : ""}
          </p>
        </div>
        <GradientButton
          variant="brand"
          size="sm"
          className="min-h-[44px] w-full sm:w-auto"
          onClick={() => setDialogOpen(true)}
        >
          <Plus className="h-3.5 w-3.5" />
          Create Alert
        </GradientButton>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <GlassCard padding="sm" className="text-center">
          <Bell className="mx-auto mb-1 h-4 w-4 text-cyan" />
          <p className="font-mono text-lg font-bold">{activeCount}</p>
          <p className="text-[10px] text-muted sm:text-xs">Active</p>
        </GlassCard>
        <GlassCard padding="sm" className="text-center">
          <BellOff className="mx-auto mb-1 h-4 w-4 text-muted" />
          <p className="font-mono text-lg font-bold">{alerts.length - activeCount}</p>
          <p className="text-[10px] text-muted sm:text-xs">Paused</p>
        </GlassCard>
        <GlassCard padding="sm" className="text-center">
          <Zap className="mx-auto mb-1 h-4 w-4 text-amber" />
          <p className="font-mono text-lg font-bold">{triggeredCount}</p>
          <p className="text-[10px] text-muted sm:text-xs">Triggered</p>
        </GlassCard>
      </div>

      {error && (
        <GlassCard>
          <p className="text-sm text-red-400">{error}</p>
        </GlassCard>
      )}

      {alerts.length === 0 && !loading ? (
        <GlassCard>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-accent/10">
              <Bell className="h-8 w-8 text-accent" />
            </div>
            <h3 className="mb-1 font-display text-lg font-semibold">No alerts yet</h3>
            <p className="mb-6 max-w-sm text-sm text-muted">
              Create price alerts to get notified when stocks hit your targets.
            </p>
            <GradientButton variant="brand" size="md" onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              Create Your First Alert
            </GradientButton>
          </div>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => {
            const cfg = typeConfig[alert.type];
            const Icon = cfg.icon;
            const q = prices[alert.stock.ticker];
            const currentPrice = q?.price;
            return (
              <GlassCard key={alert.id} hover className="group">
                <div className="flex items-center gap-3">
                  <Link href={`/stock/${alert.stock.ticker}`} className="shrink-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                      <Icon className={cn("h-5 w-5", cfg.color)} />
                    </div>
                  </Link>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <Link href={`/stock/${alert.stock.ticker}`} className="font-mono text-sm font-bold hover:text-accent">
                        {alert.stock.ticker}
                      </Link>
                      <span className="text-xs text-muted truncate hidden sm:inline">{alert.stock.companyName}</span>
                      <GlowBadge variant={alert.isActive ? "success" : "default"}>
                        {cfg.label}
                      </GlowBadge>
                    </div>
                    <p className="text-xs text-muted">
                      Notify when price goes{" "}
                      <span className="font-semibold text-foreground">
                        {conditionLabels[alert.condition].toLowerCase()}
                      </span>{" "}
                      <span className="font-mono font-bold text-foreground">
                        {alert.condition.startsWith("PCT") ? `${alert.targetValue}%` : formatCurrency(alert.targetValue)}
                      </span>
                    </p>
                    <div className="mt-1 flex items-center gap-2 text-[10px] text-muted">
                      <Clock className="h-3 w-3" />
                      Created {timeAgo(alert.createdAt)}
                      {alert.lastTriggered && (
                        <>
                          <span>·</span>
                          <Zap className="h-3 w-3 text-amber" />
                          <span className="text-amber">Triggered {timeAgo(alert.lastTriggered)}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1 sm:gap-2">
                    <button
                      onClick={() => toggleAlert(alert.id, !alert.isActive)}
                      className={cn(
                        "min-h-[36px] min-w-[60px] rounded-md px-2 py-1 text-xs font-semibold transition-colors",
                        alert.isActive
                          ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                          : "bg-zinc-500/10 text-zinc-400 hover:bg-zinc-500/20"
                      )}
                    >
                      {alert.isActive ? "Active" : "Paused"}
                    </button>
                    <button
                      onClick={() => removeAlert(alert.id)}
                      className="rounded p-1.5 text-muted opacity-0 transition-opacity hover:bg-red/10 hover:text-red group-hover:opacity-100"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      {/* Create Alert Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="w-[calc(100%-2rem)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Alert</DialogTitle>
            <DialogDescription>Get notified when a stock hits your target.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted">Ticker</label>
              <input
                type="text"
                placeholder="AAPL, TSLA, BTC-USD..."
                value={ticker}
                onChange={(e) => handleTickerChange(e.target.value)}
                className="w-full rounded-lg border border-border bg-panel-elevated px-3 py-2 font-mono text-xs uppercase text-foreground placeholder:font-sans placeholder:normal-case placeholder:text-muted focus:border-accent/30 focus:outline-none focus:ring-1 focus:ring-accent/20"
                autoFocus
              />
              {previewPrice !== null && (
                <p className="mt-1 text-[10px] text-muted">
                  Current price: <span className="font-mono font-bold text-foreground">{formatCurrency(previewPrice)}</span>
                </p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted">Type</label>
              <div className="grid grid-cols-3 gap-2">
                {(["PRICE", "VOLUME", "PERCENT_CHANGE"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setAlertType(t)}
                    className={cn(
                      "min-h-[44px] rounded-lg border px-2 py-2 text-xs font-semibold transition-colors",
                      alertType === t
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-border bg-panel-elevated text-muted hover:text-foreground"
                    )}
                  >
                    {typeConfig[t].label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted">Condition</label>
              <div className="grid grid-cols-2 gap-2">
                {(alertType === "PRICE"
                  ? (["ABOVE", "BELOW"] as const)
                  : alertType === "VOLUME"
                  ? (["ABOVE", "BELOW"] as const)
                  : (["PCT_UP", "PCT_DOWN"] as const)
                ).map((c) => (
                  <button
                    key={c}
                    onClick={() => setCondition(c)}
                    className={cn(
                      "min-h-[44px] rounded-lg border px-2 py-2 text-xs font-semibold transition-colors",
                      condition === c
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-border bg-panel-elevated text-muted hover:text-foreground"
                    )}
                  >
                    {conditionLabels[c]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted">
                Target value {alertType === "PERCENT_CHANGE" && "(%)"}
                {alertType === "VOLUME" && "(shares)"}
              </label>
              <input
                type="number"
                step="0.01"
                placeholder={alertType === "PERCENT_CHANGE" ? "5" : "0.00"}
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                className="w-full rounded-lg border border-border bg-panel-elevated px-3 py-2 font-mono text-xs text-foreground placeholder:font-sans placeholder:text-muted focus:border-accent/30 focus:outline-none focus:ring-1 focus:ring-accent/20"
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
              disabled={!ticker || !targetValue || submitting}
              onClick={handleCreate}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Bell className="h-4 w-4" />
                  Create Alert
                </>
              )}
            </GradientButton>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
