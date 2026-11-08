"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { fetchStockQuotes, type RealStockQuote } from "@/lib/services/stock-api";
import { usePriceStream, type StreamQuote } from "./use-price-stream";

interface UseStockPricesOptions {
  tickers: string[];
  refreshInterval?: number; // ms, default 30000 (fallback polling)
  enabled?: boolean;
  /** Enable real-time SSE updates (default: true) */
  realtime?: boolean;
}

interface UseStockPricesResult {
  prices: Record<string, RealStockQuote>;
  loading: boolean;
  lastUpdated: Date | null;
  realtimeConnected: boolean;
  refresh: () => Promise<void>;
}

/**
 * Shared hook for fetching real-time stock prices across all pages.
 *
 * Uses Server-Sent Events (SSE) for live updates when enabled.
 * Falls back to REST polling if SSE connection fails or is disabled.
 */
export function useStockPrices({
  tickers,
  refreshInterval = 30_000,
  enabled = true,
  realtime = true,
}: UseStockPricesOptions): UseStockPricesResult {
  const [prices, setPrices] = useState<Record<string, RealStockQuote>>({});
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const mountedRef = useRef(false);

  // Stable ticker key for SSE
  const tickerKey = useMemo(() => tickers.sort().join(","), [tickers]);

  // SSE: real-time updates
  const { connected: realtimeConnected, lastUpdate: streamLastUpdate, lastPrices: streamPrices } = usePriceStream({
    tickers,
    enabled: enabled && realtime && tickers.length > 0,
  });

  // Merge stream prices into our state
  useEffect(() => {
    if (Object.keys(streamPrices).length === 0) return;
    setPrices((prev) => {
      const next: Record<string, RealStockQuote> = { ...prev };
      for (const [ticker, quote] of Object.entries(streamPrices)) {
        if (quote && typeof quote.price === "number") {
          next[ticker] = streamQuoteToReal(ticker, quote);
        }
      }
      return next;
    });
    if (streamLastUpdate) setLastUpdated(streamLastUpdate);
  }, [streamPrices, streamLastUpdate]);

  // REST polling fallback
  const fetchPrices = useCallback(async () => {
    if (tickers.length === 0) return;
    setLoading(true);
    try {
      const result = await fetchStockQuotes(tickers, true);
      setPrices(result);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("[useStockPrices] fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [tickers.join(",")]);

  // Initial fetch + fallback polling
  useEffect(() => {
    if (!enabled || tickers.length === 0) return;

    if (!mountedRef.current) {
      mountedRef.current = true;
      fetchPrices();
    }

    // Only poll if SSE isn't connected
    const interval = setInterval(() => {
      if (!realtime || !realtimeConnected) {
        fetchPrices();
      }
    }, refreshInterval);
    return () => clearInterval(interval);
  }, [enabled, fetchPrices, refreshInterval, tickers.length, realtime, realtimeConnected]);

  return { prices, loading, lastUpdated, realtimeConnected, refresh: fetchPrices };
}

function streamQuoteToReal(ticker: string, q: StreamQuote): RealStockQuote {
  return {
    ticker,
    name: q.name || ticker,
    price: q.price,
    change: q.change ?? 0,
    changePercent: q.changePercent ?? 0,
    previousClose: q.previousClose ?? q.price,
    open: q.open ?? q.price,
    dayHigh: q.dayHigh ?? q.price,
    dayLow: q.dayLow ?? q.price,
    volume: q.volume ?? 0,
    marketCap: 0,
    peRatio: 0,
    week52High: 0,
    week52Low: 0,
  };
}
