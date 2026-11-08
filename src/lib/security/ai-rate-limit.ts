/**
 * Shared rate-limit + auth helper for AI routes.
 * Combines per-user and per-IP throttling for unauthenticated and authenticated calls.
 */

import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { aiIPLimit, aiUserLimit } from "./rate-limit";

export interface RateLimitResult {
  blocked: boolean;
  response?: NextResponse;
}

export async function checkAIRateLimit(request: NextRequest): Promise<RateLimitResult> {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

  // IP-based limit (5/min) — always checked
  const ipLimit = aiIPLimit(ip);
  if (!ipLimit.allowed) {
    return {
      blocked: true,
      response: NextResponse.json(
        { success: false, error: "Rate limit exceeded. Try again in a minute." },
        { status: 429, headers: { "Retry-After": "60" } }
      ),
    };
  }

  // User-based limit (10/min) — checked when authenticated
  try {
    const { userId } = await auth();
    if (userId) {
      const userLimit = aiUserLimit(userId);
      if (!userLimit.allowed) {
        return {
          blocked: true,
          response: NextResponse.json(
            { success: false, error: "Rate limit exceeded. Try again in a minute." },
            { status: 429, headers: { "Retry-After": "60" } }
          ),
        };
      }
    }
  } catch {
    // Auth check failed — fall through (IP limit already passed)
  }

  return { blocked: false };
}
