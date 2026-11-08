import { NextRequest, NextResponse } from "next/server";
import { getTrendAnalysis, type TrendAnalysis } from "@/lib/services/python-client";
import { generatePriceHistory, getStockInfo, fetchRealPriceServer } from "@/lib/services/market-mock";
import { checkAIRateLimit } from "@/lib/security/ai-rate-limit";

function generateMockTrends(ticker: string, realPrice?: number): TrendAnalysis {
  const stock = getStockInfo(ticker);
  const price = realPrice || stock.price || 100;
  const data = generatePriceHistory(price, 4788);
  const closes = data.map((d) => d.close);
  const current = closes[closes.length - 1];
  const sma10 = closes.slice(-10).reduce((a, b) => a + b, 0) / 10;
  const sma30 = closes.slice(-30).reduce((a, b) => a + b, 0) / 30;

  return {
    ticker,
    trends: [
      { period: "short_term", days: 10, direction: current > sma10 ? "up" : "down", slope_pct_per_day: 0.12, strength: 0.72 },
      { period: "medium_term", days: 30, direction: current > sma30 ? "up" : "down", slope_pct_per_day: 0.08, strength: 0.65 },
    ],
    patterns: [
      { pattern: "bullish_momentum", confidence: 0.6, description: "Accelerating upward movement" },
    ],
    momentum: { rsi_14: 58.3, roc_10d: 2.4, momentum_score: 0.15 },
    support_resistance: {
      pivot: Math.round(current * 0.98 * 100) / 100,
      r1: Math.round(current * 1.01 * 100) / 100,
      r2: Math.round(current * 1.03 * 100) / 100,
      s1: Math.round(current * 0.97 * 100) / 100,
      s2: Math.round(current * 0.95 * 100) / 100,
    },
    current_price: current,
    generated_at: new Date().toISOString(),
  };
}

export async function POST(request: NextRequest) {
  const limit = await checkAIRateLimit(request);
  if (limit.blocked) return limit.response!;

  try {
    const body = await request.json();
    const { ticker, data } = body;
    if (!ticker || !data) {
      return NextResponse.json({ success: false, error: "ticker and data required" }, { status: 400 });
    }
    const realPrice = await fetchRealPriceServer(ticker);
    const result = await getTrendAnalysis(ticker, data);
    return NextResponse.json({ success: true, data: result || generateMockTrends(ticker, realPrice || undefined) });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
