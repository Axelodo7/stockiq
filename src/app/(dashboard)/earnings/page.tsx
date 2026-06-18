"use client";

import Link from "next/link";
import {
  Calendar,
  Clock,
  TrendingUp,
  TrendingDown,
  ChevronLeft,
  ChevronRight,
  Zap,
  DollarSign,
} from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { GlowBadge } from "@/components/ui/glow-badge";
import { MiniSparkline } from "@/components/charts/mini-sparkline";
import { formatCurrency, cn, seededRandom } from "@/lib/utils";

interface EarningsEvent {
  id: string;
  ticker: string;
  name: string;
  date: string;
  time: "before" | "after" | "during";
  expectedEPS: number;
  actualEPS?: number;
  revenue?: number;
  surprise?: number;
  status: "upcoming" | "reported";
  sector: string;
}

const earnings: EarningsEvent[] = [
  { id: "1", ticker: "NVDA", name: "NVIDIA Corp.", date: "2026-06-25", time: "after", expectedEPS: 0.82, revenue: 44.2e9, status: "upcoming", sector: "Technology" },
  { id: "2", ticker: "AAPL", name: "Apple Inc.", date: "2026-07-02", time: "after", expectedEPS: 1.52, revenue: 94.5e9, status: "upcoming", sector: "Technology" },
  { id: "3", ticker: "MSFT", name: "Microsoft Corp.", date: "2026-07-09", time: "after", expectedEPS: 3.18, revenue: 68.1e9, status: "upcoming", sector: "Technology" },
  { id: "4", ticker: "AMZN", name: "Amazon.com Inc.", date: "2026-07-15", time: "after", expectedEPS: 1.43, revenue: 155.3e9, status: "upcoming", sector: "E-Commerce" },
  { id: "5", ticker: "TSLA", name: "Tesla Inc.", date: "2026-07-22", time: "after", expectedEPS: 0.88, revenue: 26.8e9, status: "upcoming", sector: "Automotive" },
  { id: "6", ticker: "META", name: "Meta Platforms", date: "2026-06-10", time: "after", actualEPS: 6.43, expectedEPS: 5.89, revenue: 42.3e9, surprise: 9.2, status: "reported", sector: "Technology" },
  { id: "7", ticker: "GOOGL", name: "Alphabet Inc.", date: "2026-06-08", time: "after", actualEPS: 2.18, expectedEPS: 1.95, revenue: 96.4e9, surprise: 11.8, status: "reported", sector: "Technology" },
  { id: "8", ticker: "JPM", name: "JPMorgan Chase", date: "2026-06-12", time: "before", actualEPS: 4.81, expectedEPS: 4.62, revenue: 45.3e9, surprise: 4.1, status: "reported", sector: "Financial" },
  { id: "9", ticker: "V", name: "Visa Inc.", date: "2026-06-14", time: "after", actualEPS: 2.76, expectedEPS: 2.65, revenue: 9.8e9, surprise: 4.2, status: "reported", sector: "Financial" },
  { id: "10", ticker: "JNJ", name: "Johnson & Johnson", date: "2026-06-18", time: "before", actualEPS: 2.91, expectedEPS: 2.82, revenue: 22.1e9, surprise: 3.2, status: "reported", sector: "Healthcare" },
];

const upcoming = earnings.filter((e) => e.status === "upcoming").sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
const reported = earnings.filter((e) => e.status === "reported").sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

const timeConfig: Record<string, { label: string; color: string }> = {
  before: { label: "Pre-Market", color: "text-cyan" },
  after: { label: "After-Hours", color: "text-purple" },
  during: { label: "During Market", color: "text-amber" },
};

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

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function daysUntil(dateStr: string): number {
  const now = new Date();
  const target = new Date(dateStr);
  const diff = target.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function EarningsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="font-display text-xl font-bold tracking-tight sm:text-2xl">
            <span className="gradient-text">Earnings Calendar</span>
          </h1>
          <p className="mt-1 text-xs text-muted sm:text-sm">Upcoming and recent earnings reports</p>
        </div>
        <div className="flex items-center gap-2">
          <GlowBadge variant="info" glow>{upcoming.length} upcoming</GlowBadge>
        </div>
      </div>

      {/* Upcoming Earnings Timeline */}
      <GlassCard padding="none">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-cyan" />
            <h2 className="font-display text-sm font-semibold">Upcoming Earnings</h2>
          </div>
          <div className="flex gap-1">
            <button className="rounded p-1 text-muted hover:bg-white/[0.05] hover:text-foreground">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button className="rounded p-1 text-muted hover:bg-white/[0.05] hover:text-foreground">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="divide-y divide-white/[0.04]">
          {upcoming.map((event) => {
            const days = daysUntil(event.date);
            const time = timeConfig[event.time];
            return (
              <div key={event.id} className="flex items-center gap-4 px-4 py-3">
                {/* Date Badge */}
                <div className="flex flex-col items-center w-14">
                  <span className="text-[10px] text-muted">{formatDate(event.date)}</span>
                  <span className={cn(
                    "font-mono text-xs font-bold",
                    days <= 3 ? "text-negative" : days <= 7 ? "text-amber" : "text-foreground"
                  )}>
                    {days}d
                  </span>
                </div>

                {/* Sparkline */}
                <div className="w-16">
                  <MiniSparkline
                    data={generateSparkData(100, true)}
                    positive={true}
                    width={64}
                    height={24}
                  />
                </div>

                {/* Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Link href={`/stock/${event.ticker}`} className="font-mono text-xs font-bold hover:text-accent">
                      {event.ticker}
                    </Link>
                    <GlowBadge variant={time.color === "text-cyan" ? "info" : "purple"}>
                      {time.label}
                    </GlowBadge>
                  </div>
                  <p className="text-[10px] text-muted">{event.name}</p>
                </div>

                {/* EPS Estimate */}
                <div className="text-right">
                  <p className="text-[10px] text-muted">Est. EPS</p>
                  <p className="font-mono text-xs font-bold">${event.expectedEPS.toFixed(2)}</p>
                </div>

                {/* Revenue Estimate */}
                <div className="text-right hidden sm:block">
                  <p className="text-[10px] text-muted">Est. Revenue</p>
                  <p className="font-mono text-xs font-bold">${(event.revenue! / 1e9).toFixed(1)}B</p>
                </div>
              </div>
            );
          })}
        </div>
      </GlassCard>

      {/* Recently Reported */}
      <GlassCard padding="none">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber" />
            <h2 className="font-display text-sm font-semibold">Recently Reported</h2>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/[0.04] text-left text-xs uppercase text-muted">
                <th className="px-4 py-2 font-medium">Company</th>
                <th className="px-4 py-2 text-right font-medium">Date</th>
                <th className="px-4 py-2 text-right font-medium">EPS Est.</th>
                <th className="px-4 py-2 text-right font-medium">EPS Actual</th>
                <th className="px-4 py-2 text-right font-medium">Surprise</th>
                <th className="px-4 py-2 text-right font-medium">Revenue</th>
                <th className="px-4 py-2 text-right font-medium">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {reported.map((event) => {
                const beat = event.actualEPS! > event.expectedEPS;
                return (
                  <tr key={event.id} className="hover:bg-white/[0.02]">
                    <td className="px-4 py-2.5">
                      <Link href={`/stock/${event.ticker}`} className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 font-mono text-[10px] font-bold text-accent">
                          {event.ticker.slice(0, 2)}
                        </div>
                        <div>
                          <p className="font-mono text-xs font-bold">{event.ticker}</p>
                          <p className="text-[10px] text-muted">{event.name}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 text-right text-muted">{formatDate(event.date)}</td>
                    <td className="px-4 py-2.5 text-right font-mono">${event.expectedEPS.toFixed(2)}</td>
                    <td className={cn("px-4 py-2.5 text-right font-mono font-bold", beat ? "text-positive" : "text-negative")}>
                      ${event.actualEPS!.toFixed(2)}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {beat ? (
                          <TrendingUp className="h-3 w-3 text-positive" />
                        ) : (
                          <TrendingDown className="h-3 w-3 text-negative" />
                        )}
                        <span className={cn("font-mono font-bold", beat ? "text-positive" : "text-negative")}>
                          +{event.surprise?.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono">
                      ${(event.revenue! / 1e9).toFixed(1)}B
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <MiniSparkline
                        data={generateSparkData(100, beat)}
                        positive={beat}
                        width={60}
                        height={20}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
