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
import { updateAlertSchema } from "@/lib/validation/schemas";

async function getOwnedAlert(id: string, userId: string) {
  const alert = await db.alert.findUnique({ where: { id } });
  if (!alert) return { alert: null, error: "notFound" as const };
  if (alert.userId !== userId) return { alert: null, error: "forbidden" as const };
  return { alert, error: null };
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) return unauthorized();

    const { id } = await params;
    const { error } = await getOwnedAlert(id, userId);
    if (error === "notFound") return notFound("Alert not found");
    if (error === "forbidden") return forbidden();

    const body = await request.json();
    const result = updateAlertSchema.safeParse(body);
    if (!result.success) {
      return validationError("Invalid input", result.error.flatten());
    }

    const updated = await db.alert.update({
      where: { id },
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) return unauthorized();

    const { id } = await params;
    const { error } = await getOwnedAlert(id, userId);
    if (error === "notFound") return notFound("Alert not found");
    if (error === "forbidden") return forbidden();

    await db.alert.delete({ where: { id } });
    return noContent();
  } catch (error) {
    return handleApiError(error);
  }
}
