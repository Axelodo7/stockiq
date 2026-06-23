import type { MarketQuote, OHLCV, Stock } from "@/types";
import { cache, buildCacheKey, getCacheTtl } from "./cache";
import { CACHE_TTL } from "@/lib/constants";
import { sleep, seededRandom } from "@/lib/utils";
import { getStockInfo } from "./market-mock";

const ALPACA_KEY = process.env.ALPACA_API_KEY || "";
const ALPACA_SECRET = process.env.ALPACA_SECRET_KEY || "";
const ALPACA_DATA_BASE = "https://data.alpaca.markets";

function alpacaHeaders() {
  return {
    "APCA-API-KEY-ID": ALPACA_KEY,
    "APCA-API-SECRET-KEY": ALPACA_SECRET,
    Accept: "application/json",
  };
}

class MarketDataService {
  private requestCount = 0;
  private lastReset = Date.now();

  private async rateLimitedFetch(
    url: string,
    headers?: Record<string, string>
  ): Promise<Response> {
    const now = Date.now();
    if (now - this.lastReset > 60_000) {
      this.requestCount = 0;
      this.lastReset = now;
    }
    if (this.requestCount >= 200) {
      await sleep(60_000 - (now - this.lastReset));
      this.requestCount = 0;
      this.lastReset = Date.now();
    }
    this.requestCount++;
    return fetch(url, { headers: headers || alpacaHeaders() });
  }

  private getAlpacaTimeframe(range: string): string {
    const map: Record<string, string> = {
      "1D": "1Day",
      "5D": "1Day",
      "1M": "1Day",
      "3M": "1Day",
      "6M": "1Day",
      "1Y": "1Day",
      "5Y": "1Week",
      MAX: "1Month",
    };
    return map[range] || "1Day";
  }

  private getStartDate(range: string): string {
    const now = new Date();
    const d = new Date(now);
    switch (range) {
      case "1D":
        d.setDate(d.getDate() - 1);
        break;
      case "5D":
        d.setDate(d.getDate() - 7);
        break;
      case "1M":
        d.setMonth(d.getMonth() - 1);
        break;
      case "3M":
        d.setMonth(d.getMonth() - 3);
        break;
      case "6M":
        d.setMonth(d.getMonth() - 6);
        break;
      case "1Y":
        d.setFullYear(d.getFullYear() - 1);
        break;
      case "5Y":
        d.setFullYear(d.getFullYear() - 5);
        break;
      case "MAX":
        d.setFullYear(d.getFullYear() - 16);
        break;
      default:
        d.setFullYear(d.getFullYear() - 1);
    }
    return d.toISOString().split("T")[0];
  }

  async getQuote(ticker: string): Promise<MarketQuote | null> {
    const cacheKey = buildCacheKey("quote", ticker);
    const cached = cache.get<MarketQuote>(cacheKey);
    if (cached) return cached;

    if (!ALPACA_KEY) return this.getMockQuote(ticker);

    try {
      const url = `${ALPACA_DATA_BASE}/v2/stocks/${encodeURIComponent(ticker)}/snapshot`;
      const res = await this.rateLimitedFetch(url);
      if (!res.ok) return null;

      const snap = await res.json();
      if (!snap?.trade) return null;

      const trade = snap.trade;
      const dailyBar = snap.dailyBar;
      const prevDaily = snap.prevDailyBar;
      const price = trade.p ?? 0;
      if (!price) return null;

      const previousClose = prevDaily?.c ?? dailyBar?.c ?? price;
      const change = price - previousClose;
      const changePercent = previousClose > 0 ? (change / previousClose) * 100 : 0;

      const quote: MarketQuote = {
        ticker: ticker.toUpperCase(),
        currentPrice: Math.round(price * 100) / 100,
        change: Math.round(change * 100) / 100,
        changePercent: Math.round(changePercent * 100) / 100,
        open: Math.round((dailyBar?.o ?? price) * 100) / 100,
        high: Math.round((dailyBar?.h ?? price) * 100) / 100,
        low: Math.round((dailyBar?.l ?? price) * 100) / 100,
        volume: dailyBar?.v ?? 0,
        previousClose: Math.round(previousClose * 100) / 100,
        timestamp: Math.floor(Date.now() / 1000),
      };

      cache.set(cacheKey, quote, getCacheTtl("QUOTE"));
      return quote;
    } catch {
      return this.getMockQuote(ticker);
    }
  }

  async getHistoricalData(
    ticker: string,
    range: string = "1y"
  ): Promise<OHLCV[]> {
    const cacheKey = buildCacheKey("history", ticker, range);
    const cached = cache.get<OHLCV[]>(cacheKey);
    if (cached) return cached;

    if (ALPACA_KEY) {
      try {
        const alpacaRange = range.toUpperCase();
        const timeframe = this.getAlpacaTimeframe(alpacaRange);
        const start = this.getStartDate(alpacaRange);

        const url = `${ALPACA_DATA_BASE}/v2/stocks/${encodeURIComponent(
          ticker
        )}/bars?timeframe=${timeframe}&start=${start}&limit=10000&adjustment=split&feed=iex`;
        const res = await this.rateLimitedFetch(url);

        if (res.ok) {
          const data = await res.json();
          if (data.bars && data.bars.length > 0) {
            const ohlcv: OHLCV[] = data.bars.map((bar: { t: string; o: number; h: number; l: number; c: number; v: number }) => ({
              date: bar.t.split("T")[0],
              open: bar.o,
              high: bar.h,
              low: bar.l,
              close: bar.c,
              volume: bar.v,
            }));

            cache.set(cacheKey, ohlcv, getCacheTtl("HISTORICAL"));
            return ohlcv;
          }
        }
      } catch {
        // Fall through to mock
      }
    }

    const mockPrice = getStockInfo(ticker).price;
    if (!mockPrice) return [];
    const ohlcv = this.generateMockHistoricalData(ticker, range, mockPrice);
    cache.set(cacheKey, ohlcv, getCacheTtl("HISTORICAL"));
    return ohlcv;
  }

  async searchStocks(query: string): Promise<Stock[]> {
    const cacheKey = buildCacheKey("search", query);
    const cached = cache.get<Stock[]>(cacheKey);
    if (cached) return cached;

    if (!ALPACA_KEY) return this.getMockStocks(query);

    try {
      const url = `${ALPACA_DATA_BASE}/v1beta1/us/search?symbol=${encodeURIComponent(query)}&limit=20`;
      const res = await this.rateLimitedFetch(url);

      if (res.ok) {
        const data = await res.json();
        const stocks: Stock[] = (data.symbol || [])
          .slice(0, 20)
          .map((item: { symbol: string; name?: string; type?: string; exchange?: string }) => ({
            id: item.symbol,
            ticker: item.symbol,
            companyName: item.name || item.symbol,
            sector: item.type || "Unknown",
            marketCap: null,
            exchange: item.exchange || "NASDAQ",
          }));

        cache.set(cacheKey, stocks, CACHE_TTL.STOCK_LIST);
        return stocks;
      }
    } catch {
      // Fall through to mock
    }

    return this.getMockStocks(query);
  }

  private async getMockQuote(ticker: string): Promise<MarketQuote | null> {
    const mockPrice = getStockInfo(ticker).price;
    if (!mockPrice) return null;
    const change = (Math.random() - 0.5) * 10;
    return {
      ticker: ticker.toUpperCase(),
      currentPrice: mockPrice,
      change,
      changePercent: (change / mockPrice) * 100,
      open: mockPrice - (Math.random() - 0.5) * 5,
      high: mockPrice + Math.random() * 5,
      low: mockPrice - Math.random() * 5,
      volume: Math.floor(Math.random() * 50000000),
      previousClose: mockPrice - change,
      timestamp: Date.now() / 1000,
    };
  }

  private generateMockHistoricalData(
    ticker: string,
    range: string,
    basePrice?: number
  ): OHLCV[] {
    const days: Record<string, number> = {
      "1D": 1,
      "5D": 5,
      "1M": 30,
      "3M": 90,
      "6M": 180,
      "1Y": 365,
      "5Y": 1825,
      MAX: 3650,
    };
    const numDays = days[range] || 365;
    const data: OHLCV[] = [];
    const price = basePrice || getStockInfo(ticker).price;
    if (!price) return data;
    let currentPrice = price;
    const now = new Date();
    const rng = seededRandom(Math.round(price * 1000) + numDays);

    for (let i = numDays; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      if (date.getDay() === 0 || date.getDay() === 6) continue;

      const change = (rng() - 0.48) * currentPrice * 0.03;
      const open = currentPrice;
      const close = currentPrice + change;
      const high = Math.max(open, close) + rng() * 3;
      const low = Math.min(open, close) - rng() * 3;

      data.push({
        date: date.toISOString().split("T")[0],
        open: parseFloat(open.toFixed(2)),
        high: parseFloat(high.toFixed(2)),
        low: parseFloat(low.toFixed(2)),
        close: parseFloat(close.toFixed(2)),
        volume: Math.floor(rng() * 50000000),
      });
      currentPrice = close;
    }

    if (data.length > 0) {
      const lastClose = data[data.length - 1].close;
      if (Math.abs(lastClose - price) > 0.01) {
        const factor = price / lastClose;
        for (const bar of data) {
          bar.open = parseFloat((bar.open * factor).toFixed(2));
          bar.high = parseFloat((bar.high * factor).toFixed(2));
          bar.low = parseFloat((bar.low * factor).toFixed(2));
          bar.close = parseFloat((bar.close * factor).toFixed(2));
        }
      }
    }

    return data;
  }

  private getMockStocks(query: string): Stock[] {
    const allStocks: Stock[] = [
      { id: "AAPL", ticker: "AAPL", companyName: "Apple Inc.", sector: "Technology", marketCap: 3000000000000, exchange: "NASDAQ" },
      { id: "GOOGL", ticker: "GOOGL", companyName: "Alphabet Inc.", sector: "Technology", marketCap: 2100000000000, exchange: "NASDAQ" },
      { id: "MSFT", ticker: "MSFT", companyName: "Microsoft Corporation", sector: "Technology", marketCap: 3100000000000, exchange: "NASDAQ" },
      { id: "AMZN", ticker: "AMZN", companyName: "Amazon.com Inc.", sector: "Consumer Cyclical", marketCap: 1900000000000, exchange: "NASDAQ" },
      { id: "TSLA", ticker: "TSLA", companyName: "Tesla Inc.", sector: "Consumer Cyclical", marketCap: 560000000000, exchange: "NASDAQ" },
      { id: "NVDA", ticker: "NVDA", companyName: "NVIDIA Corporation", sector: "Technology", marketCap: 3200000000000, exchange: "NASDAQ" },
      { id: "META", ticker: "META", companyName: "Meta Platforms Inc.", sector: "Communication Services", marketCap: 1300000000000, exchange: "NASDAQ" },
      { id: "JPM", ticker: "JPM", companyName: "JPMorgan Chase & Co.", sector: "Financial Services", marketCap: 570000000000, exchange: "NYSE" },
      { id: "V", ticker: "V", companyName: "Visa Inc.", sector: "Financial Services", marketCap: 550000000000, exchange: "NYSE" },
      { id: "JNJ", ticker: "JNJ", companyName: "Johnson & Johnson", sector: "Healthcare", marketCap: 390000000000, exchange: "NYSE" },
    ];
    return allStocks.filter(
      (s) =>
        s.ticker.toLowerCase().includes(query.toLowerCase()) ||
        s.companyName.toLowerCase().includes(query.toLowerCase())
    );
  }
}

export const marketDataService = new MarketDataService();

const CACHE_TTL_KEYS = CACHE_TTL;
export { CACHE_TTL_KEYS as CACHE_TTL_CONST };
