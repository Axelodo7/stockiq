import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/pricing",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/login(.*)",
  "/register(.*)",
  "/api/health",
  "/api/stocks(.*)",
  "/api/history(.*)",
  "/api/predictions(.*)",
  "/api/ai(.*)",
]);

const isAuthRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/login(.*)",
  "/register(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
  const response = NextResponse.next();

  if (!isAuthRoute(request)) {
    const CSP_DIRECTIVES = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' blob: https://js.clerk.dev https://*.clerk.accounts.dev https://*.clerk.dev https://challenges.cloudflare.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob: https://img.clerk.dev https://*.clerk.dev https://*.clerk.accounts.dev",
      "font-src 'self' https://fonts.gstatic.com",
      "connect-src 'self' https://api.clerk.dev https://*.clerk.dev https://*.clerk.accounts.dev http://localhost:8000 https://api.resend.com",
      "frame-src 'self' https://js.clerk.dev https://*.clerk.accounts.dev https://challenges.cloudflare.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join("; ");

    response.headers.set("Content-Security-Policy", CSP_DIRECTIVES);
  }

  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), interest-cohort=()");
  response.headers.delete("X-Powered-By");
  response.headers.delete("Server");

  return response;
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
