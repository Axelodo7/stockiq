import { NextRequest } from "next/server";
import { success, validationError, handleApiError } from "@/lib/api-response";
import { marketDataService } from "@/lib/services/market-data";
import { historicalDataQuerySchema } from "@/lib/validation/schemas";
import { perIPLimit } from "@/lib/security/rate-limit";

export async function GET(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const limit = perIPLimit(ip);
  if (!limit.allowed) {
    return new Response("Too Many Requests", { status: 429 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const result = historicalDataQuerySchema.safeParse({
      ticker: searchParams.get("ticker"),
      range: searchParams.get("range") || "1Y",
      interval: searchParams.get("interval"),
    });

    if (!result.success) {
      return validationError("Invalid query parameters", result.error.flatten());
    }

    const { ticker, range } = result.data;
    const data = await marketDataService.getHistoricalData(ticker, range);
    return success(data);
  } catch (error) {
    return handleApiError(error);
  }
}
