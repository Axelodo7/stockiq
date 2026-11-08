import { test, expect } from "@playwright/test";

/**
 * API contract tests for public, unauthenticated endpoints.
 * Verifies the standard response envelope and error handling.
 */

test.describe("GET /api/health", () => {
  test("returns a success envelope", async ({ request }) => {
    const res = await request.get("/api/health");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("success");
    expect(body.success).toBe(true);
  });
});

test.describe("GET /api/stocks", () => {
  test("requires a query parameter", async ({ request }) => {
    const res = await request.get("/api/stocks");
    expect(res.status()).toBeGreaterThanOrEqual(400);
  });

  test("returns an envelope for a valid query", async ({ request }) => {
    const res = await request.get("/api/stocks?q=apple");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("success");
  });
});

test.describe("GET /api/stock-quote", () => {
  test("returns quotes for the requested tickers", async ({ request }) => {
    const res = await request.get("/api/stock-quote?tickers=AAPL,MSFT");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toBeTruthy();
  });

  test("handles a single ticker", async ({ request }) => {
    const res = await request.get("/api/stock-quote?tickers=AAPL");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });
});

test.describe("GET /api/news", () => {
  test("requires a ticker", async ({ request }) => {
    const res = await request.get("/api/news");
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  test("returns a success envelope for a valid ticker", async ({ request }) => {
    const res = await request.get("/api/news?ticker=AAPL");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });
});

test.describe("GET /api/market-indices", () => {
  test("returns a success envelope", async ({ request }) => {
    const res = await request.get("/api/market-indices");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });
});

test.describe("Protected routes reject anonymous access", () => {
  test("GET /api/portfolio returns 401 without a session", async ({ request }) => {
    const res = await request.get("/api/portfolio");
    expect(res.status()).toBe(401);
  });

  test("GET /api/watchlist returns 401 without a session", async ({ request }) => {
    const res = await request.get("/api/watchlist");
    expect(res.status()).toBe(401);
  });

  test("GET /api/alerts returns 401 without a session", async ({ request }) => {
    const res = await request.get("/api/alerts");
    expect(res.status()).toBe(401);
  });

  test("GET /api/user/preferences returns 401 without a session", async ({ request }) => {
    const res = await request.get("/api/user/preferences");
    expect(res.status()).toBe(401);
  });
});

test.describe("Validation", () => {
  test("POST /api/chart-analyze rejects a non-image upload", async ({ request }) => {
    const res = await request.post("/api/chart-analyze", {
      multipart: {
        chart: {
          name: "notes.txt",
          mimeType: "text/plain",
          buffer: Buffer.from("not an image"),
        },
      },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  test("POST /api/chart-analyze rejects a missing file", async ({ request }) => {
    const res = await request.post("/api/chart-analyze", {
      multipart: { ticker: "AAPL" },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  test("POST /api/backtest rejects an invalid ticker", async ({ request }) => {
    // The route uppercases the ticker, so lowercase input is accepted and
    // normalized — invalid characters are what must be rejected.
    const res = await request.post("/api/backtest", {
      data: { ticker: "not a ticker!" },
    });
    expect(res.status()).toBeGreaterThanOrEqual(400);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  test("POST /api/backtest normalizes a lowercase ticker", async ({ request }) => {
    const res = await request.post("/api/backtest", {
      data: { ticker: "aapl" },
    });
    // 200 with an honest "model unavailable" payload, or a 5xx if data is missing.
    // Either way it must NOT be a validation error.
    expect([200, 500, 503]).toContain(res.status());
  });
});
