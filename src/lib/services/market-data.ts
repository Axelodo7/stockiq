import type { MarketQuote, OHLCV, Stock } from "@/types";
import { cache, buildCacheKey, getCacheTtl } from "./cache";
import { CACHE_TTL } from "@/lib/constants";
import { sleep, seededRandom } from "@/lib/utils";
import { getStockInfo } from "./market-mock";

const FINNHUB_BASE = "https://finnhub.io/api/v1";
const ALPHA_VANTAGE_BASE = "https://www.alphavantage.co/query";

class MarketDataService {
  private finnhubKey = process.env.FINNHUB_API_KEY || "";
  private alphaKey = process.env.ALPHA_VANTAGE_API_KEY || "";
  private requestCount = 0;
  private lastReset = Date.now();

  private async rateLimitedFetch(url: string): Promise<Response> {
    const now = Date.now();
    if (now - this.lastReset > 60_000) {
      this.requestCount = 0;
      this.lastReset = now;
    }
    if (this.requestCount >= 55) {
      await sleep(60_000 - (now - this.lastReset));
      this.requestCount = 0;
      this.lastReset = Date.now();
    }
    this.requestCount++;
    return fetch(url);
  }

  async getQuote(ticker: string): Promise<MarketQuote | null> {
    const cacheKey = buildCacheKey("quote", ticker);
    const cached = cache.get<MarketQuote>(cacheKey);
    if (cached) return cached;

    if (!this.finnhubKey) return this.getMockQuote(ticker);

    try {
      const res = await this.rateLimitedFetch(
        `${FINNHUB_BASE}/quote?symbol=${ticker}&token=${this.finnhubKey}`
      );
      if (!res.ok) return null;
      const data = await res.json();

      if (data.error) return null;

      const quote: MarketQuote = {
        ticker,
        currentPrice: data.c,
        change: data.d,
        changePercent: data.dp,
        open: data.o,
        high: data.h,
        low: data.l,
        volume: data.v,
        previousClose: data.pc,
        timestamp: data.t,
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

    // Try Alpha Vantage first
    if (this.alphaKey) {
      try {
        const functionMap: Record<string, string> = {
          "1M": "TIME_SERIES_MONTHLY",
          "3M": "TIME_SERIES_MONTHLY",
          "6M": "TIME_SERIES_MONTHLY",
          "1Y": "TIME_SERIES_MONTHLY",
          "5Y": "TIME_SERIES_MONTHLY",
          MAX: "TIME_SERIES_MONTHLY",
        };

        const fn = functionMap[range] || "TIME_SERIES_DAILY";

        const res = await this.rateLimitedFetch(
          `${ALPHA_VANTAGE_BASE}?function=${fn}&symbol=${ticker}&apikey=${this.alphaKey}&outputsize=compact`
        );
        if (res.ok) {
          const data = await res.json();
          const timeSeries = data["Time Series (Monthly)"] || data["Time Series (Daily)"];
          if (timeSeries) {
            const ohlcv: OHLCV[] = Object.entries(timeSeries)
              .map(([date, values]) => {
                const v = values as Record<string, string>;
                return {
                  date,
                  open: parseFloat(v["1. open"]),
                  high: parseFloat(v["2. high"]),
                  low: parseFloat(v["3. low"]),
                  close: parseFloat(v["4. close"]),
                  volume: parseInt(v["5. volume"]),
                };
              })
              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

            cache.set(cacheKey, ohlcv, getCacheTtl("HISTORICAL"));
            return ohlcv;
          }
        }
      } catch {
        // Fall through to Yahoo Finance
      }
    }

    // Try Yahoo Finance for real price
    const realPrice = await this.fetchYahooPrice(ticker);
    const basePrice = realPrice ?? getStockInfo(ticker).price;
    const ohlcv = this.generateMockHistoricalData(ticker, range, basePrice);
    cache.set(cacheKey, ohlcv, getCacheTtl("HISTORICAL"));
    return ohlcv;
  }

  private async fetchYahooPrice(ticker: string): Promise<number | null> {
    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=1d`;
      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) return null;
      const data = await res.json();
      const price = data?.chart?.result?.[0]?.meta?.regularMarketPrice;
      return typeof price === "number" && price > 0 ? price : null;
    } catch {
      return null;
    }
  }

  async searchStocks(query: string): Promise<Stock[]> {
    const cacheKey = buildCacheKey("search", query);
    const cached = cache.get<Stock[]>(cacheKey);
    if (cached) return cached;

    if (!this.finnhubKey) return this.getMockStocks(query);

    try {
      const res = await this.rateLimitedFetch(
        `${FINNHUB_BASE}/search?q=${query}&token=${this.finnhubKey}`
      );
      if (!res.ok) return [];
      const data = await res.json();

      const stocks: Stock[] = (data.result || [])
        .slice(0, 20)
        .map((item: { symbol: string; description: string; type: string }) => ({
          id: item.symbol,
          ticker: item.symbol,
          companyName: item.description,
          sector: item.type,
          marketCap: null,
          exchange: "NASDAQ",
        }));

      cache.set(cacheKey, stocks, CACHE_TTL.STOCK_LIST);
      return stocks;
    } catch {
      return this.getMockStocks(query);
    }
  }

  private async getMockQuote(ticker: string): Promise<MarketQuote> {
    const realPrice = await this.fetchYahooPrice(ticker);
    const price = realPrice ?? getStockInfo(ticker).price;
    const change = realPrice ? 0 : (Math.random() - 0.5) * 10;
    return {
      ticker: ticker.toUpperCase(),
      currentPrice: price,
      change,
      changePercent: (change / price) * 100,
      open: price - (Math.random() - 0.5) * 5,
      high: price + Math.random() * 5,
      low: price - Math.random() * 5,
      volume: Math.floor(Math.random() * 50000000),
      previousClose: price - change,
      timestamp: Date.now() / 1000,
    };
  }

  private generateMockHistoricalData(ticker: string, range: string, basePrice?: number): OHLCV[] {
    const days = { "1D": 1, "5D": 5, "1M": 30, "3M": 90, "6M": 180, "1Y": 365, "5Y": 1825, MAX: 3650 };
    const numDays = days[range as keyof typeof days] || 365;
    const data: OHLCV[] = [];
    const price = basePrice ?? getStockInfo(ticker).price;
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

    // Scale so the last bar ends at price
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
