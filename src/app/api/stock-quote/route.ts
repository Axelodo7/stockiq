import { NextRequest, NextResponse } from "next/server";

interface YahooQuote {
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

async function fetchYahooQuote(ticker: string): Promise<YahooQuote | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=1d`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!res.ok) return null;

    const data = await res.json();
    const result = data?.chart?.result?.[0];
    if (!result) return null;

    const meta = result.meta;
    const price = meta.regularMarketPrice ?? 0;
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

export async function GET(request: NextRequest) {
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

  const results: Record<string, YahooQuote | null> = {};

  // Fetch all tickers in parallel (batches of 5 to avoid rate limits)
  for (let i = 0; i < tickers.length; i += 5) {
    const batch = tickers.slice(i, i + 5);
    const batchResults = await Promise.all(batch.map(fetchYahooQuote));
    batch.forEach((ticker, idx) => {
      results[ticker] = batchResults[idx];
    });
  }

  return NextResponse.json({
    success: true,
    data: results,
    timestamp: new Date().toISOString(),
  });
}
