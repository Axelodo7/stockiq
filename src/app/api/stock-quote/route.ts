import { NextRequest, NextResponse } from "next/server";

interface AlpacaQuote {
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

const ALPACA_KEY = process.env.ALPACA_API_KEY || "";
const ALPACA_SECRET = process.env.ALPACA_SECRET_KEY || "";
const ALPACA_DATA_BASE = "https://data.alpaca.markets";

function alpacaHeaders() {
  return {
    "APCA-API-KEY-ID": ALPACA_KEY,
    "APCA-API-SECRET-KEY": ALPACA_SECRET,
    Accept: "application/json",
  };
}

async function fetchAlpacaSnapshot(ticker: string): Promise<AlpacaQuote | null> {
  try {
    const url = `${ALPACA_DATA_BASE}/v2/stocks/${encodeURIComponent(ticker)}/snapshot`;
    const res = await fetch(url, {
      headers: alpacaHeaders(),
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) return null;

    const snap = await res.json();
    if (!snap?.trade) return null;

    const trade = snap.trade;
    const dailyBar = snap.dailyBar;
    const prevDaily = snap.prevDailyBar;

    const price = trade.p ?? 0;
    if (!price) return null;

    const previousClose = prevDaily?.c ?? dailyBar?.c ?? price;
    const change = price - previousClose;
    const changePercent = previousClose > 0 ? (change / previousClose) * 100 : 0;

    return {
      ticker: ticker.toUpperCase(),
      name: ticker.toUpperCase(),
      price: Math.round(price * 100) / 100,
      change: Math.round(change * 100) / 100,
      changePercent: Math.round(changePercent * 100) / 100,
      previousClose: Math.round(previousClose * 100) / 100,
      open: Math.round((dailyBar?.o ?? price) * 100) / 100,
      dayHigh: Math.round((dailyBar?.h ?? price) * 100) / 100,
      dayLow: Math.round((dailyBar?.l ?? price) * 100) / 100,
      volume: dailyBar?.v ?? 0,
      marketCap: 0,
      peRatio: 0,
      week52High: 0,
      week52Low: 0,
    };
  } catch {
    return null;
  }
}

async function fetchAlpacaSnapshotsBatch(
  tickers: string[]
): Promise<Record<string, AlpacaQuote | null>> {
  if (tickers.length === 0) return {};

  try {
    const symbols = tickers.join(",");
    const url = `${ALPACA_DATA_BASE}/v2/stocks/snapshots?symbols=${symbols}`;
    const res = await fetch(url, {
      headers: alpacaHeaders(),
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      // Fallback to individual fetches
      const results: Record<string, AlpacaQuote | null> = {};
      await Promise.allSettled(
        tickers.map(async (t) => {
          results[t] = await fetchAlpacaSnapshot(t);
        })
      );
      return results;
    }

    const snapshots = await res.json();
    const results: Record<string, AlpacaQuote | null> = {};

    for (const [symbol, snap] of Object.entries(snapshots as Record<string, { trade?: { p: number }; dailyBar?: { o: number; h: number; l: number; c: number; v: number }; prevDailyBar?: { c: number }; quote?: unknown }>)) {
      if (!snap?.trade) {
        results[symbol] = null;
        continue;
      }

      const trade = snap.trade;
      const dailyBar = snap.dailyBar;
      const prevDaily = snap.prevDailyBar;
      const price = trade.p ?? 0;

      if (!price) {
        results[symbol] = null;
        continue;
      }

      const previousClose = prevDaily?.c ?? dailyBar?.c ?? price;
      const change = price - previousClose;
      const changePercent = previousClose > 0 ? (change / previousClose) * 100 : 0;

      results[symbol] = {
        ticker: symbol,
        name: symbol,
        price: Math.round(price * 100) / 100,
        change: Math.round(change * 100) / 100,
        changePercent: Math.round(changePercent * 100) / 100,
        previousClose: Math.round(previousClose * 100) / 100,
        open: Math.round((dailyBar?.o ?? price) * 100) / 100,
        dayHigh: Math.round((dailyBar?.h ?? price) * 100) / 100,
        dayLow: Math.round((dailyBar?.l ?? price) * 100) / 100,
        volume: dailyBar?.v ?? 0,
        marketCap: 0,
        peRatio: 0,
        week52High: 0,
        week52Low: 0,
      };
    }

    return results;
  } catch {
    // Fallback to individual fetches
    const results: Record<string, AlpacaQuote | null> = {};
    await Promise.allSettled(
      tickers.map(async (t) => {
        results[t] = await fetchAlpacaSnapshot(t);
      })
    );
    return results;
  }
}

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!ALPACA_KEY || !ALPACA_SECRET) {
    return NextResponse.json(
      { success: false, error: "Alpaca API credentials not configured" },
      { status: 500 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const tickersParam = searchParams.get("tickers");

    if (!tickersParam) {
      return NextResponse.json(
        { success: false, error: "tickers query parameter required (comma-separated)" },
        { status: 400 }
      );
    }

    const tickers = tickersParam
      .split(",")
      .map((t) => t.trim().toUpperCase())
      .filter(Boolean)
      .slice(0, 20);

    const results = await fetchAlpacaSnapshotsBatch(tickers);

    return NextResponse.json({
      success: true,
      data: results,
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({
      success: true,
      data: {},
      timestamp: new Date().toISOString(),
    });
  }
}
