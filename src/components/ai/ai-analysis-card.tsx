"use client";

import {
  Brain,
  TrendingUp,
  TrendingDown,
  Minus,
  Shield,
  Target,
  BarChart3,
} from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { GlowBadge } from "@/components/ui/glow-badge";
import type { AIAnalysis } from "@/lib/services/python-client";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface AIAnalysisCardProps {
  data: AIAnalysis | null;
  isLoading?: boolean;
}

export function AIAnalysisCard({ data, isLoading }: AIAnalysisCardProps) {
  if (isLoading) {
    return (
      <GlassCard>
        <div className="animate-pulse space-y-3">
          <div className="h-4 w-32 rounded bg-white/[0.05]" />
          <div className="h-8 w-24 rounded bg-white/[0.05]" />
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-3 rounded bg-white/[0.05]" />
            ))}
          </div>
        </div>
      </GlassCard>
    );
  }

  if (!data) return null;

  const SignalIcon = data.overall_signal === "bullish" ? TrendingUp : data.overall_signal === "bearish" ? TrendingDown : Minus;
  const signalColor = data.overall_signal === "bullish" ? "text-positive" : data.overall_signal === "bearish" ? "text-negative" : "text-muted";

  return (
    <GlassCard>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-cyan" />
          <h3 className="font-display text-sm font-semibold">AI Analysis</h3>
        </div>
        <GlowBadge
          variant={data.overall_signal === "bullish" ? "success" : data.overall_signal === "bearish" ? "danger" : "default"}
          glow
        >
          {data.overall_signal} ({data.conviction})
        </GlowBadge>
      </div>

      <div className="mb-4 flex items-center gap-3">
        <SignalIcon className={cn("h-8 w-8", signalColor)} />
        <div>
          <p className={cn("font-mono text-2xl font-bold", signalColor)}>
            {data.overall_signal.toUpperCase()}
          </p>
          <p className="text-[10px] text-muted">Overall Signal</p>
        </div>
      </div>

      {/* Probability bars */}
      <div className="mb-4 space-y-2">
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-muted">Bullish</span>
            <span className="font-mono text-[10px] text-positive">{(data.bullish_probability * 100).toFixed(1)}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-white/[0.05]">
            <div className="h-1.5 rounded-full bg-positive" style={{ width: `${data.bullish_probability * 100}%` }} />
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-muted">Bearish</span>
            <span className="font-mono text-[10px] text-negative">{(data.bearish_probability * 100).toFixed(1)}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-white/[0.05]">
            <div className="h-1.5 rounded-full bg-negative" style={{ width: `${data.bearish_probability * 100}%` }} />
          </div>
        </div>
      </div>

      {/* Signals */}
      <div className="mb-4 space-y-2">
        <p className="text-[10px] font-medium uppercase text-muted">Signals</p>
        {data.signals.map((sig, i) => (
          <div key={i} className="flex items-center justify-between border-b border-white/[0.04] py-1.5 last:border-0">
            <div className="flex items-center gap-2">
              <div className={cn(
                "h-1.5 w-1.5 rounded-full",
                sig.direction === "bullish" ? "bg-positive" : sig.direction === "bearish" ? "bg-negative" : "bg-muted"
              )} />
              <span className="text-xs">{sig.indicator}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted">{sig.signal}</span>
              <GlowBadge
                variant={sig.direction === "bullish" ? "success" : sig.direction === "bearish" ? "danger" : "default"}
              >
                {sig.direction}
              </GlowBadge>
            </div>
          </div>
        ))}
      </div>

      {/* Key Levels */}
      <div className="mb-3 grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-positive/5 p-2">
          <div className="flex items-center gap-1">
            <Target className="h-3 w-3 text-positive" />
            <span className="text-[10px] text-muted">Support</span>
          </div>
          <p className="font-mono text-xs font-bold text-positive">{formatCurrency(data.support)}</p>
        </div>
        <div className="rounded-lg bg-negative/5 p-2">
          <div className="flex items-center gap-1">
            <Target className="h-3 w-3 text-negative" />
            <span className="text-[10px] text-muted">Resistance</span>
          </div>
          <p className="font-mono text-xs font-bold text-negative">{formatCurrency(data.resistance)}</p>
        </div>
      </div>

      {/* Summary */}
      <p className="text-xs text-muted leading-relaxed">{data.summary}</p>
    </GlassCard>
  );
}
