/** Shared Alpaca Data API configuration and helpers. */

export const ALPACA_KEY = process.env.ALPACA_API_KEY || "";
export const ALPACA_SECRET = process.env.ALPACA_SECRET_KEY || "";
export const ALPACA_BASE = "https://data.alpaca.markets";

export function alpacaHeaders(): Record<string, string> {
  return {
    "APCA-API-KEY-ID": ALPACA_KEY,
    "APCA-API-SECRET-KEY": ALPACA_SECRET,
    Accept: "application/json",
  };
}

export function hasAlpacaCredentials(): boolean {
  return Boolean(ALPACA_KEY && ALPACA_SECRET);
}

/** Normalized stock quote returned by both Alpaca and Yahoo. */
export interface NormalizedQuote {
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

/** Parse an Alpaca snapshot into a NormalizedQuote. Returns null if invalid. */
export function parseAlpacaSnapshot(
  ticker: string,
  snap: { trade?: { p: number }; dailyBar?: { o: number; h: number; l: number; c: number; v: number }; prevDailyBar?: { c: number } }
): NormalizedQuote | null {
  const price = snap.trade?.p ?? 0;
  if (price <= 0) return null;

  const dailyBar = snap.dailyBar;
  const prevDaily = snap.prevDailyBar;
  const previousClose = prevDaily?.c ?? dailyBar?.c ?? price;
  const change = price - previousClose;
  const changePercent = previousClose > 0 ? (change / previousClose) * 100 : 0;

  return {
    ticker,
    name: ticker,
    price: Math.round(price * 100) / 100,
    change: Math.round(change * 100) / 100,
    changePercent: Math.round(changePercent * 100) / 100,
    previousClose: Math.round(previousClose * 100) / 100,
    open: Math.round((dailyBar?.o ?? price) * 100) / 100,
    dayHigh: Math.round((dailyBar?.h ?? price) * 100) / 100,
    dayLow: Math.round((dailyBar?.l ?? price) * 100) / 100,
    volume: dailyBar?.v ?? 0,
  };
}

/** Fetch real-time quote from Alpaca snapshot endpoint. */
export async function fetchAlpacaQuote(ticker: string): Promise<NormalizedQuote | null> {
  if (!hasAlpacaCredentials()) return null;
  try {
    const url = `${ALPACA_BASE}/v2/stocks/${encodeURIComponent(ticker)}/snapshot`;
    const res = await fetch(url, { headers: alpacaHeaders(), signal: AbortSignal.timeout(10000) });
    if (!res.ok) return null;
    const snap = await res.json();
    return parseAlpacaSnapshot(ticker, snap);
  } catch {
    return null;
  }
}

/** Batch-fetch Alpaca snapshots. Returns map of ticker → quote. Missing tickers are omitted. */
export async function fetchAlpacaSnapshots(
  tickers: string[]
): Promise<Map<string, NormalizedQuote>> {
  const results = new Map<string, NormalizedQuote>();
  if (tickers.length === 0 || !hasAlpacaCredentials()) return results;

  try {
    const url = `${ALPACA_BASE}/v2/stocks/snapshots?symbols=${tickers.join(",")}`;
    const res = await fetch(url, { headers: alpacaHeaders(), signal: AbortSignal.timeout(15000) });
    if (!res.ok) return results;

    const snapshots = await res.json();
    for (const [symbol, snap] of Object.entries(snapshots as Record<string, { trade?: { p: number }; dailyBar?: { o: number; h: number; l: number; c: number; v: number }; prevDailyBar?: { c: number } }>)) {
      const q = parseAlpacaSnapshot(symbol, snap);
      if (q) results.set(symbol, q);
    }
  } catch { /* ignore */ }
  return results;
}

const YAHOO_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  Accept: "application/json",
};

/** Fetch real-time quote from Yahoo Finance. Falls back when Alpaca is unavailable. */
export async function fetchYahooQuote(ticker: string): Promise<NormalizedQuote | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=1d`;
    const res = await fetch(url, { headers: YAHOO_HEADERS, signal: AbortSignal.timeout(10000) });
    if (!res.ok) return null;

    const data = await res.json();
    const meta = data?.chart?.result?.[0]?.meta;
    if (!meta) return null;

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
    };
  } catch {
    return null;
  }
}

/** Fetch historical OHLCV bars from Alpaca. Returns empty array on failure. */
export async function fetchAlpacaBars(
  ticker: string,
  timeframe: string,
  start: string,
  limit = 10000
): Promise<{ date: string; open: number; high: number; low: number; close: number; volume: number }[]> {
  if (!hasAlpacaCredentials()) return [];
  try {
    const url = `${ALPACA_BASE}/v2/stocks/${encodeURIComponent(ticker)}/bars?timeframe=${timeframe}&start=${start}&limit=${limit}&adjustment=split&feed=iex`;
    const res = await fetch(url, { headers: alpacaHeaders(), signal: AbortSignal.timeout(15000) });
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.bars?.length) return [];
    return data.bars.map((bar: { t: string; o: number; h: number; l: number; c: number; v: number }) => ({
      date: bar.t.split("T")[0],
      open: bar.o,
      high: bar.h,
      low: bar.l,
      close: bar.c,
      volume: bar.v,
    }));
  } catch {
    return [];
  }
}

/** Fetch historical OHLCV bars from Yahoo Finance. */
export async function fetchYahooBars(
  ticker: string,
  range: string
): Promise<{ date: string; open: number; high: number; low: number; close: number; volume: number }[]> {
  const rangeMap: Record<string, string> = {
    "1D": "1d", "5D": "5d", "1M": "1mo", "3M": "3mo",
    "6M": "6mo", "1Y": "1y", "5Y": "5y", MAX: "max",
  };
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?range=${rangeMap[range] || "1y"}&interval=1d`;
    const res = await fetch(url, { headers: YAHOO_HEADERS, signal: AbortSignal.timeout(12000) });
    if (!res.ok) return [];
    const data = await res.json();
    const result = data?.chart?.result?.[0];
    if (!result?.timestamp) return [];

    const ohlcvData = result.indicators?.quote?.[0];
    if (!ohlcvData) return [];

    const bars: { date: string; open: number; high: number; low: number; close: number; volume: number }[] = [];
    for (let i = 0; i < result.timestamp.length; i++) {
      const o = ohlcvData.open[i];
      const h = ohlcvData.high[i];
      const l = ohlcvData.low[i];
      const c = ohlcvData.close[i];
      if (o == null || h == null || l == null || c == null) continue;
      bars.push({
        date: new Date(result.timestamp[i] * 1000).toISOString().split("T")[0],
        open: o, high: h, low: l, close: c, volume: ohlcvData.volume[i] ?? 0,
      });
    }
    return bars;
  } catch {
    return [];
  }
}

/** Fetch price from Yahoo Finance and populate the realPriceCache. Returns price or null. */
export async function fetchYahooPriceAndCache(ticker: string): Promise<number | null> {
  const q = await fetchYahooQuote(ticker);
  if (!q || q.price <= 0) return null;
  // Lazy import to avoid circular dependency
  const { setRealPrice } = await import("./market-mock");
  setRealPrice(ticker, {
    price: q.price,
    change: q.change,
    changePercent: q.changePercent,
    volume: q.volume,
    name: q.name,
  });
  return q.price;
}
