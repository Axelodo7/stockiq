import { NextRequest, NextResponse } from "next/server";
import { getEarningsAnalysis, type EarningsAnalysis } from "@/lib/services/python-client";
import { getStockInfo, fetchRealPriceServer } from "@/lib/services/market-mock";

function generateMockEarnings(ticker: string, realPrice?: number): EarningsAnalysis {
  const stock = getStockInfo(ticker);
  const price = realPrice || stock.price || 100;
  return {
    ticker,
    current_price: price,
    earnings_date: "2026-07-02",
    expectations: { surprise_pct: 5.2, beat: true, magnitude: "moderate" },
    price_reaction: 2.4,
    volume_spike: 1.8,
    drift_analysis: { avg_1d_return: 0.05, avg_5d_return: 0.32, volatility_of_returns: 1.87, positive_days_pct: 54.2 },
    assessment: "Modest earnings beat of 5.2%. Price moved up 2.4% on earnings day.",
    generated_at: new Date().toISOString(),
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ticker, data, earnings_date, reported_eps, expected_eps, revenue } = body;
    if (!ticker || !data) {
      return NextResponse.json({ success: false, error: "ticker and data required" }, { status: 400 });
    }
    const realPrice = await fetchRealPriceServer(ticker);
    const result = await getEarningsAnalysis(ticker, data, earnings_date, reported_eps, expected_eps, revenue);
    return NextResponse.json({ success: true, data: result || generateMockEarnings(ticker, realPrice || undefined) });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
