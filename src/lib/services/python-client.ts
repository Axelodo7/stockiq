import type { FullPrediction, OHLCV } from "@/types";

const PYTHON_URL = process.env.PYTHON_SERVICE_URL || "http://localhost:8000";
const TIMEOUT_MS = 5000;

export async function fetchPython<T>(
  path: string,
  body?: unknown,
  timeout = TIMEOUT_MS
): Promise<T | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    const res = await fetch(`${PYTHON_URL}${path}`, {
      method: body ? "POST" : "GET",
      headers: body ? { "Content-Type": "application/json" } : {},
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

function generateMockPrediction(ticker: string, data: OHLCV[]): FullPrediction {
  const closes = data.map((d) => d.close);
  const currentPrice = closes[closes.length - 1] || 100;

  const sma20 =
    closes.length >= 20
      ? closes.slice(-20).reduce((a, b) => a + b, 0) / 20
      : currentPrice;
  const sma50 =
    closes.length >= 50
      ? closes.slice(-50).reduce((a, b) => a + b, 0) / 50
      : currentPrice;

  const trend = currentPrice > sma20 ? 1 : -1;
  const momentum = closes.length >= 5 ? (closes[closes.length - 1] - closes[closes.length - 5]) / closes[closes.length - 5] : 0;

  let volatility = 0.02;
  if (closes.length >= 20) {
    const returns = [];
    for (let i = 1; i < closes.length; i++) {
      returns.push((closes[i] - closes[i - 1]) / closes[i - 1]);
    }
    const recentReturns = returns.slice(-20);
    const mean = recentReturns.reduce((a, b) => a + b, 0) / recentReturns.length;
    const variance =
      recentReturns.reduce((a, r) => a + (r - mean) ** 2, 0) /
      recentReturns.length;
    volatility = Math.max(Math.min(Math.sqrt(variance), 0.15), 0.005);
  }

  const direction = trend * 0.5 + (momentum > 0 ? 0.3 : -0.3) + (currentPrice > sma50 ? 0.2 : -0.2);
  const strength = Math.min(Math.abs(direction), 1);

  const windows = [
    { days: 1, label: "1D" },
    { days: 3, label: "3D" },
    { days: 7, label: "7D" },
    { days: 14, label: "14D" },
    { days: 30, label: "30D" },
    { days: 90, label: "90D" },
  ].map((w) => {
    const horizVol = volatility * Math.sqrt(w.days / 30);
    const drift = direction * strength * horizVol * 0.6;
    const price = currentPrice * (1 + drift);
    const confidence = Math.max(
      0.25,
      Math.min(0.95, (0.85 - volatility * 2 + strength * 0.15) * Math.max(0.3, 1 - (w.days / 180) * 0.5))
    );
    return {
      days: w.days,
      label: w.label,
      price: Math.round(price * 100) / 100,
      confidence: Math.round(confidence * 10000) / 10000,
      changePercent: Math.round(((price / currentPrice - 1) * 100) * 100) / 100,
    };
  });

  const bullish = Math.max(0.05, Math.min(0.95, 0.5 + direction * 0.4));
  const volScore = Math.min(volatility / 0.05, 1);
  const composite = volScore * 0.4 + 0.3 + 0.3;
  const riskRating =
    composite < 0.25 ? "LOW" : composite < 0.5 ? "MEDIUM" : composite < 0.75 ? "HIGH" : "EXTREME";

  return {
    ticker,
    currentPrice: Math.round(currentPrice * 100) / 100,
    windows,
    risk: {
      bullishProbability: Math.round(bullish * 10000) / 10000,
      bearishProbability: Math.round((1 - bullish) * 10000) / 10000,
      volatilityForecast: Math.round(volatility * 1.2 * 1000000) / 1000000,
      riskRating: riskRating as "LOW" | "MEDIUM" | "HIGH" | "EXTREME",
    },
    modelAgreement: Math.round(Math.min(1, 0.5 + strength * 0.4) * 10000) / 10000,
    uncertainty: Math.round(currentPrice * volatility * 1.5 * 100) / 100,
    explainability: {
      topFactors: [
        { indicator: "Moving Average Trend", contribution: 0.35, direction: trend > 0 ? "bullish" : "bearish" },
        { indicator: "Price Momentum", contribution: 0.28, direction: momentum > 0 ? "bullish" : "bearish" },
        { indicator: "RSI Signal", contribution: 0.18, direction: direction > 0 ? "bullish" : "bearish" },
        { indicator: "Volume Pattern", contribution: 0.12, direction: "bullish" },
        { indicator: "Bollinger Band Position", contribution: 0.07, direction: currentPrice > sma20 ? "bullish" : "bearish" },
      ],
      summary: `Prediction is ${direction > 0 ? "bullish" : "bearish"} primarily because the moving average trend shows ${direction > 0 ? "positive" : "negative"} momentum. Volatility is ${volatility > 0.03 ? "elevated" : volatility > 0.015 ? "moderate" : "low"}.`,
    },
    modelVersions: {
      LSTM: "1.0.0-mock",
      TRANSFORMER: "1.0.0-mock",
      XGBOOST: "1.0.0-mock",
      RANDOM_FOREST: "1.0.0-mock",
      ENSEMBLE: "1.0.0-mock",
    },
    disclaimer:
      "Predictions are estimates for analytical purposes only. Not investment advice. Past performance does not guarantee future results.",
  };
}

export async function getPrediction(
  ticker: string,
  data: OHLCV[]
): Promise<FullPrediction> {
  const result = await fetchPython<FullPrediction>("/predict/", {
    ticker,
    data,
  });

  if (result) return result;

  return generateMockPrediction(ticker, data);
}

export async function checkPythonHealth(): Promise<boolean> {
  const result = await fetchPython<{ status: string }>("/health", undefined, 2000);
  return result?.status === "ok";
}

// --- ML Training ---

export interface TrainResult {
  ticker: string;
  model_type: string;
  status: string;
  metrics: Record<string, unknown>;
  duration_ms: number;
}

export async function trainModel(
  ticker: string,
  modelType: string,
  data: OHLCV[]
): Promise<TrainResult | null> {
  return fetchPython<TrainResult>("/ml/train", {
    ticker,
    model_type: modelType,
    data,
  }, 30000);
}

export async function trainEnsemble(
  ticker: string,
  data: OHLCV[]
): Promise<Record<string, unknown> | null> {
  return fetchPython<Record<string, unknown>>("/ml/train/ensemble", {
    ticker,
    model_type: "ENSEMBLE",
    data,
  }, 60000);
}

export async function getTrainingHistory(
  ticker?: string
): Promise<unknown[]> {
  const query = ticker ? `?ticker=${ticker}` : "";
  return (await fetchPython<unknown[]>(`/ml/train/history${query}`)) || [];
}

export async function listModels(): Promise<unknown[]> {
  return (await fetchPython<unknown[]>("/ml/train/models")) || [];
}

// --- Backtesting ---

export interface BacktestResult {
  ticker: string;
  total_return: number;
  annualized_return: number | null;
  sharpe_ratio: number | null;
  max_drawdown: number;
  win_rate: number;
  profit_factor: number | null;
  total_trades: number;
  equity_curve: Array<{ date: string; equity: number; position: number }>;
  trades: Array<{
    entry_date: string;
    exit_date: string;
    entry_price: number;
    exit_price: number;
    shares: number;
    pnl: number;
    pnl_pct: number;
    reason: string;
  }>;
  initial_capital: number;
  final_capital: number;
}

export async function runBacktest(
  ticker: string,
  modelType: string,
  data: OHLCV[],
  initialCapital = 10000,
  commission = 0.005,
  slippageBps = 5
): Promise<BacktestResult | null> {
  return fetchPython<BacktestResult>("/ml/backtest", {
    ticker,
    model_type: modelType,
    data,
    initial_capital: initialCapital,
    commission,
    slippage_bps: slippageBps,
  }, 30000);
}

// --- AI Analysis ---

export interface AIAnalysis {
  ticker: string;
  overall_signal: string;
  conviction: string;
  bullish_probability: number;
  bearish_probability: number;
  signals: Array<{ indicator: string; signal: string; direction: string; value: number }>;
  support: number;
  resistance: number;
  volatility: number;
  trend_strength: number;
  volume_trend: string;
  summary: string;
  key_levels: Record<string, number | null>;
  generated_at: string;
}

export async function getAIAnalysis(
  ticker: string,
  data: OHLCV[]
): Promise<AIAnalysis | null> {
  return fetchPython<AIAnalysis>("/ai/analyze", { ticker, data }, 10000);
}

export interface MarketSummary {
  sentiment: string;
  avg_change_pct: number;
  avg_5d_return: number;
  avg_20d_return: number;
  bullish_count: number;
  bearish_count: number;
  total_stocks: number;
  top_gainers: Array<{ ticker: string; price: number; change_pct: number }>;
  top_losers: Array<{ ticker: string; price: number; change_pct: number }>;
  unusual_volume: Array<{ ticker: string; volume_ratio: number }>;
  individual: Record<string, unknown>;
  summary: string;
  generated_at: string;
}

export async function getMarketSummary(
  stocks: Record<string, OHLCV[]>
): Promise<MarketSummary | null> {
  return fetchPython<MarketSummary>("/ai/market-summary", { stocks }, 15000);
}

export interface TrendAnalysis {
  ticker: string;
  trends: Array<{ period: string; days: number; direction: string; slope_pct_per_day: number; strength: number }>;
  patterns: Array<{ pattern: string; confidence: number; description: string }>;
  momentum: { rsi_14: number; roc_10d: number; momentum_score: number };
  support_resistance: Record<string, number>;
  current_price: number;
  generated_at: string;
}

export async function getTrendAnalysis(
  ticker: string,
  data: OHLCV[]
): Promise<TrendAnalysis | null> {
  return fetchPython<TrendAnalysis>("/ai/trends", { ticker, data }, 10000);
}

export interface PortfolioRiskAnalysis {
  portfolio_metrics: {
    total_return_pct: number;
    volatility_annualized: number;
    sharpe_ratio: number;
    max_drawdown_pct: number;
    var_95_pct: number;
    beta: number;
    diversification_score: number;
  };
  individual_risk: Record<string, { volatility_annualized: number; max_drawdown: number; total_return: number }>;
  correlation_matrix: Record<string, Record<string, number>>;
  concentration: {
    herfindahl_index: number;
    effective_n: number;
    weights: Record<string, number>;
  };
  generated_at: string;
}

export async function getPortfolioRisk(
  positions: Record<string, OHLCV[]>,
  weights?: Record<string, number>
): Promise<PortfolioRiskAnalysis | null> {
  return fetchPython<PortfolioRiskAnalysis>("/ai/portfolio-risk", { positions, weights }, 15000);
}

export interface EarningsAnalysis {
  ticker: string;
  current_price: number;
  earnings_date: string | null;
  expectations: { surprise_pct: number | null; beat: boolean | null; magnitude: string | null };
  price_reaction: number | null;
  volume_spike: number;
  drift_analysis: { avg_1d_return: number; avg_5d_return: number; volatility_of_returns: number; positive_days_pct: number } | null;
  assessment: string;
  generated_at: string;
}

export async function getEarningsAnalysis(
  ticker: string,
  data: OHLCV[],
  earningsDate?: string,
  reportedEPS?: number,
  expectedEPS?: number,
  revenue?: number
): Promise<EarningsAnalysis | null> {
  return fetchPython<EarningsAnalysis>("/ai/earnings", {
    ticker,
    data,
    earnings_date: earningsDate,
    reported_eps: reportedEPS,
    expected_eps: expectedEPS,
    revenue,
  }, 10000);
}
