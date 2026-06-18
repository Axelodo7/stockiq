import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { success, created, unauthorized, validationError, handleApiError } from "@/lib/api-response";
import { createWatchlistSchema, paginationSchema } from "@/lib/validation/schemas";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return unauthorized();
    }

    const { searchParams } = new URL(request.url);
    const pagination = paginationSchema.parse({
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
    });

    const [watchlists, total] = await Promise.all([
      db.watchlist.findMany({
        where: { userId },
        include: { items: { include: { stock: true } } },
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
        orderBy: { createdAt: "desc" },
      }),
      db.watchlist.count({ where: { userId } }),
    ]);

    return success(watchlists, 200, {
      page: pagination.page,
      limit: pagination.limit,
      total,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return unauthorized();
    }

    const body = await request.json();
    const result = createWatchlistSchema.safeParse(body);
    if (!result.success) {
      return validationError("Invalid input", result.error.flatten());
    }

    const watchlist = await db.watchlist.create({
      data: {
        userId,
        name: result.data.name,
        description: result.data.description,
      },
      include: { items: true },
    });

    return created(watchlist);
  } catch (error) {
    return handleApiError(error);
  }
}
