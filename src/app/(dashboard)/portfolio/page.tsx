"use client";

import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  Plus,
  Briefcase,
  ArrowRight,
} from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { MetricGlass } from "@/components/ui/metric-glass";
import { GlowBadge } from "@/components/ui/glow-badge";
import { GradientButton } from "@/components/ui/gradient-button";
import { EquityCurveChart } from "@/components/charts/equity-curve";
import { PortfolioAllocation } from "@/components/charts/portfolio-allocation";
import { MiniSparkline } from "@/components/charts/mini-sparkline";
import { formatCurrency, formatPercent, formatCompact } from "@/lib/utils";
import { cn } from "@/lib/utils";

const positions = [
  { id: "1", ticker: "AAPL", name: "Apple Inc.", shares: 45, avgCost: 185.30, currentPrice: 214.29 },
  { id: "2", ticker: "MSFT", name: "Microsoft Corp.", shares: 20, avgCost: 380.75, currentPrice: 450.37 },
  { id: "3", ticker: "NVDA", name: "NVIDIA Corp.", shares: 80, avgCost: 95.40, currentPrice: 143.71 },
  { id: "4", ticker: "GOOGL", name: "Alphabet Inc.", shares: 30, avgCost: 155.20, currentPrice: 176.44 },
  { id: "5", ticker: "TSLA", name: "Tesla Inc.", shares: 15, avgCost: 245.60, currentPrice: 322.56 },
];

const enrichedPositions = positions.map((p) => ({
  ...p,
  totalCost: p.shares * p.avgCost,
  currentValue: p.shares * p.currentPrice,
  gainLoss: (p.currentPrice - p.avgCost) * p.shares,
  gainLossPercent: ((p.currentPrice - p.avgCost) / p.avgCost) * 100,
}));

const totalValue = enrichedPositions.reduce((sum, p) => sum + p.currentValue, 0);
const totalCost = enrichedPositions.reduce((sum, p) => sum + p.totalCost, 0);
const totalGainLoss = totalValue - totalCost;
const totalGainLossPercent = (totalGainLoss / totalCost) * 100;
const dayChange = totalValue * 0.0234;

function generateSparkData(base: number, positive: boolean): number[] {
  const data: number[] = [];
  let value = base * 0.98;
  for (let i = 0; i < 20; i++) {
    value += (Math.random() - 0.48) * (base * 0.008);
    data.push(Math.round(value * 100) / 100);
  }
  return data;
}

export default function PortfolioPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            <span className="gradient-text">Portfolio</span>
          </h1>
          <p className="mt-1 text-sm text-muted">Track your positions and performance</p>
        </div>
        <GradientButton variant="brand" size="sm">
          <Plus className="h-3.5 w-3.5" />
          Add Position
        </GradientButton>
      </div>

      {/* Portfolio Metrics */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricGlass label="Total Value" value={`$${formatCompact(totalValue)}`} change={totalGainLossPercent} prefix="$" />
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
              { date: "Jan", equity: 100000 },
              { date: "Feb", equity: 105200 },
              { date: "Mar", equity: 108900 },
              { date: "Apr", equity: 112400 },
              { date: "May", equity: 118700 },
              { date: "Jun", equity: 124847 },
            ]}
            benchmark={[
              { date: "Jan", value: 100000 },
              { date: "Feb", value: 102300 },
              { date: "Mar", value: 104100 },
              { date: "Apr", value: 106800 },
              { date: "May", value: 108200 },
              { date: "Jun", value: 110500 },
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
            items={enrichedPositions.map((p, i) => ({
              name: p.ticker,
              value: p.currentValue,
              color: ["#00d4ff", "#00e676", "#ffab00", "#ff1744", "#7c4dff"][i % 5],
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
              <tr className="border-b border-white/[0.04] text-left text-[10px] uppercase text-muted">
                <th className="px-4 py-2 font-medium">Stock</th>
                <th className="px-4 py-2 text-right font-medium">Shares</th>
                <th className="px-4 py-2 text-right font-medium">Avg Cost</th>
                <th className="px-4 py-2 text-right font-medium">Current</th>
                <th className="px-4 py-2 text-right font-medium">Value</th>
                <th className="px-4 py-2 text-right font-medium">Gain/Loss</th>
                <th className="px-4 py-2 text-right font-medium">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {enrichedPositions.map((p) => (
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
              </tr>
            </tfoot>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
