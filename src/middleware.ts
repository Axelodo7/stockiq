import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware();

export const config = {
  matcher: [
    // Include API routes so `auth()` works inside route handlers.
    // Excluding them made every protected endpoint throw instead of returning 401.
    "/((?!_next|.*\\.(?:html|css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$).*)",
  ],
};
