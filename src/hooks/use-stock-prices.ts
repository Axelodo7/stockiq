"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { fetchStockQuotes, type RealStockQuote } from "@/lib/services/stock-api";

interface UseStockPricesOptions {
  tickers: string[];
  refreshInterval?: number; // ms, default 30000
  enabled?: boolean;
}

interface UseStockPricesResult {
  prices: Record<string, RealStockQuote>;
  loading: boolean;
  lastUpdated: Date | null;
  refresh: () => Promise<void>;
}

/**
 * Shared hook for fetching real-time stock prices across all pages.
 * Auto-refreshes at the specified interval.
 */
export function useStockPrices({
  tickers,
  refreshInterval = 30_000,
  enabled = true,
}: UseStockPricesOptions): UseStockPricesResult {
  const [prices, setPrices] = useState<Record<string, RealStockQuote>>({});
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const mountedRef = useRef(false);

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

  // Initial fetch + auto-refresh
  useEffect(() => {
    if (!enabled || tickers.length === 0) return;

    // Skip first mount to avoid double-fetch in React strict mode
    if (!mountedRef.current) {
      mountedRef.current = true;
      fetchPrices();
    }

    const interval = setInterval(fetchPrices, refreshInterval);
    return () => clearInterval(interval);
  }, [enabled, fetchPrices, refreshInterval, tickers.length]);

  return { prices, loading, lastUpdated, refresh: fetchPrices };
}
