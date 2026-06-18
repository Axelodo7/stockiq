import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import {
  success,
  created,
  unauthorized,
  notFound,
  validationError,
  handleApiError,
} from "@/lib/api-response";
import { createAlertSchema, paginationSchema } from "@/lib/validation/schemas";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return unauthorized();

    const { searchParams } = new URL(request.url);
    const pagination = paginationSchema.parse({
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
    });

    const [alerts, total] = await Promise.all([
      db.alert.findMany({
        where: { userId },
        include: { stock: true },
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
        orderBy: { createdAt: "desc" },
      }),
      db.alert.count({ where: { userId } }),
    ]);

    return success(alerts, 200, {
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
    if (!userId) return unauthorized();

    const body = await request.json();
    const result = createAlertSchema.safeParse(body);
    if (!result.success) {
      return validationError("Invalid input", result.error.flatten());
    }

    const stock = await db.stock.findUnique({
      where: { ticker: result.data.stockTicker },
    });
    if (!stock) {
      return notFound(`Stock with ticker "${result.data.stockTicker}" not found`);
    }

    const alert = await db.alert.create({
      data: {
        userId,
        stockId: stock.id,
        type: result.data.type,
        condition: result.data.condition,
        targetValue: result.data.targetValue,
      },
      include: { stock: true },
    });

    return created(alert);
  } catch (error) {
    return handleApiError(error);
  }
}
