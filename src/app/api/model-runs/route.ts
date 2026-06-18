import { NextRequest } from "next/server";
import { success, handleApiError } from "@/lib/api-response";
import { perIPLimit } from "@/lib/security/rate-limit";

const MOCK_MODEL_RUNS = [
  {
    id: "run-1",
    ticker: "AAPL",
    modelType: "XGBOOST",
    status: "completed",
    accuracy: 0.68,
    winRate: 0.62,
    sharpeRatio: 1.45,
    maxDrawdown: -0.08,
    totalReturn: 0.15,
    trainedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    durationMs: 4500,
    dataPointsUsed: 252,
    metricsJson: { mae: 2.34, rmse: 3.12, mape: 0.018 },
    error: null,
  },
  {
    id: "run-2",
    ticker: "AAPL",
    modelType: "RANDOM_FOREST",
    status: "completed",
    accuracy: 0.65,
    winRate: 0.58,
    sharpeRatio: 1.22,
    maxDrawdown: -0.11,
    totalReturn: 0.12,
    trainedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    durationMs: 3200,
    dataPointsUsed: 252,
    metricsJson: { mae: 2.56, rmse: 3.45, mape: 0.021 },
    error: null,
  },
  {
    id: "run-3",
    ticker: "MSFT",
    modelType: "XGBOOST",
    status: "completed",
    accuracy: 0.71,
    winRate: 0.65,
    sharpeRatio: 1.58,
    maxDrawdown: -0.07,
    totalReturn: 0.18,
    trainedAt: new Date(Date.now() - 86400000).toISOString(),
    durationMs: 4800,
    dataPointsUsed: 252,
    metricsJson: { mae: 3.21, rmse: 4.02, mape: 0.015 },
    error: null,
  },
  {
    id: "run-4",
    ticker: "TSLA",
    modelType: "ENSEMBLE",
    status: "completed",
    accuracy: 0.59,
    winRate: 0.54,
    sharpeRatio: 0.95,
    maxDrawdown: -0.15,
    totalReturn: 0.08,
    trainedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    durationMs: 12000,
    dataPointsUsed: 252,
    metricsJson: { mae: 5.67, rmse: 7.23, mape: 0.032 },
    error: null,
  },
];

export async function GET(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const limit = perIPLimit(ip);
  if (!limit.allowed) {
    return new Response("Too Many Requests", { status: 429 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const ticker = searchParams.get("ticker");

    let runs = MOCK_MODEL_RUNS;
    if (ticker) {
      runs = runs.filter((r) => r.ticker === ticker.toUpperCase());
    }

    return success(runs);
  } catch (error) {
    return handleApiError(error);
  }
}
