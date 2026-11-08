import { test, expect } from "@playwright/test";

/**
 * End-to-end tests for public (unauthenticated) routes.
 * These exercise the marketing pages and 404 handling, which do not
 * require a Clerk session.
 */

test.describe("Marketing pages", () => {
  test("landing page loads with the hero headline", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/StockIQ/i);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("landing page has working navigation links", async ({ page }) => {
    await page.goto("/");
    const links = await page.getByRole("link").all();
    expect(links.length).toBeGreaterThan(0);
  });

  test("pricing page renders tier cards", async ({ page }) => {
    await page.goto("/pricing");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    // At least one plan name should be visible
    await expect(page.getByText(/FREE|PRO|ELITE|ENTERPRISE/i).first()).toBeVisible();
  });
});

test.describe("404 handling", () => {
  test("unknown routes render the custom not-found page", async ({ page }) => {
    const response = await page.goto("/this-route-does-not-exist-xyz");
    expect(response?.status()).toBe(404);
    await expect(page.getByText(/404|not found/i).first()).toBeVisible();
  });

  test("not-found page offers navigation back to the app", async ({ page }) => {
    await page.goto("/this-route-does-not-exist-xyz");
    await expect(
      page.getByRole("link", { name: /back to dashboard/i })
    ).toBeVisible();
  });
});

test.describe("API health", () => {
  test("health endpoint returns ok", async ({ request }) => {
    const res = await request.get("/api/health");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });
});

test.describe("Mobile navigation", () => {
  test("hamburger menu is visible on mobile and toggles the sidebar", async ({
    page,
    isMobile,
  }) => {
    test.skip(!isMobile, "mobile-only test");
    // The dashboard shell owns the TopBar (and its hamburger). The marketing
    // shell has its own separate header.
    await page.goto("/dashboard");

    const hamburger = page.getByRole("button", { name: /open menu/i });
    await expect(hamburger).toBeVisible();

    await hamburger.click();
    // The sidebar should slide into view
    await expect(page.getByRole("link", { name: /dashboard/i }).first()).toBeVisible();
  });

  test("pages do not overflow horizontally on mobile", async ({ page, isMobile }) => {
    test.skip(!isMobile, "mobile-only test");
    await page.goto("/pricing");

    const hasOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth + 1;
    });
    expect(hasOverflow).toBe(false);
  });

  test("marketing pages do not overflow horizontally on mobile", async ({
    page,
    isMobile,
  }) => {
    test.skip(!isMobile, "mobile-only test");
    await page.goto("/");

    const hasOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth + 1;
    });
    expect(hasOverflow).toBe(false);
  });
});
