import { NextRequest } from "next/server";
import { success } from "@/lib/api-response";
import { perIPLimit } from "@/lib/security/rate-limit";

export async function GET(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const limit = perIPLimit(ip);
  if (!limit.allowed) {
    return new Response("Too Many Requests", { status: 429 });
  }

  return success({ status: "ok", timestamp: new Date().toISOString() });
}
