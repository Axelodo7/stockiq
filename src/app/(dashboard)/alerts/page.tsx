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
} from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { GlowBadge } from "@/components/ui/glow-badge";
import { GradientButton } from "@/components/ui/gradient-button";
import { formatCurrency, formatCompact } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface AlertItem {
  id: string;
  ticker: string;
  name: string;
  type: "price" | "volume" | "percent";
  condition: "above" | "below";
  targetValue: number;
  currentPrice: number;
  isActive: boolean;
  createdAt: string;
  triggeredAt?: string;
}

const initialAlerts: AlertItem[] = [
  { id: "1", ticker: "AAPL", name: "Apple Inc.", type: "price", condition: "above", targetValue: 220, currentPrice: 214.29, isActive: true, createdAt: "2026-06-10" },
  { id: "2", ticker: "TSLA", name: "Tesla Inc.", type: "price", condition: "below", targetValue: 300, currentPrice: 322.56, isActive: true, createdAt: "2026-06-08", triggeredAt: "2026-06-15 14:32" },
  { id: "3", ticker: "NVDA", name: "NVIDIA Corp.", type: "percent", condition: "above", targetValue: 3, currentPrice: 143.71, isActive: false, createdAt: "2026-06-05" },
  { id: "4", ticker: "MSFT", name: "Microsoft Corp.", type: "price", condition: "above", targetValue: 460, currentPrice: 450.37, isActive: true, createdAt: "2026-06-12" },
  { id: "5", ticker: "GOOGL", name: "Alphabet Inc.", type: "volume", condition: "above", targetValue: 50_000_000, currentPrice: 176.44, isActive: true, createdAt: "2026-06-11" },
  { id: "6", ticker: "AMZN", name: "Amazon.com Inc.", type: "price", condition: "below", targetValue: 210, currentPrice: 219.39, isActive: false, createdAt: "2026-06-07" },
  { id: "7", ticker: "AAPL", name: "Apple Inc.", type: "percent", condition: "below", targetValue: -2, currentPrice: 214.29, isActive: true, createdAt: "2026-06-13", triggeredAt: "2026-06-16 09:15" },
];

const typeConfig: Record<string, { icon: typeof TrendingUp; label: string; color: string }> = {
  price: { icon: TrendingUp, label: "Price", color: "text-cyan" },
  volume: { icon: BarChart3, label: "Volume", color: "text-purple" },
  percent: { icon: Activity, label: "% Change", color: "text-amber" },
};

export default function AlertsPage() {
  const [alerts, setAlerts] = useState(initialAlerts);

  const toggleAlert = (id: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, isActive: !a.isActive } : a))
    );
  };

  const activeCount = alerts.filter((a) => a.isActive).length;
  const triggeredAlerts = alerts.filter((a) => a.triggeredAt);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            <span className="gradient-text">Alerts</span>
          </h1>
          <p className="mt-1 text-sm text-muted">
            {activeCount} active alert{activeCount !== 1 ? "s" : ""}
          </p>
        </div>
        <GradientButton variant="brand" size="sm">
          <Plus className="h-3.5 w-3.5" />
          Create Alert
        </GradientButton>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <GlassCard padding="sm" className="text-center">
          <Bell className="mx-auto mb-1 h-4 w-4 text-cyan" />
          <p className="font-mono text-lg font-bold">{activeCount}</p>
          <p className="text-xs text-muted">Active</p>
        </GlassCard>
        <GlassCard padding="sm" className="text-center">
          <BellOff className="mx-auto mb-1 h-4 w-4 text-muted" />
          <p className="font-mono text-lg font-bold">{alerts.length - activeCount}</p>
          <p className="text-xs text-muted">Paused</p>
        </GlassCard>
        <GlassCard padding="sm" className="text-center">
          <Zap className="mx-auto mb-1 h-4 w-4 text-amber" />
          <p className="font-mono text-lg font-bold">{triggeredAlerts.length}</p>
          <p className="text-xs text-muted">Triggered</p>
        </GlassCard>
      </div>

      {/* Alert Cards */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {alerts.map((alert) => {
          const config = typeConfig[alert.type];
          const Icon = config.icon;
          const distance = alert.type === "volume"
            ? null
            : alert.type === "percent"
              ? `${((2.34 / alert.targetValue) * 100).toFixed(0)}%`
              : formatCurrency(Math.abs(alert.currentPrice - alert.targetValue));

          return (
            <GlassCard
              key={alert.id}
              padding="none"
              className={cn(!alert.isActive && "opacity-50")}
            >
              <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
                <div className="flex items-center gap-2">
                  <Icon className={cn("h-4 w-4", config.color)} />
                  <span className="font-mono text-xs font-bold">{alert.ticker}</span>
                  <GlowBadge variant={alert.type === "price" ? "info" : alert.type === "volume" ? "purple" : "warning"}>
                    {config.label}
                  </GlowBadge>
                </div>
                 {/* Toggle Switch */}
                 <button
                   onClick={() => toggleAlert(alert.id)}
                   className={cn(
                     "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors",
                     alert.isActive ? "bg-accent" : "bg-white/10"
                   )}
                 >
                   <span
                     className={cn(
                       "inline-block h-4 w-4 rounded-full bg-white transition-transform",
                       alert.isActive ? "translate-x-6" : "translate-x-1"
                     )}
                   />
                 </button>
              </div>

              <div className="px-4 py-3">
                <p className="text-xs text-muted">{alert.name}</p>
                <div className="mt-2 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted">Condition</span>
                    <span className="text-xs font-medium">
                      {alert.condition === "above" ? "Goes Above" : "Goes Below"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted">Target</span>
                    <span className="font-mono text-xs font-bold">
                      {alert.type === "volume"
                        ? `${(alert.targetValue / 1_000_000).toFixed(0)}M`
                        : alert.type === "percent"
                          ? `${alert.targetValue > 0 ? "+" : ""}${alert.targetValue}%`
                          : formatCurrency(alert.targetValue)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted">Distance</span>
                    <span className="font-mono text-xs text-muted">{distance ?? "—"}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 border-t border-white/[0.04] px-4 py-2">
                {alert.triggeredAt ? (
                  <>
                    <Zap className="h-3 w-3 text-amber" />
                    <span className="text-xs text-amber">Triggered {alert.triggeredAt}</span>
                  </>
                ) : (
                  <>
                    <Clock className="h-3 w-3 text-muted" />
                    <span className="text-xs text-muted">Created {alert.createdAt}</span>
                  </>
                )}
              </div>
            </GlassCard>
          );
        })}
      </div>

      {/* Recent Triggered Timeline */}
      {triggeredAlerts.length > 0 && (
        <GlassCard padding="none">
          <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-3">
            <Zap className="h-4 w-4 text-amber" />
            <h2 className="font-display text-sm font-semibold">Recently Triggered</h2>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {triggeredAlerts.map((alert) => (
              <div key={alert.id} className="flex items-center gap-3 px-4 py-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber/10">
                  <Zap className="h-4 w-4 text-amber" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold">{alert.ticker}</span>
                    <span className="text-[10px] text-muted">
                      {alert.condition === "above" ? "crossed above" : "crossed below"}{" "}
                      {alert.type === "percent" ? `${alert.targetValue}%` : formatCurrency(alert.targetValue)}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted">{alert.triggeredAt}</p>
                </div>
                <Link href={`/stock/${alert.ticker}`} className="text-[10px] text-accent hover:underline">
                  View
                </Link>
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  );
}
