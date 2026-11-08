import { NextResponse } from "next/server";
import { fetchAlpacaSnapshots, fetchYahooQuote, hasAlpacaCredentials } from "@/lib/services/market-api";
import { cached, TTL } from "@/lib/server-cache";

interface IndexData {
  ticker: string;
  name: string;
  value: number;
  change: number;
  changePercent: number;
}

const INDICES = [
  { ticker: "SPY", name: "S&P 500", display: "SPX" },
  { ticker: "QQQ", name: "NASDAQ-100", display: "IXIC" },
  { ticker: "DIA", name: "Dow Jones", display: "DJI" },
  { ticker: "VIXY", name: "VIX", display: "VIX" },
];

export async function GET() {
  try {
    const data = await cached(
      "market:indices",
      async (): Promise<IndexData[]> => {
        const results: IndexData[] = [];

        // Try Alpaca first
        if (hasAlpacaCredentials()) {
          const tickers = INDICES.map((i) => i.ticker);
          const snapshots = await fetchAlpacaSnapshots(tickers);

          for (const idx of INDICES) {
            const snap = snapshots.get(idx.ticker);
            if (snap && snap.price > 0) {
              results.push({
                ticker: idx.display,
                name: idx.name,
                value: snap.price,
                change: snap.change,
                changePercent: snap.changePercent,
              });
              continue;
            }

            // Fallback to Yahoo
            const yahoo = await fetchYahooQuote(idx.ticker);
            if (yahoo && yahoo.price > 0) {
              results.push({
                ticker: idx.display,
                name: idx.name,
                value: yahoo.price,
                change: yahoo.change,
                changePercent: yahoo.changePercent,
              });
            }
          }
        } else {
          // No Alpaca — use Yahoo for all
          for (const idx of INDICES) {
            const yahoo = await fetchYahooQuote(idx.ticker);
            if (yahoo && yahoo.price > 0) {
              results.push({
                ticker: idx.display,
                name: idx.name,
                value: yahoo.price,
                change: yahoo.change,
                changePercent: yahoo.changePercent,
              });
            }
          }
        }

        return results;
      },
      TTL.SHORT
    );

    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to fetch indices" },
      { status: 500 }
    );
  }
}
