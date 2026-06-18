import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import {
  success,
  noContent,
  unauthorized,
  forbidden,
  notFound,
  validationError,
  handleApiError,
} from "@/lib/api-response";
import { updateWatchlistSchema } from "@/lib/validation/schemas";

async function getOwnedWatchlist(id: string, userId: string) {
  const watchlist = await db.watchlist.findUnique({ where: { id } });
  if (!watchlist) return { watchlist: null, error: "notFound" as const };
  if (watchlist.userId !== userId) return { watchlist: null, error: "forbidden" as const };
  return { watchlist, error: null };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) return unauthorized();

    const { id } = await params;
    const { error } = await getOwnedWatchlist(id, userId);
    if (error === "notFound") return notFound("Watchlist not found");
    if (error === "forbidden") return forbidden();

    const full = await db.watchlist.findUnique({
      where: { id },
      include: { items: { include: { stock: true }, orderBy: { sortOrder: "asc" } } },
    });

    return success(full);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(
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
    const result = updateWatchlistSchema.safeParse(body);
    if (!result.success) {
      return validationError("Invalid input", result.error.flatten());
    }

    const updated = await db.watchlist.update({
      where: { id },
      data: result.data,
      include: { items: true },
    });

    return success(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) return unauthorized();

    const { id } = await params;
    const { error } = await getOwnedWatchlist(id, userId);
    if (error === "notFound") return notFound("Watchlist not found");
    if (error === "forbidden") return forbidden();

    await db.watchlist.delete({ where: { id } });
    return noContent();
  } catch (error) {
    return handleApiError(error);
  }
}
