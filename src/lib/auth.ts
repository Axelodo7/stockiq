import { clerkClient } from "@clerk/nextjs/server";
import { db } from "./db";

const ADMIN_EMAILS = ["ayyan.zeeshan@gmail.com", "arhraja0@gmail.com"];

export async function getOrCreateUser(clerkUserId: string) {
  let user = await db.user.findUnique({
    where: { id: clerkUserId },
  });

  if (!user) {
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(clerkUserId);
    const email = clerkUser.emailAddresses?.[0]?.emailAddress;
    const isAdmin = email ? ADMIN_EMAILS.includes(email.toLowerCase()) : false;

    user = await db.user.create({
      data: {
        id: clerkUserId,
        email: email || "",
        name: `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || null,
        image: clerkUser.imageUrl,
        role: isAdmin ? "ADMIN" : "USER",
        subscriptionTier: isAdmin ? "ENTERPRISE" : "FREE",
      },
    });
  } else if (ADMIN_EMAILS.includes((user.email || "").toLowerCase()) && user.role !== "ADMIN") {
    user = await db.user.update({
      where: { id: clerkUserId },
      data: { role: "ADMIN", subscriptionTier: "ENTERPRISE" },
    });
  }

  return user;
}
