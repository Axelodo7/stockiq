import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware();

export const config = {
  matcher: [
    "/((?!_next|.*\\.(?:html|css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$).*)",
  ],
};
