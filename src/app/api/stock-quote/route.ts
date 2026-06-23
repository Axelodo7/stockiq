import { NextRequest, NextResponse } from "next/server";

interface StockQuote {
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

// ── Yahoo Finance fallback ──────────────────────────────────────────────

async function fetchYahooQuote(ticker: string): Promise<StockQuote | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=1d`;
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;

    const data = await res.json();
    const result = data?.chart?.result?.[0];
    if (!result) return null;

    const meta = result.meta;
    const price = meta.regularMarketPrice ?? 0;
    if (!price) return null;

    const previousClose = meta.chartPreviousClose ?? meta.previousClose ?? price;
    const change = price - previousClose;
    const changePercent = previousClose > 0 ? (change / previousClose) * 100 : 0;

    return {
      ticker: meta.symbol || ticker,
      name: meta.shortName || meta.symbol || ticker,
      price: Math.round(price * 100) / 100,
      change: Math.round(change * 100) / 100,
      changePercent: Math.round(changePercent * 100) / 100,
      previousClose: Math.round(previousClose * 100) / 100,
      open: Math.round((meta.regularMarketOpen ?? price) * 100) / 100,
      dayHigh: Math.round((meta.regularMarketDayHigh ?? price) * 100) / 100,
      dayLow: Math.round((meta.regularMarketDayLow ?? price) * 100) / 100,
      volume: meta.regularMarketVolume ?? 0,
      marketCap: meta.marketCap ?? 0,
      peRatio: meta.trailingPE ?? 0,
      week52High: Math.round((meta.fiftyTwoWeekHigh ?? price) * 100) / 100,
      week52Low: Math.round((meta.fiftyTwoWeekLow ?? price) * 100) / 100,
    };
  } catch {
    return null;
  }
}

// ── Alpaca primary ──────────────────────────────────────────────────────

async function fetchAlpacaSnapshot(
  ticker: string
): Promise<StockQuote | null> {
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
    const changePercent =
      previousClose > 0 ? (change / previousClose) * 100 : 0;

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
): Promise<Record<string, StockQuote | null>> {
  if (tickers.length === 0) return {};

  try {
    const symbols = tickers.join(",");
    const url = `${ALPACA_DATA_BASE}/v2/stocks/snapshots?symbols=${symbols}`;
    const res = await fetch(url, {
      headers: alpacaHeaders(),
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      // Alpaca batch failed — fall back to Yahoo for each ticker
      const results: Record<string, StockQuote | null> = {};
      await Promise.allSettled(
        tickers.map(async (t) => {
          results[t] = await fetchYahooQuote(t);
        })
      );
      return results;
    }

    const snapshots = await res.json();
    const results: Record<string, StockQuote | null> = {};
    const missing: string[] = [];

    for (const [symbol, snap] of Object.entries(
      snapshots as Record<
        string,
        {
          trade?: { p: number };
          dailyBar?: { o: number; h: number; l: number; c: number; v: number };
          prevDailyBar?: { c: number };
        }
      >
    )) {
      if (!snap?.trade) {
        missing.push(symbol);
        continue;
      }

      const trade = snap.trade;
      const dailyBar = snap.dailyBar;
      const prevDaily = snap.prevDailyBar;
      const price = trade.p ?? 0;

      if (!price) {
        missing.push(symbol);
        continue;
      }

      const previousClose = prevDaily?.c ?? dailyBar?.c ?? price;
      const change = price - previousClose;
      const changePercent =
        previousClose > 0 ? (change / previousClose) * 100 : 0;

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

    // Yahoo fallback for tickers Alpaca didn't return
    if (missing.length > 0) {
      await Promise.allSettled(
        missing.map(async (t) => {
          const q = await fetchYahooQuote(t);
          if (q) results[t] = q;
        })
      );
    }

    return results;
  } catch {
    // Network error — fall back to Yahoo for each ticker
    const results: Record<string, StockQuote | null> = {};
    await Promise.allSettled(
      tickers.map(async (t) => {
        results[t] = await fetchYahooQuote(t);
      })
    );
    return results;
  }
}

// ── Route handler ───────────────────────────────────────────────────────

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tickersParam = searchParams.get("tickers");

    if (!tickersParam) {
      return NextResponse.json(
        {
          success: false,
          error: "tickers query parameter required (comma-separated)",
        },
        { status: 400 }
      );
    }

    const tickers = tickersParam
      .split(",")
      .map((t) => t.trim().toUpperCase())
      .filter(Boolean)
      .slice(0, 20);

    let results: Record<string, StockQuote | null>;

    if (ALPACA_KEY && ALPACA_SECRET) {
      results = await fetchAlpacaSnapshotsBatch(tickers);
    } else {
      // No Alpaca — go straight to Yahoo
      results = {};
      await Promise.allSettled(
        tickers.map(async (t) => {
          results[t] = await fetchYahooQuote(t);
        })
      );
    }

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
