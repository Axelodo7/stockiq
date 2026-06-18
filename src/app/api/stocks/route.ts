import { NextRequest } from "next/server";
import { success, validationError, handleApiError } from "@/lib/api-response";
import { marketDataService } from "@/lib/services/market-data";
import { perIPLimit } from "@/lib/security/rate-limit";

export async function GET(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const limit = perIPLimit(ip);
  if (!limit.allowed) {
    return new Response("Too Many Requests", { status: 429 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q");

    if (!q || q.trim().length === 0) {
      return validationError("Search query 'q' is required");
    }

    const stocks = await marketDataService.searchStocks(q.trim());
    return success(stocks);
  } catch (error) {
    return handleApiError(error);
  }
}
