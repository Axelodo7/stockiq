"use client";

import dynamic from "next/dynamic";
import { ComponentType } from "react";

/**
 * Lazy-loaded chart wrappers for code splitting.
 * Heavy chart libraries (lightweight-charts, recharts) are split into separate chunks.
 */

// Candlestick chart (lightweight-charts)
export const LazyCandlestickChart = dynamic(
  () => import("@/components/charts/candlestick-chart").then((m) => m.CandlestickChart),
  {
    loading: () => <div className="h-[400px] animate-pulse rounded-lg bg-panel-elevated" />,
    ssr: false,
  }
);

// Volume chart (lightweight-charts)
export const LazyVolumeChart = dynamic(
  () => import("@/components/charts/volume-chart").then((m) => m.VolumeChart),
  {
    loading: () => <div className="h-[150px] animate-pulse rounded-lg bg-panel-elevated" />,
    ssr: false,
  }
);

// Mini sparkline (lightweight-charts)
export const LazyMiniSparkline = dynamic(
  () => import("@/components/charts/mini-sparkline").then((m) => m.MiniSparkline),
  { ssr: false }
);

// Equity curve (lightweight-charts)
export const LazyEquityCurveChart = dynamic(
  () => import("@/components/charts/equity-curve").then((m) => m.EquityCurveChart),
  {
    loading: () => <div className="h-[300px] animate-pulse rounded-lg bg-panel-elevated" />,
    ssr: false,
  }
);

// Heatmap grid
export const LazyHeatmapGrid = dynamic(
  () => import("@/components/charts/heatmap-grid").then((m) => m.HeatmapGrid),
  { ssr: false }
);

// Sector map
export const LazySectorMap = dynamic(
  () => import("@/components/charts/sector-map").then((m) => m.SectorMap),
  { ssr: false }
);

// Portfolio allocation
export const LazyPortfolioAllocation = dynamic(
  () => import("@/components/charts/portfolio-allocation").then((m) => m.PortfolioAllocation),
  {
    loading: () => <div className="h-[200px] animate-pulse rounded-lg bg-panel-elevated" />,
    ssr: false,
  }
);

// AI Analysis card
export const LazyAIAnalysisCard = dynamic(
  () => import("@/components/ai/ai-analysis-card").then((m) => m.AIAnalysisCard),
  {
    loading: () => <div className="h-[300px] animate-pulse rounded-lg bg-panel-elevated" />,
    ssr: false,
  }
);

// Trend Analysis card
export const LazyTrendAnalysisCard = dynamic(
  () => import("@/components/ai/trend-analysis-card").then((m) => m.TrendAnalysisCard),
  {
    loading: () => <div className="h-[300px] animate-pulse rounded-lg bg-panel-elevated" />,
    ssr: false,
  }
);

// Earnings Analysis card
export const LazyEarningsAnalysisCard = dynamic(
  () => import("@/components/ai/earnings-analysis-card").then((m) => m.EarningsAnalysisCard),
  {
    loading: () => <div className="h-[300px] animate-pulse rounded-lg bg-panel-elevated" />,
    ssr: false,
  }
);

// Risk Analysis card
export const LazyRiskAnalysisCard = dynamic(
  () => import("@/components/ai/risk-analysis-card").then((m) => m.RiskAnalysisCard),
  {
    loading: () => <div className="h-[300px] animate-pulse rounded-lg bg-panel-elevated" />,
    ssr: false,
  }
);

// Market Summary card
export const LazyMarketSummaryCard = dynamic(
  () => import("@/components/ai/market-summary-card").then((m) => m.MarketSummaryCard),
  {
    loading: () => <div className="h-[300px] animate-pulse rounded-lg bg-panel-elevated" />,
    ssr: false,
  }
);

// Command palette
export const LazyCommandPalette = dynamic(
  () => import("@/components/layout/command-palette").then((m) => m.CommandPalette),
  { ssr: false }
);

// Backtest panel
export const LazyBacktestPanel = dynamic(
  () => import("@/components/predictions/backtest-panel").then((m) => m.BacktestPanel),
  {
    loading: () => <div className="h-[200px] animate-pulse rounded-lg bg-panel-elevated" />,
    ssr: false,
  }
);
