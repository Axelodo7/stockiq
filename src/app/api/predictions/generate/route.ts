import { NextRequest } from "next/server";
import { success, validationError, handleApiError } from "@/lib/api-response";
import { tickerSchema } from "@/lib/validation/schemas";
import { perIPLimit } from "@/lib/security/rate-limit";
import { marketDataService } from "@/lib/services/market-data";
import { getPrediction } from "@/lib/services/python-client";
import { predictionCache } from "@/lib/services/prediction-cache";

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

    const cached = predictionCache.get(ticker);
    if (cached) {
      return success(cached);
    }

    const ohlcv = await marketDataService.getHistoricalData(ticker, "1Y");
    if (!ohlcv || ohlcv.length < 5) {
      return validationError("Insufficient historical data for prediction");
    }

    const prediction = await getPrediction(ticker, ohlcv);
    predictionCache.set(ticker, prediction);

    return success(prediction);
  } catch (error) {
    return handleApiError(error);
  }
}
