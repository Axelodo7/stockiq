"use client";

import {
  ScanLine,
  Sparkles,
  CheckCircle2,
  Target,
  Shield,
  TrendingUp,
} from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { ChartAnalyzer } from "@/components/chart-analyzer/chart-analyzer";

export default function ChartAnalyzerPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div className="min-w-0">
          <h1 className="font-display text-xl font-bold tracking-tight flex items-center gap-2 sm:text-2xl">
            <ScanLine className="h-5 w-5 text-accent sm:h-6 sm:w-6" />
            <span className="gradient-text">Chart Analyzer</span>
          </h1>
          <p className="mt-1 text-xs text-muted sm:text-sm">
            Upload any chart screenshot — get AI-powered entry, stop loss, and take profit levels
          </p>
        </div>
      </div>

      {/* Feature pills */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          { icon: Target, label: "Take Profits", desc: "3 TP levels" },
          { icon: Shield, label: "Stop Loss", desc: "Risk-managed" },
          { icon: TrendingUp, label: "Entry Point", desc: "Optimal price" },
          { icon: Sparkles, label: "AI Powered", desc: "Pattern detection" },
        ].map(({ icon: Icon, label, desc }) => (
          <GlassCard key={label} padding="sm">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                <Icon className="h-4 w-4 text-accent" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold">{label}</p>
                <p className="truncate text-[10px] text-muted">{desc}</p>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Analyzer */}
      <ChartAnalyzer />

      {/* How it works */}
      <GlassCard>
        <div className="mb-3 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-accent" />
          <h2 className="font-display text-sm font-semibold">How It Works</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            {
              step: "1",
              title: "Upload Chart",
              desc: "Drag-drop, click, or paste any chart screenshot — candlestick, line, or bar charts all work",
            },
            {
              step: "2",
              title: "AI Analyzes",
              desc: "Our pattern detector identifies trend direction, support/resistance, and key Fibonacci levels",
            },
            {
              step: "3",
              title: "Get Levels",
              desc: "Receive entry price, stop loss, 3 take profit targets with risk:reward ratios",
            },
          ].map(({ step, title, desc }) => (
            <div key={step} className="flex items-start gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-accent-fg text-xs font-bold">
                {step}
              </div>
              <div>
                <p className="text-sm font-semibold">{title}</p>
                <p className="text-xs text-muted mt-1">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Best practices */}
      <GlassCard>
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber" />
          <h2 className="font-display text-sm font-semibold">For Best Results</h2>
        </div>
        <ul className="space-y-2 text-sm text-muted">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0 text-emerald-400" />
            Use clear candlestick or bar charts from platforms like TradingView, Binance, or MetaTrader
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0 text-emerald-400" />
            Charts with visible price action (green/red candles) work best
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0 text-emerald-400" />
            Daily and 4H timeframes are recommended — they have the cleanest signals
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0 text-emerald-400" />
            Always combine AI levels with your own analysis and risk management
          </li>
        </ul>
      </GlassCard>
    </div>
  );
}
