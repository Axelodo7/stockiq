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
  const endpoints = [
    `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(ticker)}`,
    `https://query2.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(ticker)}`,
  ];

  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
          "Accept": "application/json",
        },
        signal: AbortSignal.timeout(8000),
      });

      if (!res.ok) continue;

      const data = await res.json();
      const quote = data?.quoteResponse?.result?.[0];
      if (!quote) continue;

      return {
        ticker: quote.symbol || ticker,
        name: quote.shortName || quote.longName || ticker,
        price: Math.round((quote.regularMarketPrice ?? 0) * 100) / 100,
        change: Math.round((quote.regularMarketChange ?? 0) * 100) / 100,
        changePercent: Math.round((quote.regularMarketChangePercent ?? 0) * 100) / 100,
        previousClose: Math.round((quote.regularMarketPreviousClose ?? 0) * 100) / 100,
        open: Math.round((quote.regularMarketOpen ?? 0) * 100) / 100,
        dayHigh: Math.round((quote.regularMarketDayHigh ?? 0) * 100) / 100,
        dayLow: Math.round((quote.regularMarketDayLow ?? 0) * 100) / 100,
        volume: quote.regularMarketVolume ?? 0,
        marketCap: quote.marketCap ?? 0,
        peRatio: quote.trailingPE ?? 0,
        week52High: Math.round((quote.fiftyTwoWeekHigh ?? 0) * 100) / 100,
        week52Low: Math.round((quote.fiftyTwoWeekLow ?? 0) * 100) / 100,
      };
    } catch {
      continue;
    }
  }
  return null;
}

export async function GET(request: NextRequest) {
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

    const results: Record<string, YahooQuote | null> = {};

    for (let i = 0; i < tickers.length; i += 5) {
      const batch = tickers.slice(i, i + 5);
      const batchResults = await Promise.allSettled(batch.map(fetchYahooQuote));
      batch.forEach((ticker, idx) => {
        const r = batchResults[idx];
        results[ticker] = r.status === "fulfilled" ? r.value : null;
      });
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
