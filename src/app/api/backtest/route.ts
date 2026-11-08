import { NextRequest } from "next/server";
import { success, validationError, handleApiError } from "@/lib/api-response";
import { tickerSchema } from "@/lib/validation/schemas";
import { perIPLimit } from "@/lib/security/rate-limit";
import { runBacktest } from "@/lib/services/python-client";
import { fetchAlpacaBars, fetchYahooBars } from "@/lib/services/market-api";
import { DEFAULT_COMMISSION, DEFAULT_SLIPPAGE_BPS } from "@/lib/trading-costs";

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
    const commission = typeof body.commission === "number" ? body.commission : DEFAULT_COMMISSION;
    const slippageBps = typeof body.slippage_bps === "number" ? body.slippage_bps : DEFAULT_SLIPPAGE_BPS;

    // Fetch REAL historical OHLCV — Alpaca primary, Yahoo fallback.
    // Two years of daily bars gives the backtester enough walk-forward runway.
    const start = new Date();
    start.setFullYear(start.getFullYear() - 2);
    const startDate = start.toISOString().split("T")[0];

    let bars = await fetchAlpacaBars(ticker, "1Day", startDate, 600);
    let dataSource: "alpaca" | "yahoo" = "alpaca";

    if (bars.length < 70) {
      bars = await fetchYahooBars(ticker, "2y");
      dataSource = "yahoo";
    }

    if (bars.length < 70) {
      return success(
        {
          ticker,
          model_type: modelType,
          error: "insufficient_data",
          message: `Need at least 70 historical bars to backtest ${ticker}. Only ${bars.length} available from market data providers.`,
          total_return: 0,
          annualized_return: null,
          sharpe_ratio: null,
          max_drawdown: 0,
          win_rate: 0,
          profit_factor: null,
          total_trades: 0,
          equity_curve: [],
          trades: [],
          initial_capital: initialCapital,
          final_capital: initialCapital,
        },
        200
      );
    }

    const ohlcv = bars.map((b) => ({
      date: b.date,
      open: b.open,
      high: b.high,
      low: b.low,
      close: b.close,
      volume: b.volume,
    }));

    const result = await runBacktest(ticker, modelType, ohlcv, initialCapital, commission, slippageBps);

    if (result) {
      return success({ ...result, data_source: dataSource, bars_used: ohlcv.length, commission, slippage_bps: slippageBps });
    }

    // Python service unavailable — surface an honest response rather than fake numbers.
    return success(
      {
        ticker,
        model_type: modelType,
        error: "model_unavailable",
        message:
          "Real market data was loaded, but no trained model is available for this ticker/model. Train a model first, then re-run the backtest.",
        data_source: dataSource,
        bars_used: ohlcv.length,
        total_return: 0,
        annualized_return: null,
        sharpe_ratio: null,
        max_drawdown: 0,
        win_rate: 0,
        profit_factor: null,
        total_trades: 0,
        equity_curve: [],
        trades: [],
        initial_capital: initialCapital,
        final_capital: initialCapital,
      },
      200
    );
  } catch (error) {
    return handleApiError(error);
  }
}
