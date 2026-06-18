"use client";

import Link from "next/link";
import {
  Shield,
  AlertTriangle,
  TrendingDown,
  BarChart3,
  Activity,
  ArrowRight,
} from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { MetricGlass } from "@/components/ui/metric-glass";
import { GlowBadge } from "@/components/ui/glow-badge";
import { MiniSparkline } from "@/components/charts/mini-sparkline";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { cn } from "@/lib/utils";

const riskMetrics = [
  { label: "Portfolio Beta", value: "1.18", status: "moderate" as const },
  { label: "Value at Risk (95%)", value: "$3,241", status: "warning" as const },
  { label: "Sharpe Ratio", value: "1.42", status: "good" as const },
  { label: "Max Drawdown", value: "-8.3%", status: "moderate" as const },
  { label: "Volatility (30D)", value: "18.7%", status: "moderate" as const },
  { label: "Correlation to SPX", value: "0.87", status: "good" as const },
];

const concentrationRisk = [
  { ticker: "NVDA", weight: 28.1, contribution: 42.3, risk: "high" as const },
  { ticker: "AAPL", weight: 18.2, contribution: 12.4, risk: "medium" as const },
  { ticker: "MSFT", weight: 15.6, contribution: 8.9, risk: "medium" as const },
  { ticker: "GOOGL", weight: 12.4, contribution: 18.7, risk: "high" as const },
  { ticker: "TSLA", weight: 11.8, contribution: 15.2, risk: "high" as const },
  { ticker: "AMZN", weight: 8.3, contribution: 2.5, risk: "low" as const },
  { ticker: "META", weight: 5.6, contribution: 0.0, risk: "low" as const },
];

const sectorExposure = [
  { sector: "Technology", weight: 74.3, beta: 1.32 },
  { sector: "Automotive", weight: 11.8, beta: 2.08 },
  { sector: "E-Commerce", weight: 8.3, beta: 1.15 },
  { sector: "Financial", weight: 5.6, beta: 0.93 },
];

const riskAlerts = [
  { ticker: "NVDA", message: "Concentration exceeds 25% threshold", severity: "high", time: "2h ago" },
  { ticker: "TSLA", message: "Beta above 2.0 — elevated volatility risk", severity: "medium", time: "4h ago" },
  { ticker: "GOOGL", message: "High correlation with NVDA (0.82)", severity: "medium", time: "1d ago" },
  { ticker: "Portfolio", message: "VaR increased 12% this week", severity: "low", time: "1d ago" },
];

const statusColors: Record<string, string> = {
  good: "text-positive",
  moderate: "text-amber",
  warning: "text-negative",
};

const severityConfig: Record<string, { variant: "danger" | "warning" | "default"; icon: typeof AlertTriangle }> = {
  high: { variant: "danger", icon: AlertTriangle },
  medium: { variant: "warning", icon: AlertTriangle },
  low: { variant: "default", icon: Shield },
};

function generateSparkData(base: number, positive: boolean): number[] {
  const data: number[] = [];
  let value = base * 0.98;
  for (let i = 0; i < 20; i++) {
    value += (Math.random() - 0.48) * (base * 0.008);
    data.push(Math.round(value * 100) / 100);
  }
  return data;
}

export default function RiskPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            <span className="gradient-text">Risk Dashboard</span>
          </h1>
          <p className="mt-1 text-sm text-muted">Portfolio risk analysis and concentration monitoring</p>
        </div>
        <GlowBadge variant="warning" glow>Risk Score: 6.4/10</GlowBadge>
      </div>

      {/* Risk Metrics */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {riskMetrics.map((m) => (
          <GlassCard key={m.label} padding="sm" hover>
            <p className="text-[10px] font-medium uppercase text-muted">{m.label}</p>
            <p className={cn("mt-1 font-mono text-lg font-bold", statusColors[m.status])}>
              {m.value}
            </p>
          </GlassCard>
        ))}
      </div>

      {/* Concentration + Sector */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Concentration Risk */}
        <GlassCard padding="none">
          <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber" />
              <h2 className="font-display text-sm font-semibold">Concentration Risk</h2>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/[0.04] text-left text-[10px] uppercase text-muted">
                  <th className="px-4 py-2 font-medium">Stock</th>
                  <th className="px-4 py-2 text-right font-medium">Weight</th>
                  <th className="px-4 py-2 text-right font-medium">Risk Contrib.</th>
                  <th className="px-4 py-2 text-right font-medium">Risk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {concentrationRisk.map((item) => (
                  <tr key={item.ticker} className="hover:bg-white/[0.02]">
                    <td className="px-4 py-2.5">
                      <Link href={`/stock/${item.ticker}`} className="font-mono font-bold hover:text-accent">
                        {item.ticker}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono">{item.weight.toFixed(1)}%</td>
                    <td className="px-4 py-2.5 text-right font-mono">{item.contribution.toFixed(1)}%</td>
                    <td className="px-4 py-2.5 text-right">
                      <GlowBadge
                        variant={item.risk === "high" ? "danger" : item.risk === "medium" ? "warning" : "success"}
                      >
                        {item.risk}
                      </GlowBadge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>

        {/* Sector Exposure */}
        <GlassCard padding="none">
          <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-cyan" />
              <h2 className="font-display text-sm font-semibold">Sector Exposure</h2>
            </div>
          </div>
          <div className="p-4">
            <div className="space-y-3">
              {sectorExposure.map((s) => (
                <div key={s.sector}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs">{s.sector}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold">{s.weight.toFixed(1)}%</span>
                      <span className="text-[10px] text-muted">β {s.beta.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="h-2 w-full rounded-full bg-white/[0.05]">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-cyan to-accent"
                      style={{ width: `${s.weight}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Risk Summary */}
          <div className="border-t border-white/[0.06] p-4">
            <div className="rounded-lg bg-amber/5 p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 text-amber" />
                <div>
                  <p className="text-xs font-medium text-amber">Sector Concentration Warning</p>
                  <p className="mt-0.5 text-[10px] text-muted">
                    74.3% of portfolio is in Technology. Consider diversifying to reduce sector-specific risk.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Risk Alerts */}
      <GlassCard padding="none">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-accent" />
            <h2 className="font-display text-sm font-semibold">Risk Alerts</h2>
          </div>
          <GlowBadge variant="default">{riskAlerts.length} alerts</GlowBadge>
        </div>
        <div className="divide-y divide-white/[0.04]">
          {riskAlerts.map((alert, i) => {
            const config = severityConfig[alert.severity];
            const Icon = config.icon;
            return (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <div className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg",
                  alert.severity === "high" ? "bg-negative/10" : alert.severity === "medium" ? "bg-amber/10" : "bg-white/[0.05]"
                )}>
                  <Icon className={cn(
                    "h-4 w-4",
                    alert.severity === "high" ? "text-negative" : alert.severity === "medium" ? "text-amber" : "text-muted"
                  )} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold">{alert.ticker}</span>
                    <GlowBadge variant={config.variant}>{alert.severity}</GlowBadge>
                  </div>
                  <p className="text-[10px] text-muted">{alert.message}</p>
                </div>
                <span className="text-[10px] text-muted">{alert.time}</span>
              </div>
            );
          })}
        </div>
      </GlassCard>
    </div>
  );
}
