import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { success, unauthorized, handleApiError, notFound } from "@/lib/api-response";
import { z } from "zod";

const preferencesSchema = z.object({
  emailAlerts: z.boolean().optional(),
  priceAlerts: z.boolean().optional(),
  predictionUpdates: z.boolean().optional(),
  weeklyDigest: z.boolean().optional(),
  earningsAlerts: z.boolean().optional(),
  defaultPortfolio: z.string().nullable().optional(),
  defaultWatchlist: z.string().nullable().optional(),
  preferredCurrency: z.string().length(3).optional(),
});

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return unauthorized();

    let prefs = await db.userPreferences.findUnique({ where: { userId } });

    // Auto-create default preferences on first access
    if (!prefs) {
      prefs = await db.userPreferences.create({
        data: {
          userId,
          emailAlerts: true,
          priceAlerts: true,
          predictionUpdates: true,
          weeklyDigest: true,
          earningsAlerts: false,
          preferredCurrency: "USD",
        },
      });
    }

    return success(prefs);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return unauthorized();

    const body = await request.json();
    const result = preferencesSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: "Invalid preferences", details: result.error.flatten() },
        { status: 400 }
      );
    }

    // Upsert: create if doesn't exist, update if it does
    const existing = await db.userPreferences.findUnique({ where: { userId } });

    let prefs;
    if (existing) {
      prefs = await db.userPreferences.update({
        where: { userId },
        data: result.data,
      });
    } else {
      prefs = await db.userPreferences.create({
        data: {
          userId,
          ...result.data,
        },
      });
    }

    return success(prefs);
  } catch (error) {
    return handleApiError(error);
  }
}
