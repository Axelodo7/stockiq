export const APP_NAME = "StockIQ";
export const APP_DESCRIPTION = "AI-Powered Stock Prediction Platform";
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
export const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || "http://localhost:8000";

export const CACHE_TTL = {
  QUOTE: 15_000,
  QUOTE_MARKET_CLOSED: 300_000,
  HISTORICAL: 300_000,
  HISTORICAL_MARKET_CLOSED: 3_600_000,
  STOCK_LIST: 86_400_000,
  PREDICTION: 600_000,
} as const;

export const RATE_LIMIT = {
  MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX || "100"),
  WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "60000"),
} as const;

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

export const STOCK_SECTORS = [
  "Technology",
  "Healthcare",
  "Financial Services",
  "Consumer Cyclical",
  "Communication Services",
  "Industrials",
  "Consumer Defensive",
  "Energy",
  "Utilities",
  "Real Estate",
  "Basic Materials",
] as const;

export const TIMEFRAME_MAP: Record<string, { days: number; interval: string }> = {
  "1D": { days: 1, interval: "1d" },
  "5D": { days: 5, interval: "5d" },
  "1M": { days: 30, interval: "1d" },
  "3M": { days: 90, interval: "1d" },
  "6M": { days: 180, interval: "1d" },
  "1Y": { days: 365, interval: "1d" },
  "5Y": { days: 1825, interval: "1wk" },
  "MAX": { days: 3650, interval: "1mo" },
};
