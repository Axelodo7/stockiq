import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import {
  noContent,
  unauthorized,
  forbidden,
  notFound,
  handleApiError,
} from "@/lib/api-response";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) return unauthorized();

    const { id, itemId } = await params;

    const watchlist = await db.watchlist.findUnique({ where: { id } });
    if (!watchlist) return notFound("Watchlist not found");
    if (watchlist.userId !== userId) return forbidden();

    const item = await db.watchlistItem.findFirst({
      where: { id: itemId, watchlistId: id },
    });
    if (!item) return notFound("Watchlist item not found");

    await db.watchlistItem.delete({ where: { id: itemId } });
    return noContent();
  } catch (error) {
    return handleApiError(error);
  }
}
