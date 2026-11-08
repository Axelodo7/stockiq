import { describe, it, expect } from "vitest";
import {
  tickerSchema,
  paginationSchema,
  createPortfolioSchema,
  updatePortfolioSchema,
  createPositionSchema,
  updatePositionSchema,
  createTransactionSchema,
  createWatchlistSchema,
  updateWatchlistSchema,
  addWatchlistItemSchema,
  createAlertSchema,
  updateAlertSchema,
  predictionGenerateSchema,
  trainModelSchema,
  backtestSchema,
  historicalDataQuerySchema,
} from "@/lib/validation/schemas";

describe("tickerSchema", () => {
  it("accepts uppercase tickers", () => {
    expect(tickerSchema.parse("AAPL")).toBe("AAPL");
    expect(tickerSchema.parse("BRK.B")).toBe("BRK.B");
  });

  it("rejects lowercase", () => {
    expect(tickerSchema.safeParse("aapl").success).toBe(false);
  });

  it("rejects empty string", () => {
    expect(tickerSchema.safeParse("").success).toBe(false);
  });

  it("rejects strings with digits", () => {
    expect(tickerSchema.safeParse("AAPL2").success).toBe(false);
  });

  it("rejects strings longer than 10", () => {
    expect(tickerSchema.safeParse("A".repeat(11)).success).toBe(false);
  });
});

describe("paginationSchema", () => {
  it("defaults page to 1 and limit to 20", () => {
    const result = paginationSchema.parse({});
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
  });

  it("coerces numeric strings", () => {
    const result = paginationSchema.parse({ page: "3", limit: "50" });
    expect(result.page).toBe(3);
    expect(result.limit).toBe(50);
  });

  it("rejects page below 1", () => {
    expect(paginationSchema.safeParse({ page: 0 }).success).toBe(false);
  });

  it("rejects limit above 100", () => {
    expect(paginationSchema.safeParse({ limit: 101 }).success).toBe(false);
  });

  it("rejects fractional pages", () => {
    expect(paginationSchema.safeParse({ page: 1.5 }).success).toBe(false);
  });
});

describe("createPortfolioSchema", () => {
  it("accepts a name", () => {
    const result = createPortfolioSchema.parse({ name: "Growth" });
    expect(result.name).toBe("Growth");
  });

  it("accepts an optional description", () => {
    const result = createPortfolioSchema.parse({ name: "Growth", description: "Long-term" });
    expect(result.description).toBe("Long-term");
  });

  it("rejects an empty name", () => {
    expect(createPortfolioSchema.safeParse({ name: "" }).success).toBe(false);
  });

  it("rejects a name over 100 chars", () => {
    expect(createPortfolioSchema.safeParse({ name: "x".repeat(101) }).success).toBe(false);
  });

  it("rejects a description over 500 chars", () => {
    expect(
      createPortfolioSchema.safeParse({ name: "ok", description: "x".repeat(501) }).success
    ).toBe(false);
  });
});

describe("updatePortfolioSchema", () => {
  it("accepts an empty object (all optional)", () => {
    expect(updatePortfolioSchema.safeParse({}).success).toBe(true);
  });

  it("rejects a null name", () => {
    expect(updatePortfolioSchema.safeParse({ name: null }).success).toBe(false);
  });
});

describe("createPositionSchema", () => {
  it("accepts valid input", () => {
    const result = createPositionSchema.parse({
      stockTicker: "AAPL",
      shares: 10,
      avgCost: 150.5,
    });
    expect(result.shares).toBe(10);
    expect(result.avgCost).toBe(150.5);
  });

  it("rejects zero shares", () => {
    expect(
      createPositionSchema.safeParse({ stockTicker: "AAPL", shares: 0, avgCost: 100 }).success
    ).toBe(false);
  });

  it("rejects negative shares", () => {
    expect(
      createPositionSchema.safeParse({ stockTicker: "AAPL", shares: -5, avgCost: 100 }).success
    ).toBe(false);
  });

  it("rejects zero cost", () => {
    expect(
      createPositionSchema.safeParse({ stockTicker: "AAPL", shares: 5, avgCost: 0 }).success
    ).toBe(false);
  });

  it("rejects a lowercase ticker", () => {
    expect(
      createPositionSchema.safeParse({ stockTicker: "aapl", shares: 5, avgCost: 100 }).success
    ).toBe(false);
  });

  it("rejects a missing ticker", () => {
    expect(createPositionSchema.safeParse({ shares: 5, avgCost: 100 }).success).toBe(false);
  });
});

describe("updatePositionSchema", () => {
  it("accepts partial updates", () => {
    const result = updatePositionSchema.parse({ shares: 20 });
    expect(result.shares).toBe(20);
    expect(result.avgCost).toBeUndefined();
  });

  it("rejects negative shares", () => {
    expect(updatePositionSchema.safeParse({ shares: -1 }).success).toBe(false);
  });
});

describe("createTransactionSchema", () => {
  it("accepts a BUY transaction", () => {
    const result = createTransactionSchema.parse({
      stockTicker: "AAPL",
      type: "BUY",
      shares: 10,
      price: 150,
    });
    expect(result.type).toBe("BUY");
    expect(result.fees).toBe(0);
  });

  it("accepts SELL and DIVIDEND", () => {
    expect(
      createTransactionSchema.safeParse({
        stockTicker: "AAPL",
        type: "SELL",
        shares: 1,
        price: 1,
      }).success
    ).toBe(true);
    expect(
      createTransactionSchema.safeParse({
        stockTicker: "AAPL",
        type: "DIVIDEND",
        shares: 1,
        price: 1,
      }).success
    ).toBe(true);
  });

  it("rejects an invalid type", () => {
    expect(
      createTransactionSchema.safeParse({
        stockTicker: "AAPL",
        type: "TRANSFER",
        shares: 1,
        price: 1,
      }).success
    ).toBe(false);
  });

  it("rejects negative fees", () => {
    expect(
      createTransactionSchema.safeParse({
        stockTicker: "AAPL",
        type: "BUY",
        shares: 1,
        price: 1,
        fees: -1,
      }).success
    ).toBe(false);
  });
});

describe("createWatchlistSchema", () => {
  it("accepts a name", () => {
    expect(createWatchlistSchema.parse({ name: "Tech" }).name).toBe("Tech");
  });

  it("rejects an empty name", () => {
    expect(createWatchlistSchema.safeParse({ name: "" }).success).toBe(false);
  });
});

describe("updateWatchlistSchema", () => {
  it("accepts an empty object", () => {
    expect(updateWatchlistSchema.safeParse({}).success).toBe(true);
  });
});

describe("addWatchlistItemSchema", () => {
  it("accepts a ticker", () => {
    expect(addWatchlistItemSchema.parse({ stockTicker: "NVDA" }).stockTicker).toBe("NVDA");
  });

  it("rejects a lowercase ticker", () => {
    expect(addWatchlistItemSchema.safeParse({ stockTicker: "nvda" }).success).toBe(false);
  });
});

describe("createAlertSchema", () => {
  it("accepts a PRICE/ABOVE alert", () => {
    const result = createAlertSchema.parse({
      stockTicker: "AAPL",
      type: "PRICE",
      condition: "ABOVE",
      targetValue: 200,
    });
    expect(result.type).toBe("PRICE");
    expect(result.condition).toBe("ABOVE");
  });

  it("accepts a negative target (for PCT_DOWN)", () => {
    expect(
      createAlertSchema.safeParse({
        stockTicker: "AAPL",
        type: "PERCENT_CHANGE",
        condition: "PCT_DOWN",
        targetValue: -5,
      }).success
    ).toBe(true);
  });

  it("rejects an invalid type", () => {
    expect(
      createAlertSchema.safeParse({
        stockTicker: "AAPL",
        type: "SOMETHING",
        condition: "ABOVE",
        targetValue: 1,
      }).success
    ).toBe(false);
  });

  it("rejects an invalid condition", () => {
    expect(
      createAlertSchema.safeParse({
        stockTicker: "AAPL",
        type: "PRICE",
        condition: "EQUALS",
        targetValue: 1,
      }).success
    ).toBe(false);
  });
});

describe("updateAlertSchema", () => {
  it("accepts isActive toggle", () => {
    expect(updateAlertSchema.parse({ isActive: false }).isActive).toBe(false);
  });

  it("accepts targetValue update", () => {
    expect(updateAlertSchema.parse({ targetValue: 250 }).targetValue).toBe(250);
  });

  it("rejects a non-boolean isActive", () => {
    expect(updateAlertSchema.safeParse({ isActive: "yes" }).success).toBe(false);
  });
});

describe("predictionGenerateSchema", () => {
  it("accepts a ticker", () => {
    expect(predictionGenerateSchema.parse({ ticker: "AAPL" }).ticker).toBe("AAPL");
  });

  it("rejects a lowercase ticker", () => {
    expect(predictionGenerateSchema.safeParse({ ticker: "aapl" }).success).toBe(false);
  });
});

describe("trainModelSchema", () => {
  it("defaults model_type to XGBOOST", () => {
    const result = trainModelSchema.parse({ ticker: "AAPL" });
    expect(result.model_type).toBe("XGBOOST");
  });

  it("accepts each known model type", () => {
    for (const mt of ["LSTM", "TRANSFORMER", "XGBOOST", "RANDOM_FOREST", "ENSEMBLE"]) {
      expect(trainModelSchema.safeParse({ ticker: "AAPL", model_type: mt }).success).toBe(true);
    }
  });

  it("rejects an unknown model type", () => {
    expect(trainModelSchema.safeParse({ ticker: "AAPL", model_type: "RNN" }).success).toBe(false);
  });
});

describe("backtestSchema", () => {
  it("defaults initial_capital to 10000", () => {
    expect(backtestSchema.parse({ ticker: "AAPL" }).initial_capital).toBe(10000);
  });

  it("defaults model_type to ENSEMBLE", () => {
    expect(backtestSchema.parse({ ticker: "AAPL" }).model_type).toBe("ENSEMBLE");
  });

  it("rejects a negative initial capital", () => {
    expect(backtestSchema.safeParse({ ticker: "AAPL", initial_capital: -1 }).success).toBe(false);
  });
});

describe("historicalDataQuerySchema", () => {
  it("defaults range to 1Y", () => {
    expect(historicalDataQuerySchema.parse({ ticker: "AAPL" }).range).toBe("1Y");
  });

  it("accepts each known range", () => {
    for (const r of ["1D", "5D", "1M", "3M", "6M", "1Y", "5Y", "MAX"]) {
      expect(historicalDataQuerySchema.safeParse({ ticker: "AAPL", range: r }).success).toBe(true);
    }
  });

  it("rejects an invalid range", () => {
    expect(historicalDataQuerySchema.safeParse({ ticker: "AAPL", range: "10Y" }).success).toBe(false);
  });

  it("rejects an invalid interval", () => {
    expect(
      historicalDataQuerySchema.safeParse({ ticker: "AAPL", interval: "1m" }).success
    ).toBe(false);
  });
});
