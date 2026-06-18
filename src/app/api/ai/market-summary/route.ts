import { NextResponse } from "next/server";
import { getMarketSummary, type MarketSummary } from "@/lib/services/python-client";
import { generatePriceHistory, getStockInfo } from "@/lib/services/market-mock";

const TICKERS = ["AAPL", "GOOGL", "MSFT", "AMZN", "TSLA", "NVDA", "META", "JPM"];

function generateMockMarketSummary(): MarketSummary {
  const stocks = TICKERS.map((t) => {
    const info = getStockInfo(t);
    return { ticker: t, price: info.price, change_pct: ((info.price - info.prevClose) / info.prevClose) * 100 };
  });

  const avgChange = stocks.reduce((a, s) => a + s.change_pct, 0) / stocks.length;
  const bullish = stocks.filter((s) => s.change_pct > 0.5).length;
  const bearish = stocks.filter((s) => s.change_pct < -0.5).length;
  const sorted = [...stocks].sort((a, b) => b.change_pct - a.change_pct);

  return {
    sentiment: bullish > bearish ? "bullish" : bearish > bullish ? "bearish" : "neutral",
    avg_change_pct: Math.round(avgChange * 100) / 100,
    avg_5d_return: Math.round(avgChange * 0.8 * 100) / 100,
    avg_20d_return: Math.round(avgChange * 1.5 * 100) / 100,
    bullish_count: bullish,
    bearish_count: bearish,
    total_stocks: stocks.length,
    top_gainers: sorted
      .slice(0, 3)
      .filter((s) => s.change_pct > 0)
      .map((s) => ({ ticker: s.ticker, price: s.price, change_pct: Math.round(s.change_pct * 100) / 100 })),
    top_losers: sorted
      .slice(-3)
      .reverse()
      .filter((s) => s.change_pct < 0)
      .map((s) => ({ ticker: s.ticker, price: s.price, change_pct: Math.round(s.change_pct * 100) / 100 })),
    unusual_volume: [{ ticker: "NVDA", volume_ratio: 2.1 }],
    individual: {},
    summary: `Market sentiment is ${bullish > bearish ? "bullish" : bearish > bullish ? "bearish" : "mixed"} with ${bullish} gainers and ${bearish} losers across ${stocks.length} tracked stocks. Average change: ${avgChange > 0 ? "+" : ""}${avgChange.toFixed(2)}%.`,
    generated_at: new Date().toISOString(),
  };
}

export async function GET() {
  try {
    const stockData: Record<string, ReturnType<typeof generatePriceHistory>> = {};
    for (const ticker of TICKERS) {
      stockData[ticker] = generatePriceHistory(getStockInfo(ticker).price, 60);
    }
    const result = await getMarketSummary(stockData);
    return NextResponse.json({ success: true, data: result || generateMockMarketSummary() });
  } catch {
    return NextResponse.json({ success: true, data: generateMockMarketSummary() });
  }
}
