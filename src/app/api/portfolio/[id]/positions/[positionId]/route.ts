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
import { updatePositionSchema } from "@/lib/validation/schemas";

async function getOwnedPortfolio(id: string, userId: string) {
  const portfolio = await db.portfolio.findUnique({ where: { id } });
  if (!portfolio) return { portfolio: null, error: "notFound" as const };
  if (portfolio.userId !== userId) return { portfolio: null, error: "forbidden" as const };
  return { portfolio, error: null };
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; positionId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) return unauthorized();

    const { id, positionId } = await params;
    const { error } = await getOwnedPortfolio(id, userId);
    if (error === "notFound") return notFound("Portfolio not found");
    if (error === "forbidden") return forbidden();

    const position = await db.portfolioPosition.findFirst({
      where: { id: positionId, portfolioId: id },
    });
    if (!position) return notFound("Position not found");

    const body = await request.json();
    const result = updatePositionSchema.safeParse(body);
    if (!result.success) {
      return validationError("Invalid input", result.error.flatten());
    }

    const updated = await db.portfolioPosition.update({
      where: { id: positionId },
      data: result.data,
      include: { stock: true },
    });

    return success(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; positionId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) return unauthorized();

    const { id, positionId } = await params;
    const { error } = await getOwnedPortfolio(id, userId);
    if (error === "notFound") return notFound("Portfolio not found");
    if (error === "forbidden") return forbidden();

    const position = await db.portfolioPosition.findFirst({
      where: { id: positionId, portfolioId: id },
    });
    if (!position) return notFound("Position not found");

    await db.portfolioPosition.delete({ where: { id: positionId } });
    return noContent();
  } catch (error) {
    return handleApiError(error);
  }
}
