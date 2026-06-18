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
import { updatePortfolioSchema } from "@/lib/validation/schemas";

async function getOwnedPortfolio(id: string, userId: string) {
  const portfolio = await db.portfolio.findUnique({ where: { id } });
  if (!portfolio) return { portfolio: null, error: "notFound" as const };
  if (portfolio.userId !== userId) return { portfolio: null, error: "forbidden" as const };
  return { portfolio, error: null };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) return unauthorized();

    const { id } = await params;
    const { error } = await getOwnedPortfolio(id, userId);
    if (error === "notFound") return notFound("Portfolio not found");
    if (error === "forbidden") return forbidden();

    const full = await db.portfolio.findUnique({
      where: { id },
      include: {
        positions: { include: { stock: true } },
        transactions: { include: { stock: true }, orderBy: { executedAt: "desc" } },
      },
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
    const { error } = await getOwnedPortfolio(id, userId);
    if (error === "notFound") return notFound("Portfolio not found");
    if (error === "forbidden") return forbidden();

    const body = await request.json();
    const result = updatePortfolioSchema.safeParse(body);
    if (!result.success) {
      return validationError("Invalid input", result.error.flatten());
    }

    const updated = await db.portfolio.update({
      where: { id },
      data: result.data,
      include: { positions: { include: { stock: true } } },
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
    const { error } = await getOwnedPortfolio(id, userId);
    if (error === "notFound") return notFound("Portfolio not found");
    if (error === "forbidden") return forbidden();

    await db.portfolio.delete({ where: { id } });
    return noContent();
  } catch (error) {
    return handleApiError(error);
  }
}
