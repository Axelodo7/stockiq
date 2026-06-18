import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import {
  success,
  created,
  unauthorized,
  forbidden,
  notFound,
  validationError,
  handleApiError,
} from "@/lib/api-response";
import { createPositionSchema, paginationSchema } from "@/lib/validation/schemas";

async function getOwnedPortfolio(id: string, userId: string) {
  const portfolio = await db.portfolio.findUnique({ where: { id } });
  if (!portfolio) return { portfolio: null, error: "notFound" as const };
  if (portfolio.userId !== userId) return { portfolio: null, error: "forbidden" as const };
  return { portfolio, error: null };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) return unauthorized();

    const { id } = await params;
    const { error } = await getOwnedPortfolio(id, userId);
    if (error === "notFound") return notFound("Portfolio not found");
    if (error === "forbidden") return forbidden();

    const { searchParams } = new URL(request.url);
    const pagination = paginationSchema.parse({
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
    });

    const [positions, total] = await Promise.all([
      db.portfolioPosition.findMany({
        where: { portfolioId: id },
        include: { stock: true },
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
        orderBy: { createdAt: "desc" },
      }),
      db.portfolioPosition.count({ where: { portfolioId: id } }),
    ]);

    return success(positions, 200, {
      page: pagination.page,
      limit: pagination.limit,
      total,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) return unauthorized();

    const { id } = await params;
    const { error } = await getOwnedPortfolio(id, userId);
    if (error === "notFound") return notFound("Portfolio not found");
    if (error === "forbidden") return forbidden();

    const body = await request.json();
    const result = createPositionSchema.safeParse(body);
    if (!result.success) {
      return validationError("Invalid input", result.error.flatten());
    }

    const stock = await db.stock.findUnique({
      where: { ticker: result.data.stockTicker },
    });
    if (!stock) {
      return notFound(`Stock with ticker "${result.data.stockTicker}" not found`);
    }

    const existing = await db.portfolioPosition.findUnique({
      where: { portfolioId_stockId: { portfolioId: id, stockId: stock.id } },
    });
    if (existing) {
      return validationError("Position for this stock already exists in this portfolio");
    }

    const position = await db.portfolioPosition.create({
      data: {
        portfolioId: id,
        stockId: stock.id,
        shares: result.data.shares,
        avgCost: result.data.avgCost,
      },
      include: { stock: true },
    });

    return created(position);
  } catch (error) {
    return handleApiError(error);
  }
}
