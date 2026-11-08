import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { success, unauthorized, handleApiError } from "@/lib/api-response";
import { getStockInfo } from "@/lib/services/market-mock";

/**
 * Ensure a stock exists in the database for a given ticker.
 * Called by clients before adding positions/watchlist items/alerts
 * to auto-create Stock records on demand.
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return unauthorized();

    const body = await request.json();
    const ticker = String(body?.ticker || "").toUpperCase().trim();

    if (!ticker || !/^[A-Z]{1,10}$/.test(ticker)) {
      return NextResponse.json(
        { success: false, error: "Invalid ticker" },
        { status: 400 }
      );
    }

    let stock = await db.stock.findUnique({ where: { ticker } });

    if (!stock) {
      // Pull a friendly name from the mock service
      const info = getStockInfo(ticker);
      stock = await db.stock.create({
        data: {
          ticker,
          companyName: info.name || ticker,
          sector: info.sector || "Unknown",
        },
      });
    }

    return success(stock);
  } catch (error) {
    return handleApiError(error);
  }
}
