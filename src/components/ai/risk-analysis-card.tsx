"use client";

import {
  Shield,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  BarChart3,
} from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { GlowBadge } from "@/components/ui/glow-badge";
import type { PortfolioRiskAnalysis } from "@/lib/services/python-client";
import { cn } from "@/lib/utils";

interface RiskAnalysisCardProps {
  data: PortfolioRiskAnalysis | null;
  isLoading?: boolean;
}

export function RiskAnalysisCard({ data, isLoading }: RiskAnalysisCardProps) {
  if (isLoading) {
    return (
      <GlassCard>
        <div className="animate-pulse space-y-3">
          <div className="h-4 w-32 rounded bg-panel-elevated" />
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-3 rounded bg-panel-elevated" />
            ))}
          </div>
        </div>
      </GlassCard>
    );
  }

  if (!data) return null;

  const m = data.portfolio_metrics;

  return (
    <GlassCard>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-accent" />
          <h3 className="font-display text-sm font-semibold">Portfolio Risk</h3>
        </div>
        <GlowBadge
          variant={m.sharpe_ratio > 1 ? "success" : m.sharpe_ratio > 0 ? "warning" : "danger"}
        >
          Sharpe {m.sharpe_ratio.toFixed(2)}
        </GlowBadge>
      </div>

      {/* Key Metrics */}
      <div className="mb-4 grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-panel-elevated p-2.5">
          <p className="text-[10px] text-muted">Total Return</p>
          <p className={cn("font-mono text-sm font-bold", m.total_return_pct >= 0 ? "text-positive" : "text-negative")}>
            {m.total_return_pct > 0 ? "+" : ""}{m.total_return_pct.toFixed(2)}%
          </p>
        </div>
        <div className="rounded-lg bg-panel-elevated p-2.5">
          <p className="text-[10px] text-muted">Volatility</p>
          <p className="font-mono text-sm font-bold">{m.volatility_annualized.toFixed(1)}%</p>
        </div>
        <div className="rounded-lg bg-panel-elevated p-2.5">
          <p className="text-[10px] text-muted">Max Drawdown</p>
          <p className="font-mono text-sm font-bold text-negative">{m.max_drawdown_pct.toFixed(2)}%</p>
        </div>
        <div className="rounded-lg bg-panel-elevated p-2.5">
          <p className="text-[10px] text-muted">VaR (95%)</p>
          <p className="font-mono text-sm font-bold text-amber">{m.var_95_pct.toFixed(2)}%</p>
        </div>
      </div>

      {/* Beta & Diversification */}
      <div className="mb-4 flex gap-2">
        <div className="flex-1 rounded-lg bg-panel-elevated p-2.5 text-center">
          <p className="text-[10px] text-muted">Beta</p>
          <p className={cn(
            "font-mono text-sm font-bold",
            m.beta > 1.2 ? "text-amber" : m.beta > 0.8 ? "text-foreground" : "text-cyan"
          )}>
            {m.beta.toFixed(2)}
          </p>
        </div>
        <div className="flex-1 rounded-lg bg-panel-elevated p-2.5 text-center">
          <p className="text-[10px] text-muted">Diversification</p>
          <p className="font-mono text-sm font-bold">
            {(m.diversification_score * 100).toFixed(0)}%
          </p>
        </div>
      </div>

      {/* Individual Risk */}
      <div>
        <p className="mb-2 text-[10px] font-medium uppercase text-muted">Individual Risk</p>
        <div className="space-y-1.5">
          {Object.entries(data.individual_risk).map(([ticker, risk]) => (
            <div key={ticker} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
              <span className="font-mono text-xs font-bold">{ticker}</span>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="font-mono text-[10px]">Vol {risk.volatility_annualized.toFixed(1)}%</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-[10px] text-negative">DD {risk.max_drawdown.toFixed(1)}%</p>
                </div>
                <GlowBadge
                  variant={risk.volatility_annualized > 30 ? "danger" : risk.volatility_annualized > 20 ? "warning" : "success"}
                >
                  {risk.volatility_annualized > 30 ? "High" : risk.volatility_annualized > 20 ? "Med" : "Low"}
                </GlowBadge>
              </div>
            </div>
          ))}
        </div>
      </div>
    </GlassCard>
  );
}
