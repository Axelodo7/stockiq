import { NextRequest } from "next/server";
import { success, notFound, validationError, handleApiError } from "@/lib/api-response";
import { marketDataService } from "@/lib/services/market-data";
import { tickerSchema } from "@/lib/validation/schemas";
import { perIPLimit } from "@/lib/security/rate-limit";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const ip = _request.headers.get("x-forwarded-for") || "unknown";
  const limit = perIPLimit(ip);
  if (!limit.allowed) {
    return new Response("Too Many Requests", { status: 429 });
  }

  try {
    const { ticker } = await params;
    const parsed = tickerSchema.safeParse(ticker.toUpperCase());
    if (!parsed.success) {
      return validationError("Invalid ticker symbol");
    }

    const quote = await marketDataService.getQuote(parsed.data);
    if (!quote) {
      return notFound(`Stock with ticker "${parsed.data}" not found`);
    }

    return success(quote);
  } catch (error) {
    return handleApiError(error);
  }
}
