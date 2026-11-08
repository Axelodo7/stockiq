import { NextRequest, NextResponse } from "next/server";
import { getAIAnalysis, type AIAnalysis } from "@/lib/services/python-client";
import { generatePriceHistory, getStockInfo, fetchRealPriceServer } from "@/lib/services/market-mock";
import { cached, TTL } from "@/lib/server-cache";
import { checkAIRateLimit } from "@/lib/security/ai-rate-limit";

function generateMockAnalysis(ticker: string, realPrice?: number): AIAnalysis {
  const stock = getStockInfo(ticker);
  const price = realPrice || stock.price || 100;
  const data = generatePriceHistory(price, 4788);
  const closes = data.map((d) => d.close);
  const current = closes[closes.length - 1];

  const sma20 = closes.slice(-20).reduce((a, b) => a + b, 0) / 20;
  const sma50 = closes.slice(-50).reduce((a, b) => a + b, 0) / 50;
  const trend = current > sma20 ? 1 : -1;
  const bullish = 0.5 + trend * 0.3;

  return {
    ticker,
    overall_signal: trend > 0 ? "bullish" : "bearish",
    conviction: "moderate",
    bullish_probability: Math.round(bullish * 1000) / 1000,
    bearish_probability: Math.round((1 - bullish) * 1000) / 1000,
    signals: [
      { indicator: "RSI", signal: "neutral", direction: "neutral", value: 58.3 },
      { indicator: "MACD", signal: trend > 0 ? "bullish crossover" : "bearish crossover", direction: trend > 0 ? "bullish" : "bearish", value: 2.41 },
      { indicator: "Bollinger", signal: "55% of range", direction: "neutral", value: 0.55 },
      { indicator: "Golden Cross", signal: trend > 0 ? "50 > 200 SMA" : "50 < 200 SMA", direction: trend > 0 ? "bullish" : "bearish", value: 1.02 },
    ],
    support: Math.round(Math.min(...closes.slice(-20)) * 100) / 100,
    resistance: Math.round(Math.max(...closes.slice(-20)) * 100) / 100,
    volatility: 18.7,
    trend_strength: Math.round(trend * 0.5 * 1000) / 1000,
    volume_trend: "stable",
    summary: `RSI at 58.3 is neutral. ${trend > 0 ? "Golden cross" : "Death cross"} pattern on daily chart. Volatility is 18.7% annualized. Volume trend is stable.`,
    key_levels: {
      support: Math.round(Math.min(...closes.slice(-20)) * 100) / 100,
      resistance: Math.round(Math.max(...closes.slice(-20)) * 100) / 100,
      sma_50: Math.round(sma50 * 100) / 100,
      sma_200: Math.round(sma50 * 0.95 * 100) / 100,
    },
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
      return NextResponse.json(
        { success: false, error: "ticker and data required" },
        { status: 400 }
      );
    }

    const realPrice = await fetchRealPriceServer(ticker);

    const result = await cached(
      `ai:analyze:${ticker}`,
      async () => {
        const pythonResult = await getAIAnalysis(ticker, data);
        return pythonResult || generateMockAnalysis(ticker, realPrice || undefined);
      },
      TTL.MEDIUM
    );

    return NextResponse.json({ success: true, data: result });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
