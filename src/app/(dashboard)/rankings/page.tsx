"use client";

import { Trophy, Brain, Sparkles, Target, Shield } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { RankPanel } from "@/components/ranking/rank-panel";
import { cn } from "@/lib/utils";

export default function RankingsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-xl font-bold tracking-tight flex items-center gap-2 sm:text-2xl">
          <Trophy className="h-5 w-5 text-amber sm:h-6 sm:w-6" />
          <span className="gradient-text">Stock Rankings</span>
        </h1>
        <p className="mt-1 text-xs text-muted sm:text-sm">
          Machine-learning rankings across a universe of liquid equities
        </p>
      </div>

      {/* How it works */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          {
            icon: Brain,
            label: "Train",
            desc: "A model per ticker is fit on real historical OHLCV",
            color: "text-cyan",
          },
          {
            icon: Sparkles,
            label: "Extract",
            desc: "35 technical features engineered from each bar series",
            color: "text-purple",
          },
          {
            icon: Target,
            label: "Rank",
            desc: "Sorted by predicted probability of a bullish outcome",
            color: "text-amber",
          },
        ].map(({ icon: Icon, label, desc, color }) => (
          <GlassCard key={label} padding="sm">
            <div className="flex items-start gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                <Icon className={cn("h-4 w-4", color)} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold">{label}</p>
                <p className="text-[10px] text-muted mt-0.5">{desc}</p>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      <RankPanel />

      {/* Caveat */}
      <GlassCard padding="sm">
        <div className="flex items-start gap-2">
          <Shield className="h-3.5 w-3.5 text-amber-400 mt-0.5 shrink-0" />
          <p className="text-[10px] text-muted leading-relaxed">
            <span className="font-semibold text-foreground">Methodology note:</span> Rankings reflect
            the output of a model trained on historical price data. They are not investment advice and
            carry no guarantee of future performance. Always verify with your own research and risk
            management.
          </p>
        </div>
      </GlassCard>
    </div>
  );
}
