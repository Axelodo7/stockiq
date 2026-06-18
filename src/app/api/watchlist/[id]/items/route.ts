import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import {
  created,
  unauthorized,
  forbidden,
  notFound,
  validationError,
  handleApiError,
} from "@/lib/api-response";
import { addWatchlistItemSchema } from "@/lib/validation/schemas";

async function getOwnedWatchlist(id: string, userId: string) {
  const watchlist = await db.watchlist.findUnique({ where: { id } });
  if (!watchlist) return { watchlist: null, error: "notFound" as const };
  if (watchlist.userId !== userId) return { watchlist: null, error: "forbidden" as const };
  return { watchlist, error: null };
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) return unauthorized();

    const { id } = await params;
    const { error } = await getOwnedWatchlist(id, userId);
    if (error === "notFound") return notFound("Watchlist not found");
    if (error === "forbidden") return forbidden();

    const body = await request.json();
    const result = addWatchlistItemSchema.safeParse(body);
    if (!result.success) {
      return validationError("Invalid input", result.error.flatten());
    }

    const stock = await db.stock.findUnique({
      where: { ticker: result.data.stockTicker },
    });
    if (!stock) {
      return notFound(`Stock with ticker "${result.data.stockTicker}" not found`);
    }

    const existing = await db.watchlistItem.findUnique({
      where: { watchlistId_stockId: { watchlistId: id, stockId: stock.id } },
    });
    if (existing) {
      return validationError("Stock is already in this watchlist");
    }

    const maxOrder = await db.watchlistItem.findFirst({
      where: { watchlistId: id },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });

    const item = await db.watchlistItem.create({
      data: {
        watchlistId: id,
        stockId: stock.id,
        sortOrder: (maxOrder?.sortOrder ?? -1) + 1,
      },
      include: { stock: true },
    });

    return created(item);
  } catch (error) {
    return handleApiError(error);
  }
}
