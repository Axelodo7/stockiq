import { NextRequest } from "next/server";
import { success, validationError, handleApiError } from "@/lib/api-response";
import { tickerSchema } from "@/lib/validation/schemas";
import { perIPLimit } from "@/lib/security/rate-limit";
import { runBacktest } from "@/lib/services/python-client";
import { generatePriceHistory, getStockInfo } from "@/lib/services/market-mock";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const limit = perIPLimit(ip);
  if (!limit.allowed) {
    return new Response("Too Many Requests", { status: 429 });
  }

  try {
    const body = await request.json();
    const parsed = tickerSchema.safeParse(body.ticker?.toUpperCase());
    if (!parsed.success) {
      return validationError("Valid 'ticker' is required");
    }

    const ticker = parsed.data;
    const initialCapital = body.initial_capital || 10000;
    const modelType = (body.model_type || "ENSEMBLE") as string;

    const stock = getStockInfo(ticker);
    const priceHistory = generatePriceHistory(stock.price);

    const ohlcv = priceHistory.map((d) => ({
      date: d.date,
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
      volume: d.volume,
    }));

    const result = await runBacktest(ticker, modelType, ohlcv, initialCapital);

    if (result) {
      return success(result);
    }

    // Fallback mock response
    const equityCurve = [];
    let capital = initialCapital;
    const now = new Date();
    for (let i = 365; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dailyReturn = (Math.random() - 0.48) * 0.02;
      capital *= 1 + dailyReturn;
      equityCurve.push({
        date: date.toISOString().split("T")[0],
        equity: Math.round(capital * 100) / 100,
        position: 0,
      });
    }

    const totalReturn = (capital - initialCapital) / initialCapital;
    const wins = Math.floor(120 + Math.random() * 40);
    const losses = Math.floor(80 + Math.random() * 30);

    return success({
      ticker,
      model_type: modelType,
      total_return: Math.round(totalReturn * 100) / 100,
      annualized_return: Math.round(totalReturn * 100) / 100,
      sharpe_ratio: Math.round((1.0 + Math.random() * 0.8) * 100) / 100,
      max_drawdown: Math.round((5 + Math.random() * 10) * 100) / 100,
      win_rate: Math.round((wins / (wins + losses)) * 10000) / 10000,
      profit_factor: Math.round((1.2 + Math.random() * 0.5) * 100) / 100,
      total_trades: wins + losses,
      equity_curve: equityCurve,
      trades: [],
      initial_capital: initialCapital,
      final_capital: Math.round(capital * 100) / 100,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
