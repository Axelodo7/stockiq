"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Brain,
  FileText,
  RefreshCw,
  BarChart3,
  Activity,
  TrendingUp,
  TrendingDown,
  Star,
  Plus,
} from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { MetricGlass } from "@/components/ui/metric-glass";
import { GlowBadge } from "@/components/ui/glow-badge";
import { GradientButton } from "@/components/ui/gradient-button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CandlestickChart } from "@/components/charts/candlestick-chart";
import { VolumeChart } from "@/components/charts/volume-chart";
import { MiniSparkline } from "@/components/charts/mini-sparkline";
import { formatCurrency, formatCompact } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { PredictionCard } from "@/components/predictions/prediction-card";
import { RiskGauge } from "@/components/predictions/risk-gauge";
import { ModelAgreementChart } from "@/components/predictions/model-agreement-chart";
import { ExplainabilityPanel } from "@/components/predictions/explainability-panel";
import { DisclaimerBanner } from "@/components/predictions/disclaimer-banner";
import { BacktestPanel } from "@/components/predictions/backtest-panel";
import { LoadingSkeleton } from "@/components/feedback/loading-skeleton";
import { AIAnalysisCard } from "@/components/ai/ai-analysis-card";
import { TrendAnalysisCard } from "@/components/ai/trend-analysis-card";
import type { FullPrediction, BacktestResult } from "@/types";
import type { AIAnalysis, TrendAnalysis } from "@/lib/services/python-client";
import { getStockInfo, generatePriceHistory } from "@/lib/services/market-mock";

export default function StockDetailPage() {
  const params = useParams();
  const symbol = (params.symbol as string).toUpperCase();
  const stock = getStockInfo(symbol);
  const displaySymbol = symbol;
  const ohlcvData = generatePriceHistory(stock.price, 4788);

  const [prediction, setPrediction] = useState<FullPrediction | null>(null);
  const [loadingPrediction, setLoadingPrediction] = useState(false);

  const fetchPrediction = useCallback(async () => {
    setLoadingPrediction(true);
    try {
      const res = await fetch("/api/predictions/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticker: displaySymbol }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setPrediction(json.data);
      }
    } catch {
      // Silently fail
    } finally {
      setLoadingPrediction(false);
    }
  }, [displaySymbol]);

  useEffect(() => {
    fetchPrediction();
  }, [displaySymbol, fetchPrediction]);

  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);

  const fetchAIAnalysis = useCallback(async () => {
    setLoadingAI(true);
    try {
      const res = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticker: displaySymbol, data: ohlcvData.slice(-60) }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setAiAnalysis(json.data);
      }
    } catch {
      // Silently fail
    } finally {
      setLoadingAI(false);
    }
  }, [displaySymbol, ohlcvData]);

  const [trendAnalysis, setTrendAnalysis] = useState<TrendAnalysis | null>(null);
  const [loadingTrend, setLoadingTrend] = useState(false);

  const fetchTrendAnalysis = useCallback(async () => {
    setLoadingTrend(true);
    try {
      const res = await fetch("/api/ai/trends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticker: displaySymbol, data: ohlcvData }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setTrendAnalysis(json.data);
      }
    } catch {
      // Silently fail
    } finally {
      setLoadingTrend(false);
    }
  }, [displaySymbol, ohlcvData]);

  useEffect(() => {
    fetchAIAnalysis();
    fetchTrendAnalysis();
  }, [displaySymbol, fetchAIAnalysis, fetchTrendAnalysis]);

  const [backtestResult, setBacktestResult] = useState<BacktestResult | null>(null);
  const [loadingBacktest, setLoadingBacktest] = useState(false);

  const runBacktest = useCallback(
    async (modelType: string) => {
      setLoadingBacktest(true);
      try {
        const res = await fetch("/api/backtest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ticker: displaySymbol, model_type: modelType }),
        });
        const json = await res.json();
        if (json.success && json.data) {
          setBacktestResult(json.data);
        }
      } catch {
        // silently fail
      } finally {
        setLoadingBacktest(false);
      }
    },
    [displaySymbol]
  );

  const priceRange = stock.high - stock.low;
  const pricePosition = priceRange > 0 ? ((stock.price - stock.low) / priceRange) * 100 : 50;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start gap-3 sm:items-center sm:gap-4">
        <Link
          href="/dashboard"
          className="rounded-lg p-2 text-muted transition-colors hover:bg-white/[0.05] hover:text-foreground"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <h1 className="font-display text-xl font-bold tracking-tight sm:text-2xl">
              <span className="font-mono">{displaySymbol}</span>
            </h1>
            <GlowBadge variant="default">{stock.sector}</GlowBadge>
          </div>
          <p className="text-xs text-muted sm:text-sm">{stock.name}</p>
        </div>
        <div className="text-right ml-auto">
          <p className="font-mono text-2xl font-bold sm:text-3xl">{formatCurrency(stock.price)}</p>
          <div className="flex items-center justify-end gap-1.5 sm:gap-2">
            {stock.change >= 0 ? (
              <TrendingUp className="h-3.5 w-3.5 text-positive sm:h-4 sm:w-4" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5 text-negative sm:h-4 sm:w-4" />
            )}
            <span
              className={cn(
                "font-mono text-xs font-bold sm:text-sm",
                stock.change >= 0 ? "text-positive" : "text-negative"
              )}
            >
              {stock.change >= 0 ? "+" : ""}
              {stock.change.toFixed(2)} ({stock.changePercent.toFixed(2)}%)
            </span>
          </div>
        </div>
      </div>

      {/* Price Range Bar */}
      <GlassCard padding="sm">
        <div className="flex items-center gap-2 sm:gap-4">
          <span className="text-[10px] text-muted sm:text-xs">52W Low</span>
          <div className="relative flex-1">
            <div className="h-1.5 w-full rounded-full bg-white/[0.05]">
              <div
                className="h-1.5 rounded-full bg-gradient-to-r from-negative via-accent to-positive"
                style={{ width: `${pricePosition}%` }}
              />
            </div>
          </div>
          <span className="text-[10px] text-muted sm:text-xs">52W High</span>
        </div>
        <div className="mt-1 flex justify-between">
          <span className="font-mono text-[10px] text-negative sm:text-xs">{formatCurrency(stock.low52w)}</span>
          <span className="font-mono text-[10px] font-bold sm:text-xs">{formatCurrency(stock.price)}</span>
          <span className="font-mono text-[10px] text-positive sm:text-xs">{formatCurrency(stock.high52w)}</span>
        </div>
      </GlassCard>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        <MetricGlass label="Market Cap" value={formatCompact(stock.marketCap)} />
        <MetricGlass label="Volume" value={formatCompact(stock.volume)} />
        <MetricGlass label="P/E" value={stock.peRatio.toFixed(1)} />
        <MetricGlass label="EPS" value={`$${stock.eps.toFixed(2)}`} />
        <MetricGlass label="Dividend" value={stock.dividend > 0 ? `$${stock.dividend.toFixed(2)}` : "N/A"} />
        <MetricGlass label="Beta" value={stock.beta.toFixed(2)} />
        <MetricGlass label="Open" value={formatCurrency(stock.open)} />
        <MetricGlass label="Prev Close" value={formatCurrency(stock.prevClose)} />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="charts" className="space-y-6">
        <div className="overflow-x-auto">
          <TabsList className="w-full min-w-0 sm:w-auto">
            <TabsTrigger value="charts" className="gap-1.5">
              <BarChart3 className="h-3.5 w-3.5" />
              Charts
            </TabsTrigger>
            <TabsTrigger value="predictions" className="gap-1.5">
              <Brain className="h-3.5 w-3.5" />
              Predictions
            </TabsTrigger>
            <TabsTrigger value="backtest" className="gap-1.5">
              <Activity className="h-3.5 w-3.5" />
              Backtest
            </TabsTrigger>
            <TabsTrigger value="analysis" className="gap-1.5">
              <FileText className="h-3.5 w-3.5" />
              Analysis
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Charts Tab */}
        <TabsContent value="charts" className="space-y-4">
          <GlassCard padding="none">
            <div className="flex items-center justify-between border-b border-white/[0.06] px-3 py-2 sm:px-4 sm:py-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-accent" />
                <h2 className="font-display text-sm font-semibold">Price Chart</h2>
              </div>
              <div className="flex gap-0.5 sm:gap-1">
                {["1D", "1W", "1M", "3M", "6M", "1Y"].map((tf) => (
                  <button
                    key={tf}
                    className={cn(
                      "rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors sm:px-2",
                      tf === "3M" ? "bg-accent/20 text-accent" : "text-muted hover:text-foreground"
                    )}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>
            <CandlestickChart data={ohlcvData} height={400} />
          </GlassCard>

          <GlassCard padding="none">
            <div className="border-b border-white/[0.06] px-4 py-3">
              <h2 className="font-display text-sm font-semibold">Volume</h2>
            </div>
            <VolumeChart
              data={ohlcvData.map((bar, i) => ({
                date: bar.date,
                volume: bar.volume,
                close: bar.close,
                prevClose: i > 0 ? ohlcvData[i - 1].close : bar.open,
              }))}
              height={150}
            />
          </GlassCard>
        </TabsContent>

        {/* Predictions Tab */}
        <TabsContent value="predictions" className="space-y-6">
          <DisclaimerBanner />

          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-base font-semibold sm:text-lg">
              AI Predictions for <span className="font-mono">{displaySymbol}</span>
            </h2>
            <GradientButton
              variant="ghost"
              size="sm"
              onClick={fetchPrediction}
              disabled={loadingPrediction}
            >
              <RefreshCw className={cn("h-3 w-3", loadingPrediction && "animate-spin")} />
              Refresh
            </GradientButton>
          </div>

          {loadingPrediction && !prediction ? (
            <LoadingSkeleton />
          ) : prediction ? (
            <div className="space-y-6">
              <PredictionCard windows={prediction.windows} />
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <RiskGauge risk={prediction.risk} />
                <ModelAgreementChart prediction={prediction} />
              </div>
              <ExplainabilityPanel explainability={prediction.explainability} />
            </div>
          ) : (
            <GlassCard className="flex flex-col items-center justify-center py-12">
              <Brain className="mb-4 h-12 w-12 text-muted/30" />
              <p className="text-sm text-muted">
                Unable to generate predictions. Please try again.
              </p>
            </GlassCard>
          )}
        </TabsContent>

        {/* Backtest Tab */}
        <TabsContent value="backtest" className="space-y-6">
          <DisclaimerBanner />
          <div>
            <h2 className="mb-1 font-display text-lg font-semibold">
              Backtest: <span className="font-mono">{displaySymbol}</span>
            </h2>
            <p className="text-sm text-muted">
              Walk-forward backtesting with real ML models.
            </p>
          </div>
          <BacktestPanel
            result={backtestResult}
            isLoading={loadingBacktest}
            ticker={displaySymbol}
            onRunBacktest={runBacktest}
          />
        </TabsContent>

        {/* Analysis Tab */}
        <TabsContent value="analysis" className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-base font-semibold sm:text-lg">
              AI Analysis for <span className="font-mono">{displaySymbol}</span>
            </h2>
            <GradientButton
              variant="ghost"
              size="sm"
              onClick={() => { fetchAIAnalysis(); fetchTrendAnalysis(); }}
              disabled={loadingAI || loadingTrend}
            >
              <RefreshCw className={cn("h-3 w-3", (loadingAI || loadingTrend) && "animate-spin")} />
              Refresh
            </GradientButton>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <AIAnalysisCard data={aiAnalysis} isLoading={loadingAI} />
            <TrendAnalysisCard data={trendAnalysis} isLoading={loadingTrend} />
          </div>

          <GlassCard>
            <div className="mb-4 flex items-center gap-2">
              <Activity className="h-4 w-4 text-cyan" />
              <h2 className="font-display text-sm font-semibold">Trading Data</h2>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { label: "Open", value: stock.open },
                { label: "High", value: stock.high },
                { label: "Low", value: stock.low },
                { label: "Prev Close", value: stock.prevClose },
              ].map((item) => (
                <div key={item.label}>
                  <p className="text-[10px] font-medium uppercase text-muted">{item.label}</p>
                  <p className="mt-1 font-mono text-sm font-bold">{formatCurrency(item.value)}</p>
                </div>
              ))}
            </div>
          </GlassCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}
