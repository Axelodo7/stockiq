import { NextRequest } from "next/server";
import { success, validationError, notFound, handleApiError } from "@/lib/api-response";
import { db } from "@/lib/db";
import { tickerSchema } from "@/lib/validation/schemas";
import { perIPLimit } from "@/lib/security/rate-limit";

export async function GET(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const limit = perIPLimit(ip);
  if (!limit.allowed) {
    return new Response("Too Many Requests", { status: 429 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const ticker = searchParams.get("ticker");

    const parsed = tickerSchema.safeParse(ticker?.toUpperCase());
    if (!parsed.success) {
      return validationError("Valid 'ticker' query parameter is required");
    }

    const stock = await db.stock.findUnique({
      where: { ticker: parsed.data },
    });
    if (!stock) {
      return notFound(`Stock with ticker "${parsed.data}" not found`);
    }

    const predictions = await db.prediction.findMany({
      where: { stockId: stock.id },
      orderBy: { predictionDate: "desc" },
      take: 30,
    });

    return success({ stock, predictions });
  } catch (error) {
    return handleApiError(error);
  }
}
