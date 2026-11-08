"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Brain,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  AlertTriangle,
} from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { MetricGlass } from "@/components/ui/metric-glass";
import { BuyRecommendationCard, SellRecommendationCard, EmptyRecommendations } from "@/components/ai/recommendation-card";
import { cn } from "@/lib/utils";
import { usePortfolio } from "@/hooks/use-portfolio";

interface StockRecommendation {
  ticker: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  signal: "strong_buy" | "buy" | "hold" | "sell" | "strong_sell";
  confidence: number;
  indicators: {
    rsi: number | null;
    rsiSignal: "oversold" | "overbought" | "neutral";
    macdSignal: "bullish" | "bearish" | "neutral";
    bollingerSignal: "below_lower" | "above_upper" | "within";
    smaCross: "golden" | "death" | "none";
    momentum: number;
  };
  reasoning: string[];
}

interface PortfolioSellRecommendation {
  ticker: string;
  name: string;
  shares: number;
  avgCost: number;
  currentPrice: number;
  gainLoss: number;
  gainLossPercent: number;
  signal: "sell" | "reduce";
  confidence: number;
  reasoning: string[];
  allocationPercent: number;
  riskLevel: "low" | "medium" | "high";
}

interface RecommendationsData {
  buyRecommendations: StockRecommendation[];
  sellRecommendations: PortfolioSellRecommendation[];
  holdCount: number;
  marketSentiment: "bullish" | "bearish" | "neutral";
  analyzedCount: number;
  analyzedAt: string;
  source: string;
}

const sentimentConfig = {
  bullish: { label: "Bullish", icon: TrendingUp, color: "text-emerald-400", bg: "bg-emerald-500/10" },
  bearish: { label: "Bearish", icon: TrendingDown, color: "text-red-400", bg: "bg-red-500/10" },
  neutral: { label: "Neutral", icon: Minus, color: "text-zinc-400", bg: "bg-zinc-500/10" },
};

export default function AIAdvisorPage() {
  const { positions: dbPositions, isSignedIn, loading: portfolioLoading } = usePortfolio();
  const [data, setData] = useState<RecommendationsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [tab, setTab] = useState<"buy" | "sell" | "all">("all");

  const portfolioPositions = dbPositions.map((p) => ({
    ticker: p.stock.ticker,
    name: p.stock.companyName,
    shares: p.shares,
    avgCost: p.avgCost,
  }));
  const hasPortfolio = isSignedIn === true && dbPositions.length > 0;

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Convert DB positions to the shape the AI endpoint expects
      const portfolio = dbPositions.map((p) => ({
        ticker: p.stock.ticker,
        name: p.stock.companyName,
        shares: p.shares,
        avgCost: p.avgCost,
      }));
      const res = await fetch("/api/ai/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ portfolio }),
      });
      const json = await res.json();
      if (json.success) {
        setData(json.data);
        setLastUpdated(new Date());
      } else {
        setError(json.error || "Failed to load recommendations");
      }
    } catch {
      setError("Failed to connect to recommendation engine");
    } finally {
      setLoading(false);
    }
  }, [dbPositions]);

  useEffect(() => {
    // Don't fetch until portfolio is loaded (or determined empty)
    if (portfolioLoading) return;
    fetchData();
  }, [fetchData, portfolioLoading]);

  const sentiment = data ? sentimentConfig[data.marketSentiment] : sentimentConfig.neutral;
  const SentimentIcon = sentiment.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
            <Brain className="h-6 w-6 text-accent" />
            AI Stock Advisor
          </h1>
          <p className="text-sm text-muted mt-1">
            AI-powered buy &amp; sell recommendations based on technical analysis
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg border border-border bg-panel px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-panel-elevated disabled:opacity-50"
        >
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          Refresh
        </button>
      </div>

      {/* Disclaimer */}
      <GlassCard padding="sm">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
          <p className="text-xs text-muted">
            <span className="font-semibold text-foreground">Disclaimer:</span> These recommendations are generated by algorithmic analysis of technical indicators and should not be considered financial advice. Always do your own research and consult a financial advisor before making investment decisions.
          </p>
        </div>
      </GlassCard>

      {/* Metrics */}
      {data && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MetricGlass
            label="Market Sentiment"
            value={sentiment.label}
            icon={<SentimentIcon className={cn("h-4 w-4", sentiment.color)} />}
            className={cn("border", sentiment.bg)}
          />
          <MetricGlass
            label="Buy Signals"
            value={data.buyRecommendations.length.toString()}
            icon={<TrendingUp className="h-4 w-4 text-emerald-400" />}
          />
          <MetricGlass
            label="Sell Signals"
            value={data.sellRecommendations.length.toString()}
            icon={<TrendingDown className="h-4 w-4 text-red-400" />}
          />
          <MetricGlass
            label="Stocks Analyzed"
            value={data.analyzedCount.toString()}
            icon={<Sparkles className="h-4 w-4 text-accent" />}
          />
        </div>
      )}

      {/* Tab navigation */}
      <div className="flex items-center gap-1 rounded-lg border border-border bg-panel p-1">
        {(["all", "buy", "sell"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "flex-1 min-h-[44px] rounded-md px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-colors",
              tab === t
                ? "bg-accent/10 text-accent"
                : "text-muted hover:text-foreground"
            )}
          >
            <span className="hidden sm:inline">
              {t === "all" ? "All Recommendations" : t === "buy" ? "Buy Recommendations" : "Sell Recommendations"}
            </span>
            <span className="sm:hidden">
              {t === "all" ? "All" : t === "buy" ? "Buy" : "Sell"}
            </span>
          </button>
        ))}
      </div>

      {/* Loading state */}
      {loading && !data && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <GlassCard key={i}>
              <div className="animate-pulse space-y-3">
                <div className="h-5 w-24 rounded bg-panel-elevated" />
                <div className="h-3 w-32 rounded bg-panel-elevated" />
                <div className="h-2 w-full rounded bg-panel-elevated" />
                <div className="flex gap-2">
                  <div className="h-12 flex-1 rounded bg-panel-elevated" />
                  <div className="h-12 flex-1 rounded bg-panel-elevated" />
                  <div className="h-12 flex-1 rounded bg-panel-elevated" />
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <GlassCard>
          <div className="flex flex-col items-center justify-center py-12">
            <AlertTriangle className="h-10 w-10 text-red-400 mb-3" />
            <p className="text-sm font-medium text-foreground mb-1">Analysis Failed</p>
            <p className="text-xs text-muted text-center max-w-xs">{error}</p>
            <button
              onClick={fetchData}
              className="mt-4 rounded-lg border border-border bg-panel px-4 py-2 text-sm font-medium text-foreground hover:bg-panel-elevated"
            >
              Try Again
            </button>
          </div>
        </GlassCard>
      )}

      {/* Results */}
      {data && !loading && (
        <div className="space-y-8">
          {/* Buy Recommendations */}
          {(tab === "all" || tab === "buy") && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5 text-emerald-400" />
                <h2 className="font-display text-lg font-bold text-foreground">
                  Buy Recommendations
                </h2>
                <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
                  {data.buyRecommendations.length}
                </span>
              </div>
              {data.buyRecommendations.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {data.buyRecommendations.map((rec) => (
                    <BuyRecommendationCard key={rec.ticker} rec={rec} />
                  ))}
                </div>
              ) : (
                <EmptyRecommendations type="buy" />
              )}
            </section>
          )}

          {/* Sell Recommendations */}
          {(tab === "all" || tab === "sell") && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <TrendingDown className="h-5 w-5 text-red-400" />
                <h2 className="font-display text-lg font-bold text-foreground">
                  {hasPortfolio ? "Your Portfolio Sell Signals" : "Top Sell Candidates"}
                </h2>
                <span className="rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-semibold text-red-400">
                  {data.sellRecommendations.length}
                </span>
              </div>
              {data.sellRecommendations.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {data.sellRecommendations.map((rec) => (
                    <SellRecommendationCard key={rec.ticker} rec={rec} />
                  ))}
                </div>
              ) : (
                <EmptyRecommendations type="sell" />
              )}
            </section>
          )}

          {/* Footer info */}
          {lastUpdated && (
            <p className="text-xs text-muted text-center">
              Last updated: {lastUpdated.toLocaleTimeString()} &middot; Source: {data.source} analysis &middot; {data.analyzedCount} stocks analyzed &middot; {data.holdCount} on hold
            </p>
          )}
        </div>
      )}
    </div>
  );
}
