/**
 * Client-side: fetch real-time stock quotes via our API route.
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

const quoteCache = new Map<string, { data: RealStockQuote; timestamp: number }>();
const CACHE_TTL = 30 * 1000;

export async function fetchStockQuotes(
  tickers: string[],
  forceRefresh = false
): Promise<Record<string, RealStockQuote>> {
  const unique = [...new Set(tickers.map((t) => t.toUpperCase()))].filter(Boolean);
  if (unique.length === 0) return {};

  const result: Record<string, RealStockQuote> = {};
  const toFetch: string[] = [];

  for (const t of unique) {
    if (!forceRefresh) {
      const cached = quoteCache.get(t);
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
            quoteCache.set(ticker, { data: q, timestamp: Date.now() });
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
