import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  parseAlpacaSnapshot,
  hasAlpacaCredentials,
  fetchAlpacaQuote,
  fetchAlpacaSnapshots,
  fetchYahooQuote,
  fetchAlpacaBars,
  fetchYahooBars,
  type NormalizedQuote,
} from "@/lib/services/market-api";

const originalFetch = global.fetch;

/** Build a minimal Alpaca snapshot payload. */
const snapshot = (overrides: Record<string, unknown> = {}) => ({
  trade: { p: 150.25 },
  dailyBar: { o: 149.5, h: 152.0, l: 148.0, c: 150.25, v: 1_000_000 },
  prevDailyBar: { c: 148.0 },
  ...overrides,
});

const mockJsonResponse = (data: unknown, ok = true, status = 200) =>
  ({
    ok,
    status,
    json: async () => data,
  }) as Response;

describe("parseAlpacaSnapshot", () => {
  it("parses a full snapshot", () => {
    const result = parseAlpacaSnapshot("AAPL", snapshot());
    expect(result).not.toBeNull();
    expect(result!.ticker).toBe("AAPL");
    expect(result!.price).toBe(150.25);
    expect(result!.previousClose).toBe(148.0);
    expect(result!.change).toBeCloseTo(2.25, 2);
    expect(result!.changePercent).toBeCloseTo((2.25 / 148) * 100, 2);
    expect(result!.open).toBe(149.5);
    expect(result!.dayHigh).toBe(152.0);
    expect(result!.dayLow).toBe(148.0);
    expect(result!.volume).toBe(1_000_000);
  });

  it("returns null for a zero price", () => {
    const result = parseAlpacaSnapshot("AAPL", snapshot({ trade: { p: 0 } }));
    expect(result).toBeNull();
  });

  it("returns null when there is neither a trade nor a daily bar", () => {
    const result = parseAlpacaSnapshot("AAPL", snapshot({ trade: undefined, dailyBar: undefined }));
    expect(result).toBeNull();
  });

  it("falls back to dailyBar close when trade is missing", () => {
    const result = parseAlpacaSnapshot(
      "AAPL",
      snapshot({ trade: undefined, dailyBar: { o: 1, h: 2, l: 0.5, c: 1.5, v: 10 } })
    );
    expect(result!.price).toBe(1.5);
  });

  it("handles a missing prevDailyBar", () => {
    const result = parseAlpacaSnapshot(
      "AAPL",
      snapshot({ prevDailyBar: undefined })
    );
    expect(result).not.toBeNull();
    expect(result!.previousClose).toBeCloseTo(150.25, 2);
  });

  it("rounds values to 2 decimals", () => {
    const result = parseAlpacaSnapshot(
      "AAPL",
      snapshot({ trade: { p: 150.256789 } })
    );
    expect(result!.price).toBe(150.26);
  });

  it("uses the ticker passed in", () => {
    const result = parseAlpacaSnapshot("MSFT", snapshot());
    expect(result!.ticker).toBe("MSFT");
  });
});

describe("hasAlpacaCredentials", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns false when credentials are missing", () => {
    vi.stubEnv("ALPACA_API_KEY", "");
    vi.stubEnv("ALPACA_SECRET_KEY", "");
    expect(hasAlpacaCredentials()).toBe(false);
  });

  it("returns true when both credentials are set", () => {
    vi.stubEnv("ALPACA_API_KEY", "key");
    vi.stubEnv("ALPACA_SECRET_KEY", "secret");
    expect(hasAlpacaCredentials()).toBe(true);
  });

  it("returns false when only one credential is set", () => {
    vi.stubEnv("ALPACA_API_KEY", "key");
    vi.stubEnv("ALPACA_SECRET_KEY", "");
    expect(hasAlpacaCredentials()).toBe(false);
  });
});

describe("fetchAlpacaQuote", () => {
  beforeEach(() => {
    vi.stubEnv("ALPACA_API_KEY", "test-key");
    vi.stubEnv("ALPACA_SECRET_KEY", "test-secret");
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    global.fetch = originalFetch;
  });

  it("returns a parsed quote on success", async () => {
    global.fetch = vi.fn().mockResolvedValue(mockJsonResponse(snapshot()));
    const result = await fetchAlpacaQuote("AAPL");
    expect(result?.price).toBe(150.25);
  });

  it("returns null on a non-ok response", async () => {
    global.fetch = vi.fn().mockResolvedValue(mockJsonResponse({}, false, 404));
    expect(await fetchAlpacaQuote("AAPL")).toBeNull();
  });

  it("returns null when the request throws", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("network"));
    expect(await fetchAlpacaQuote("AAPL")).toBeNull();
  });

  it("calls the Alpaca snapshot endpoint", async () => {
    global.fetch = vi.fn().mockResolvedValue(mockJsonResponse(snapshot()));
    await fetchAlpacaQuote("AAPL");
    const url = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(url).toContain("/v2/stocks/AAPL/snapshot");
  });
});

describe("fetchAlpacaSnapshots", () => {
  beforeEach(() => {
    vi.stubEnv("ALPACA_API_KEY", "test-key");
    vi.stubEnv("ALPACA_SECRET_KEY", "test-secret");
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    global.fetch = originalFetch;
  });

  it("returns an empty map for an empty ticker list", async () => {
    expect((await fetchAlpacaSnapshots([])).size).toBe(0);
  });

  it("parses multiple snapshots", async () => {
    global.fetch = vi.fn().mockResolvedValue(
      mockJsonResponse({
        AAPL: snapshot(),
        MSFT: snapshot({ trade: { p: 300.5 } }),
      })
    );
    const result = await fetchAlpacaSnapshots(["AAPL", "MSFT"]);
    expect(result.size).toBe(2);
    expect(result.get("MSFT")!.price).toBe(300.5);
  });

  it("omits tickers with invalid snapshots", async () => {
    global.fetch = vi.fn().mockResolvedValue(
      mockJsonResponse({
        AAPL: snapshot(),
        BAD: snapshot({ trade: { p: 0 } }),
      })
    );
    const result = await fetchAlpacaSnapshots(["AAPL", "BAD"]);
    expect(result.size).toBe(1);
    expect(result.has("BAD")).toBe(false);
  });

  it("returns an empty map on failure", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("boom"));
    expect((await fetchAlpacaSnapshots(["AAPL"])).size).toBe(0);
  });

  it("joins tickers into the query string", async () => {
    global.fetch = vi.fn().mockResolvedValue(mockJsonResponse({}));
    await fetchAlpacaSnapshots(["AAPL", "MSFT"]);
    const url = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(url).toContain("symbols=AAPL,MSFT");
  });
});

describe("fetchYahooQuote", () => {
  afterEach(() => {
    global.fetch = originalFetch;
  });

  const yahooChart = (meta: Record<string, unknown>) => ({
    chart: {
      result: [{ meta }],
      error: null,
    },
  });

  it("parses a valid Yahoo response", async () => {
    global.fetch = vi.fn().mockResolvedValue(
      mockJsonResponse(
        yahooChart({
          symbol: "AAPL",
          shortName: "Apple Inc.",
          regularMarketPrice: 175.5,
          chartPreviousClose: 173.0,
          regularMarketOpen: 174.0,
          regularMarketDayHigh: 177.0,
          regularMarketDayLow: 172.5,
          regularMarketVolume: 50_000_000,
        })
      )
    );
    const result = await fetchYahooQuote("AAPL");
    expect(result).not.toBeNull();
    expect(result!.ticker).toBe("AAPL");
    expect(result!.price).toBe(175.5);
    expect(result!.previousClose).toBe(173.0);
    expect(result!.change).toBeCloseTo(2.5, 2);
  });

  it("returns null on a non-ok response", async () => {
    global.fetch = vi.fn().mockResolvedValue(mockJsonResponse({}, false, 500));
    expect(await fetchYahooQuote("AAPL")).toBeNull();
  });

  it("returns null when the chart has no result", async () => {
    global.fetch = vi.fn().mockResolvedValue(
      mockJsonResponse({ chart: { result: null, error: null } })
    );
    expect(await fetchYahooQuote("AAPL")).toBeNull();
  });

  it("returns null when the request throws", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("network"));
    expect(await fetchYahooQuote("AAPL")).toBeNull();
  });

  it("url-encodes the ticker", async () => {
    global.fetch = vi.fn().mockResolvedValue(mockJsonResponse(yahooChart({})));
    await fetchYahooQuote("BRK.B");
    const url = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(url).toContain("BRK.B");
  });
});

describe("fetchAlpacaBars", () => {
  beforeEach(() => {
    vi.stubEnv("ALPACA_API_KEY", "test-key");
    vi.stubEnv("ALPACA_SECRET_KEY", "test-secret");
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    global.fetch = originalFetch;
  });

  it("maps bars into the normalized shape", async () => {
    global.fetch = vi.fn().mockResolvedValue(
      mockJsonResponse({
        bars: [
          { t: "2024-01-02T05:00:00Z", o: 1, h: 2, l: 0.5, c: 1.5, v: 100 },
        ],
      })
    );
    const bars = await fetchAlpacaBars("AAPL", "1Day", "2024-01-01");
    expect(bars).toHaveLength(1);
    expect(bars[0].date).toBe("2024-01-02");
    expect(bars[0].close).toBe(1.5);
  });

  it("returns an empty array on failure", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("boom"));
    expect(await fetchAlpacaBars("AAPL", "1Day", "2024-01-01")).toEqual([]);
  });

  it("returns an empty array when there are no bars", async () => {
    global.fetch = vi.fn().mockResolvedValue(mockJsonResponse({ bars: [] }));
    expect(await fetchAlpacaBars("AAPL", "1Day", "2024-01-01")).toEqual([]);
  });
});

describe("fetchYahooBars", () => {
  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("maps Yahoo bars into the normalized shape", async () => {
    global.fetch = vi.fn().mockResolvedValue(
      mockJsonResponse({
        chart: {
          result: [
            {
              timestamp: [1704153600],
              indicators: {
                quote: [
                  {
                    open: [1],
                    high: [2],
                    low: [0.5],
                    close: [1.5],
                    volume: [100],
                  },
                ],
              },
            },
          ],
        },
      })
    );
    const bars = await fetchYahooBars("AAPL", "1mo");
    expect(bars).toHaveLength(1);
    expect(bars[0].close).toBe(1.5);
    expect(bars[0].date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("skips bars with null values", async () => {
    global.fetch = vi.fn().mockResolvedValue(
      mockJsonResponse({
        chart: {
          result: [
            {
              timestamp: [1704153600, 1704240000],
              indicators: {
                quote: [
                  {
                    open: [1, null],
                    high: [2, 3],
                    low: [0.5, 1],
                    close: [1.5, 2],
                    volume: [100, 200],
                  },
                ],
              },
            },
          ],
        },
      })
    );
    const bars = await fetchYahooBars("AAPL", "1mo");
    expect(bars).toHaveLength(1);
  });

  it("returns an empty array when there is no result", async () => {
    global.fetch = vi.fn().mockResolvedValue(
      mockJsonResponse({ chart: { result: null, error: null } })
    );
    expect(await fetchYahooBars("AAPL", "1mo")).toEqual([]);
  });

  it("returns an empty array when the request throws", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("network"));
    expect(await fetchYahooBars("AAPL", "1mo")).toEqual([]);
  });
});
