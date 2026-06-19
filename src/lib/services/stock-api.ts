/**
 * Fetch real-time stock quotes from Yahoo Finance via our API route.
 * Falls back to mock data if the API is unavailable.
 * Also populates the realPriceCache in market-mock.ts so getStockInfo returns correct prices.
 */

import { setRealPrice } from "./market-mock";

export interface RealStockQuote {
  ticker: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  previousClose: number;
  open: number;
  dayHigh: number;
  dayLow: number;
  volume: number;
  marketCap: number;
  peRatio: number;
  week52High: number;
  week52Low: number;
}

// In-memory cache with 30-second TTL for live updates
const cache = new Map<string, { data: RealStockQuote; timestamp: number }>();
const CACHE_TTL = 30 * 1000; // 30 seconds

export function clearStockCache() {
  cache.clear();
}

export async function fetchStockQuote(
  ticker: string,
  forceRefresh = false
): Promise<RealStockQuote | null> {
  const t = ticker.toUpperCase();

  // Check cache (skip if force refresh)
  if (!forceRefresh) {
    const cached = cache.get(t);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }
  }

  try {
    const res = await fetch(`/api/stock-quote?tickers=${t}`);
    const json = await res.json();

    if (json.success && json.data?.[t]) {
      const quote = json.data[t] as RealStockQuote;
      cache.set(t, { data: quote, timestamp: Date.now() });
      return quote;
    }
  } catch {
    // Silently fail
  }

  return null;
}

export async function fetchStockQuotes(
  tickers: string[],
  forceRefresh = false
): Promise<Record<string, RealStockQuote>> {
  const unique = [...new Set(tickers.map((t) => t.toUpperCase()))].filter(Boolean);
  if (unique.length === 0) return {};

  // Check which are cached (skip if force refresh)
  const result: Record<string, RealStockQuote> = {};
  const toFetch: string[] = [];

  for (const t of unique) {
    if (!forceRefresh) {
      const cached = cache.get(t);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        result[t] = cached.data;
        continue;
      }
    }
    toFetch.push(t);
  }

  if (toFetch.length > 0) {
    try {
      const res = await fetch(`/api/stock-quote?tickers=${toFetch.join(",")}`);
      const json = await res.json();

      if (json.success && json.data) {
        for (const [ticker, quote] of Object.entries(json.data)) {
          if (quote) {
            const q = quote as RealStockQuote;
            result[ticker] = q;
            cache.set(ticker, { data: q, timestamp: Date.now() });
            setRealPrice(ticker, {
              price: q.price,
              name: q.name,
              change: q.change,
              changePercent: q.changePercent,
              volume: q.volume,
              high52w: q.week52High,
              low52w: q.week52Low,
            });
          }
        }
      } else {
        console.error("[fetchStockQuotes] API returned error:", json.error);
      }
    } catch (err) {
      console.error("[fetchStockQuotes] fetch error:", err);
    }
  }

  return result;
}
