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
import { createTransactionSchema, paginationSchema } from "@/lib/validation/schemas";

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

    const [transactions, total] = await Promise.all([
      db.transaction.findMany({
        where: { portfolioId: id },
        include: { stock: true },
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
        orderBy: { executedAt: "desc" },
      }),
      db.transaction.count({ where: { portfolioId: id } }),
    ]);

    return success(transactions, 200, {
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
    const result = createTransactionSchema.safeParse(body);
    if (!result.success) {
      return validationError("Invalid input", result.error.flatten());
    }

    const stock = await db.stock.findUnique({
      where: { ticker: result.data.stockTicker },
    });
    if (!stock) {
      return notFound(`Stock with ticker "${result.data.stockTicker}" not found`);
    }

    const totalAmount = result.data.shares * result.data.price + result.data.fees;

    const transaction = await db.transaction.create({
      data: {
        portfolioId: id,
        stockId: stock.id,
        type: result.data.type,
        shares: result.data.shares,
        price: result.data.price,
        fees: result.data.fees,
        totalAmount,
      },
      include: { stock: true },
    });

    return created(transaction);
  } catch (error) {
    return handleApiError(error);
  }
}
