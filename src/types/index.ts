export type UserRole = "USER" | "ADMIN";
export type SubscriptionTier = "FREE" | "PRO" | "ENTERPRISE";
export type AlertType = "PRICE" | "VOLUME" | "PERCENT_CHANGE";
export type AlertCondition = "ABOVE" | "BELOW" | "PCT_UP" | "PCT_DOWN";
export type TransactionType = "BUY" | "SELL" | "DIVIDEND";
export type Timeframe = "1D" | "5D" | "1M" | "3M" | "6M" | "1Y" | "5Y" | "MAX";
export type ChartType = "line" | "area" | "candlestick";
export type ModelType = "LSTM" | "TRANSFORMER" | "XGBOOST" | "RANDOM_FOREST" | "ENSEMBLE";
export type RiskRating = "LOW" | "MEDIUM" | "HIGH" | "EXTREME";
export type ModelRunStatus = "training" | "completed" | "failed";

export interface User {
  id: string;
  email: string;
  username?: string | null;
  name?: string | null;
  image?: string | null;
  role: UserRole;
  subscriptionTier: SubscriptionTier;
  createdAt: Date;
}

export interface Stock {
  id: string;
  ticker: string;
  companyName: string;
  sector?: string | null;
  marketCap?: number | null;
  exchange?: string | null;
}

export interface HistoricalDataPoint {
  id: string;
  stockId: string;
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Prediction {
  id: string;
  stockId: string;
  predictionDate: Date;
  targetDate: Date;
  predictedPrice: number;
  confidenceScore: number;
  modelVersion: string;
}

export interface Portfolio {
  id: string;
  userId: string;
  name: string;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PortfolioPosition {
  id: string;
  portfolioId: string;
  stockId: string;
  shares: number;
  avgCost: number;
  stock?: Stock;
  createdAt: Date;
  updatedAt: Date;
}

export interface Transaction {
  id: string;
  portfolioId: string;
  stockId: string;
  type: TransactionType;
  shares: number;
  price: number;
  fees: number;
  totalAmount: number;
  executedAt: Date;
  createdAt: Date;
  stock?: Stock;
}

export interface Watchlist {
  id: string;
  userId: string;
  name: string;
  description?: string | null;
  items?: WatchlistItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface WatchlistItem {
  id: string;
  watchlistId: string;
  stockId: string;
  addedAt: Date;
  sortOrder: number;
  stock?: Stock;
}

export interface Alert {
  id: string;
  userId: string;
  stockId: string;
  type: AlertType;
  condition: AlertCondition;
  targetValue: number;
  isActive: boolean;
  lastTriggered?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  stock?: Stock;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  meta?: {
    page: number;
    limit: number;
    total: number;
  };
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface MarketQuote {
  ticker: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  previousClose: number;
  timestamp: number;
}

export interface OHLCV {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface IndicatorResult {
  values: (number | null)[];
  label: string;
}

export interface MACDResult {
  macd: number[];
  signal: number[];
  histogram: number[];
}

export interface BollingerBandsResult {
  upper: number[];
  middle: number[];
  lower: number[];
}

export interface StochasticResult {
  k: (number | null)[];
  d: (number | null)[];
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export interface PredictionFactor {
  indicator: string;
  label?: string;
  contribution: number;
  direction: "bullish" | "bearish";
  value?: number;
  importance?: number;
}

export interface PredictionWindow {
  days: number;
  label: string;
  price: number;
  confidence: number;
  changePercent: number;
}

export interface RiskAnalysis {
  bullishProbability: number;
  bearishProbability: number;
  volatilityForecast: number;
  riskRating: RiskRating;
}

export interface Explainability {
  topFactors: PredictionFactor[];
  summary: string;
  featureImportances?: Record<string, number>;
}

export interface FullPrediction {
  ticker: string;
  currentPrice: number;
  windows: PredictionWindow[];
  risk: RiskAnalysis;
  modelAgreement: number;
  uncertainty: number;
  explainability: Explainability;
  modelVersions: Record<string, string>;
  disclaimer: string;
}

export interface BacktestTrade {
  entry_date: string;
  exit_date: string;
  entry_price: number;
  exit_price: number;
  shares: number;
  pnl: number;
  pnl_pct: number;
  reason: string;
}

export interface BacktestEquityPoint {
  date: string;
  equity: number;
  position: number;
}

export interface BacktestResult {
  ticker: string;
  model_type: string;
  total_return: number;
  annualized_return: number | null;
  sharpe_ratio: number | null;
  max_drawdown: number;
  win_rate: number;
  profit_factor: number | null;
  total_trades: number;
  equity_curve: BacktestEquityPoint[];
  trades: BacktestTrade[];
  initial_capital: number;
  final_capital: number;
}

export interface ModelRunData {
  id: string;
  ticker: string;
  modelType: ModelType;
  status: ModelRunStatus;
  accuracy: number | null;
  winRate: number | null;
  sharpeRatio: number | null;
  maxDrawdown: number | null;
  totalReturn: number | null;
  trainedAt: Date;
  durationMs: number | null;
  dataPointsUsed: number | null;
  metricsJson: Record<string, unknown> | null;
  error: string | null;
}

export interface BacktestMetrics {
  totalReturn: number;
  annualizedReturn: number | null;
  sharpeRatio: number | null;
  maxDrawdown: number;
  winRate: number;
  profitFactor: number | null;
  totalTrades: number;
  equityCurve: { date: string; value: number }[];
}

export interface BacktestTrade {
  date: string;
  action: "BUY" | "SELL";
  price: number;
  shares: number;
  pnl: number;
}
