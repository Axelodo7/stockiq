import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

const ADMIN_EMAILS = ["ayyan.zeeshan@gmail.com"];

export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const isAdmin = ADMIN_EMAILS.includes((user.email || "").toLowerCase());

  if (isAdmin && (user.role !== "ADMIN" || user.subscriptionTier !== "ENTERPRISE")) {
    const updated = await db.user.update({
      where: { id: userId },
      data: { role: "ADMIN", subscriptionTier: "ENTERPRISE" },
    });
    return NextResponse.json({ promoted: true, role: updated.role, tier: updated.subscriptionTier });
  }

  return NextResponse.json({ promoted: false, role: user.role, tier: user.subscriptionTier });
}
