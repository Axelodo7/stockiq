import { clerkClient } from "@clerk/nextjs/server";
import { db } from "./db";

export async function getOrCreateUser(clerkUserId: string) {
  let user = await db.user.findUnique({
    where: { id: clerkUserId },
  });

  if (!user) {
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(clerkUserId);
    const email = clerkUser.emailAddresses?.[0]?.emailAddress;

    user = await db.user.create({
      data: {
        id: clerkUserId,
        email: email || "",
        name: `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || null,
        image: clerkUser.imageUrl,
      },
    });
  }

  return user;
}
