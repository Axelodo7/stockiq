"use client";

import { useEffect, useRef, useState } from "react";

export interface StreamQuote {
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
}

export interface StreamUpdate {
  type: "update" | "connected";
  prices?: Record<string, StreamQuote>;
  tickers?: string[];
  timestamp: number;
}

export interface UsePriceStreamOptions {
  tickers: string[];
  enabled?: boolean;
}

export interface UsePriceStreamResult {
  connected: boolean;
  lastUpdate: Date | null;
  lastPrices: Record<string, StreamQuote>;
}

/**
 * Subscribe to live price updates via Server-Sent Events.
 * Auto-reconnects on disconnect with exponential backoff.
 */
export function usePriceStream({ tickers, enabled = true }: UsePriceStreamOptions): UsePriceStreamResult {
  const [connected, setConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [lastPrices, setLastPrices] = useState<Record<string, StreamQuote>>({});
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttempts = useRef(0);

  useEffect(() => {
    if (!enabled || tickers.length === 0) {
      setConnected(false);
      return;
    }

    const tickerKey = tickers.sort().join(",");
    let isMounted = true;

    const connect = () => {
      if (!isMounted) return;
      const url = `/api/stocks/stream?tickers=${encodeURIComponent(tickerKey)}`;
      const es = new EventSource(url);
      eventSourceRef.current = es;

      es.onopen = () => {
        if (!isMounted) return;
        setConnected(true);
        reconnectAttempts.current = 0;
      };

      es.onmessage = (event) => {
        if (!isMounted) return;
        try {
          const data: StreamUpdate = JSON.parse(event.data);
          if (data.type === "update" && data.prices) {
            setLastPrices((prev) => ({ ...prev, ...data.prices }));
            setLastUpdate(new Date());
          }
        } catch (err) {
          console.error("[usePriceStream] parse error:", err);
        }
      };

      es.onerror = () => {
        if (!isMounted) return;
        setConnected(false);
        es.close();
        eventSourceRef.current = null;

        // Auto-reconnect with exponential backoff (max 30s)
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30_000);
        reconnectAttempts.current++;
        reconnectTimerRef.current = setTimeout(connect, delay);
      };
    };

    connect();

    return () => {
      isMounted = false;
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      setConnected(false);
    };
  }, [tickers.sort().join(","), enabled]);

  return { connected, lastUpdate, lastPrices };
}
