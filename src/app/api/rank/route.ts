import { NextRequest, NextResponse } from "next/server";
import { fetchAlpacaBars, fetchYahooBars } from "@/lib/services/market-api";
import { fetchPython } from "@/lib/services/python-client";
import { perIPLimit } from "@/lib/security/rate-limit";

/** Default universe of liquid US equities. */
const DEFAULT_UNIVERSE = [
  "AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "META", "TSLA", "JPM",
  "V", "UNH", "XOM", "WMT", "JNJ", "MA", "PG", "HD", "COST", "ABBV",
  "LLY", "AVGO", "CRM", "NFLX", "AMD", "ADBE", "QCOM", "INTC",
  "DIS", "GS", "CAT", "BLK", "SQ", "SHOP", "COIN", "PLTR",
];

export const runtime = "nodejs";
export const maxDuration = 60;

interface RankedStock {
  ticker: string;
  probability: number;
  direction: "bullish" | "bearish";
  confidence: number;
  model_agreement: number;
  model_type: string;
  momentum_20d: number;
  last_close: number;
}

/**
 * Rank a universe of stocks using trained ML models.
 *
 * Flow:
 *  1. Fetch real historical OHLCV (Alpaca primary, Yahoo fallback)
 *  2. POST the universe to the Python service's /ml/rank endpoint
 *  3. Python trains (or loads) a model per ticker and scores it
 *  4. Return rankings sorted by predicted bullish probability
 */
export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const limit = perIPLimit(ip);
  if (!limit.allowed) {
    return new Response("Too Many Requests", { status: 429 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const tickers: string[] = Array.isArray(body?.tickers) && body.tickers.length > 0
      ? body.tickers.map((t: string) => String(t).toUpperCase()).slice(0, 50)
      : DEFAULT_UNIVERSE;
    const modelType = (body?.model_type || "ENSEMBLE").toUpperCase();
    const topN = Math.min(parseInt(body?.limit || "20"), 50);

    // Two years of daily bars gives the model enough walk-forward runway.
    const start = new Date();
    start.setFullYear(start.getFullYear() - 2);
    const startDate = start.toISOString().split("T")[0];

    // Fetch real historical data for every ticker (bounded concurrency)
    const universe: Record<string, Array<{
      date: string;
      open: number;
      high: number;
      low: number;
      close: number;
      volume: number;
    }>> = {};

    const CONCURRENCY = 8;
    for (let i = 0; i < tickers.length; i += CONCURRENCY) {
      const chunk = tickers.slice(i, i + CONCURRENCY);
      const results = await Promise.all(
        chunk.map(async (ticker) => {
          let bars = await fetchAlpacaBars(ticker, "1Day", startDate, 600);
          if (bars.length < 70) {
            bars = await fetchYahooBars(ticker, "2y");
          }
          return [ticker, bars] as const;
        })
      );
      for (const [ticker, bars] of results) {
        if (bars.length >= 70) {
          universe[ticker] = bars.map((b) => ({
            date: b.date,
            open: b.open,
            high: b.high,
            low: b.low,
            close: b.close,
            volume: b.volume,
          }));
        }
      }
    }

    if (Object.keys(universe).length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Could not fetch sufficient historical data for any ticker",
        },
        { status: 503 }
      );
    }

    const pythonResult = await fetchPython<{
      rankings: RankedStock[];
      model_type: string;
      scored_count: number;
      universe_count: number;
    }>("/ml/rank", { universe, model_type: modelType, limit: topN }, 55_000);

    if (!pythonResult || !pythonResult.rankings) {
      return NextResponse.json(
        {
          success: false,
          error:
            "ML ranking service unavailable. Ensure the Python service is running and reachable.",
          data: {
            universe_count: Object.keys(universe).length,
            scored_count: 0,
          },
        },
        { status: 503 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        rankings: pythonResult.rankings,
        model_type: pythonResult.model_type,
        scored_count: pythonResult.scored_count,
        universe_count: pythonResult.universe_count,
        bars_used_per_ticker: 500,
        generated_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to rank stocks",
      },
      { status: 500 }
    );
  }
}
