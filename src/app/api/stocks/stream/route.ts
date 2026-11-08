/**
 * Server-Sent Events (SSE) endpoint that streams real-time price updates.
 *
 * Client opens a single connection to /api/stocks/stream?tickers=AAPL,MSFT
 * and receives price updates as they happen. The server polls Alpaca/Yahoo
 * every 15s and pushes updates to all connected clients.
 *
 * This is more efficient than WebSockets for one-way push and uses standard
 * HTTP — works through proxies, load balancers, and Vercel's serverless
 * infrastructure with proper streaming support.
 */

import { NextRequest } from "next/server";
import { fetchAlpacaSnapshots, fetchYahooQuote, hasAlpacaCredentials } from "@/lib/services/market-api";
import type { NormalizedQuote } from "@/lib/services/market-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Subscriber {
  tickers: Set<string>;
  controller: ReadableStreamDefaultController<Uint8Array>;
}

const subscribers = new Set<Subscriber>();
const encoder = new TextEncoder();

// Periodically fetch latest prices and broadcast to subscribers
let pollInterval: ReturnType<typeof setInterval> | null = null;
const allTickers: Set<string> = new Set();

async function fetchLatestPrices(): Promise<Map<string, NormalizedQuote>> {
  if (allTickers.size === 0) return new Map();

  const tickers = Array.from(allTickers);
  const results = new Map<string, NormalizedQuote>();

  if (hasAlpacaCredentials()) {
    try {
      const snapshots = await fetchAlpacaSnapshots(tickers);
      snapshots.forEach((quote, symbol) => {
        if (quote.price > 0) results.set(symbol, quote);
      });
    } catch {
      // Fall through to Yahoo
    }
  }

  // Fall back to Yahoo for any tickers that failed (forex, crypto, etc.)
  for (const ticker of tickers) {
    if (!results.has(ticker)) {
      try {
        const yahoo = await fetchYahooQuote(ticker);
        if (yahoo && yahoo.price > 0) results.set(ticker, yahoo);
      } catch {
        // Skip on error
      }
    }
  }

  return results;
}

async function pollAndBroadcast() {
  const prices = await fetchLatestPrices();
  if (prices.size === 0) return;

  const payload = JSON.stringify({
    type: "update",
    prices: Object.fromEntries(prices),
    timestamp: Date.now(),
  });
  const data = encoder.encode(`data: ${payload}\n\n`);

  // Send to all subscribers that care about these tickers
  for (const sub of subscribers) {
    const relevantPrices: Record<string, NormalizedQuote> = {};
    for (const ticker of sub.tickers) {
      const price = prices.get(ticker);
      if (price) relevantPrices[ticker] = price;
    }
    if (Object.keys(relevantPrices).length > 0) {
      try {
        sub.controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: "update",
          prices: relevantPrices,
          timestamp: Date.now(),
        })}\n\n`));
      } catch {
        // Subscriber disconnected; remove from set
        subscribers.delete(sub);
      }
    }
  }
}

function ensurePollingStarted() {
  if (pollInterval) return;
  pollInterval = setInterval(pollAndBroadcast, 15_000);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tickersParam = searchParams.get("tickers") || "";
  const tickers = tickersParam.split(",").map((t) => t.trim().toUpperCase()).filter(Boolean);

  if (tickers.length === 0) {
    return new Response("tickers query parameter required (comma-separated)", { status: 400 });
  }

  // Register tickers for polling
  for (const t of tickers) allTickers.add(t);
  ensurePollingStarted();

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const subscriber: Subscriber = {
        tickers: new Set(tickers),
        controller,
      };
      subscribers.add(subscriber);

      // Send initial connection event
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({
          type: "connected",
          tickers,
          timestamp: Date.now(),
        })}\n\n`)
      );

      // Send a heartbeat every 25 seconds to keep connection alive through proxies
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: heartbeat ${Date.now()}\n\n`));
        } catch {
          clearInterval(heartbeat);
          subscribers.delete(subscriber);
        }
      }, 25_000);

      // Cleanup on close
      request.signal.addEventListener("abort", () => {
        clearInterval(heartbeat);
        subscribers.delete(subscriber);
        try {
          controller.close();
        } catch { /* already closed */ }
      });
    },
    cancel() {
      // Cleanup handled in abort listener
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no", // Disable buffering for nginx
    },
  });
}
