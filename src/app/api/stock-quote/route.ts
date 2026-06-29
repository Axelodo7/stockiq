import { NextRequest, NextResponse } from "next/server";
import {
  hasAlpacaCredentials,
  fetchAlpacaSnapshots,
  fetchYahooQuote,
  type NormalizedQuote,
} from "@/lib/services/market-api";

async function getQuotes(
  tickers: string[]
): Promise<Record<string, NormalizedQuote | null>> {
  const results: Record<string, NormalizedQuote | null> = {};

  if (hasAlpacaCredentials()) {
    const snaps = await fetchAlpacaSnapshots(tickers);
    const missing: string[] = [];

    for (const t of tickers) {
      const q = snaps.get(t);
      if (q) {
        results[t] = q;
      } else {
        missing.push(t);
      }
    }

    if (missing.length > 0) {
      await Promise.allSettled(
        missing.map(async (t) => {
          results[t] = await fetchYahooQuote(t);
        })
      );
    }
  } else {
    await Promise.allSettled(
      tickers.map(async (t) => {
        results[t] = await fetchYahooQuote(t);
      })
    );
  }

  return results;
}

export const dynamic = "force-dynamic";

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

    const data = await getQuotes(tickers);

    return NextResponse.json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
