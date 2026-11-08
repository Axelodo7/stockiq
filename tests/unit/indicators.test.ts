import { describe, it, expect } from "vitest";
import {
  SMA,
  EMA,
  RSI,
  MACD,
  BollingerBands,
  VWAP,
  ATR,
  Stochastic,
} from "@/lib/engines/indicators";
import type { OHLCV } from "@/types";

/** Flat series of a given length. */
const flat = (n: number, value = 100): number[] => Array(n).fill(value);

/** Linear ramp from `start` to `end`. */
const ramp = (n: number, start = 100, end = 200): number[] =>
  Array.from({ length: n }, (_, i) => start + ((end - start) * i) / (n - 1));

describe("SMA (Simple Moving Average)", () => {
  it("returns null for the warm-up period", () => {
    const result = SMA([1, 2, 3, 4, 5], 3);
    expect(result[0]).toBeNull();
    expect(result[1]).toBeNull();
    expect(result[2]).toBe(2);
  });

  it("computes the correct rolling average", () => {
    const result = SMA([10, 20, 30, 40, 50], 3);
    expect(result[2]).toBe(20);
    expect(result[3]).toBe(30);
    expect(result[4]).toBe(40);
  });

  it("returns all nulls when the series is shorter than the period", () => {
    const result = SMA([1, 2], 5);
    expect(result.every((v) => v === null)).toBe(true);
  });

  it("returns an empty array for empty input", () => {
    expect(SMA([], 5)).toEqual([]);
  });

  it("handles a period of 1 by returning the input", () => {
    const result = SMA([5, 6, 7], 1);
    expect(result).toEqual([5, 6, 7]);
  });

  it("preserves the array length", () => {
    const input = flat(50);
    expect(SMA(input, 20)).toHaveLength(50);
  });
});

describe("EMA (Exponential Moving Average)", () => {
  it("returns null for the warm-up period", () => {
    const result = EMA([1, 2, 3, 4, 5], 3);
    expect(result[0]).toBeNull();
    expect(result[1]).toBeNull();
  });

  it("seeds with the SMA of the first `period` values", () => {
    const result = EMA([10, 20, 30, 40], 3);
    // SMA of first 3 = 20
    expect(result[2]).toBeCloseTo(20, 5);
  });

  it("weights recent prices more heavily than SMA", () => {
    const prices = [10, 10, 10, 10, 100];
    const ema = EMA(prices, 3);
    const sma = SMA(prices, 3);
    // EMA should be closer to the jump than SMA
    expect(ema[4]!).toBeGreaterThan(sma[4]!);
  });

  it("converges to a constant series", () => {
    const result = EMA(flat(100, 50), 10);
    expect(result[99]).toBeCloseTo(50, 5);
  });

  it("returns all nulls for a too-short series", () => {
    expect(EMA([1, 2], 5).every((v) => v === null)).toBe(true);
  });

  it("preserves the array length", () => {
    expect(EMA(flat(30), 10)).toHaveLength(30);
  });
});

describe("RSI (Relative Strength Index)", () => {
  it("returns 100 when there are no losses", () => {
    const result = RSI(ramp(30, 100, 200), 14);
    expect(result[29]).toBe(100);
  });

  it("returns 0 when there are no gains", () => {
    const result = RSI(ramp(30, 200, 100), 14);
    expect(result[29]).toBe(0);
  });

  it("returns 50 for a flat series", () => {
    const result = RSI(flat(30, 100), 14);
    expect(result[29]).toBe(50);
  });

  it("stays within the 0-100 range", () => {
    const prices = Array.from({ length: 60 }, (_, i) => 100 + Math.sin(i / 3) * 20);
    const result = RSI(prices, 14);
    for (const value of result) {
      if (value === null) continue;
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(100);
    }
  });

  it("returns null during warm-up", () => {
    const result = RSI(ramp(30), 14);
    expect(result[0]).toBeNull();
    expect(result[13]).toBeNull();
    expect(result[14]).not.toBeNull();
  });

  it("is higher after a rally than after a decline", () => {
    const rally = RSI(ramp(40, 100, 180), 14);
    const decline = RSI(ramp(40, 180, 100), 14);
    expect(rally[39]!).toBeGreaterThan(decline[39]!);
  });

  it("preserves the array length", () => {
    expect(RSI(ramp(50), 14)).toHaveLength(50);
  });
});

describe("MACD", () => {
  it("returns macd, signal, and histogram arrays of matching length", () => {
    const prices = ramp(100);
    const result = MACD(prices);
    expect(result.macd).toHaveLength(100);
    expect(result.signal).toHaveLength(100);
    expect(result.histogram).toHaveLength(100);
  });

  it("produces a positive macd line during an uptrend", () => {
    const result = MACD(ramp(100, 100, 300));
    expect(result.macd[99]).toBeGreaterThan(0);
  });

  it("produces a negative macd line during a downtrend", () => {
    const result = MACD(ramp(100, 300, 100));
    expect(result.macd[99]).toBeLessThan(0);
  });

  it("keeps histogram equal to macd minus signal", () => {
    const result = MACD(ramp(80));
    for (let i = 0; i < result.macd.length; i++) {
      expect(result.histogram[i]).toBeCloseTo(result.macd[i] - result.signal[i], 6);
    }
  });

  it("crosses bullish when price rises from flat", () => {
    const result = MACD([...flat(40, 100), ...ramp(40, 100, 200)]);
    // Histogram should eventually turn positive
    expect(result.histogram[result.histogram.length - 1]).toBeGreaterThan(0);
  });

  it("handles empty input without throwing", () => {
    expect(() => MACD([])).not.toThrow();
  });
});

describe("BollingerBands", () => {
  it("returns upper, middle, and lower arrays of matching length", () => {
    const result = BollingerBands(ramp(50));
    expect(result.upper).toHaveLength(50);
    expect(result.middle).toHaveLength(50);
    expect(result.lower).toHaveLength(50);
  });

  it("places the middle band at the SMA", () => {
    const prices = [10, 12, 14, 16, 18, 20, 22, 24];
    const result = BollingerBands(prices, 8);
    const expected = prices.reduce((a, b) => a + b, 0) / 8;
    expect(result.middle[7]).toBeCloseTo(expected, 5);
  });

  it("has the upper band above the lower band", () => {
    const result = BollingerBands(ramp(50));
    for (let i = 0; i < 50; i++) {
      expect(result.upper[i]).toBeGreaterThanOrEqual(result.lower[i]);
    }
  });

  it("collapses the bands on a flat series", () => {
    const result = BollingerBands(flat(30, 100), 20);
    expect(result.upper[29]).toBeCloseTo(100, 5);
    expect(result.lower[29]).toBeCloseTo(100, 5);
  });

  it("widens the bands on a volatile series", () => {
    const calm = BollingerBands(flat(40, 100), 20);
    const wild = BollingerBands(
      Array.from({ length: 40 }, (_, i) => 100 + (i % 2 === 0 ? 20 : -20)),
      20
    );
    const calmWidth = calm.upper[39]! - calm.lower[39]!;
    const wildWidth = wild.upper[39]! - wild.lower[39]!;
    expect(wildWidth).toBeGreaterThan(calmWidth);
  });

  it("returns zeros during warm-up", () => {
    const result = BollingerBands(ramp(10), 20);
    expect(result.upper[0]).toBe(0);
    expect(result.lower[0]).toBe(0);
  });
});

describe("VWAP", () => {
  const candles: OHLCV[] = [
    { date: "2024-01-01", open: 10, high: 12, low: 8, close: 11, volume: 100 },
    { date: "2024-01-02", open: 11, high: 13, low: 9, close: 12, volume: 200 },
  ];

  it("returns null when volume is zero", () => {
    const result = VWAP([{ ...candles[0], volume: 0 }]);
    expect(result[0]).toBeNull();
  });

  it("computes a cumulative volume-weighted average", () => {
    const result = VWAP(candles);
    // Typical prices: (12+8+11)/3 = 10.333, (13+9+12)/3 = 11.333
    const expected = (10.3333 * 100 + 11.3333 * 200) / 300;
    expect(result[1]).toBeCloseTo(expected, 3);
  });

  it("is monotonically increasing when price rises", () => {
    const result = VWAP(candles);
    expect(result[1]!).toBeGreaterThan(result[0]!);
  });

  it("returns an empty array for empty input", () => {
    expect(VWAP([])).toEqual([]);
  });
});

describe("ATR (Average True Range)", () => {
  const candles: OHLCV[] = Array.from({ length: 30 }, (_, i) => ({
    date: `2024-01-${String(i + 1).padStart(2, "0")}`,
    open: 100,
    high: 105,
    low: 95,
    close: 100,
    volume: 1000,
  }));

  it("returns a null for the first candle", () => {
    const result = ATR(candles, 14);
    expect(result[0]).toBeNull();
  });

  it("returns non-null values after the warm-up period", () => {
    const result = ATR(candles, 14);
    expect(result[14]).not.toBeNull();
    expect(result[29]).not.toBeNull();
  });

  it("computes 10 for constant 5-point ranges", () => {
    const result = ATR(candles, 14);
    // True range = max(105-95, |105-100|, |95-100|) = 10
    expect(result[29]).toBeCloseTo(10, 5);
  });

  it("is higher for wider ranges", () => {
    const narrow = ATR(
      candles.map((c) => ({ ...c, high: 101, low: 99 })),
      14
    );
    const wide = ATR(candles, 14);
    expect(wide[29]!).toBeGreaterThan(narrow[29]!);
  });

  it("preserves the array length", () => {
    expect(ATR(candles, 14)).toHaveLength(candles.length);
  });
});

describe("Stochastic", () => {
  const candles: OHLCV[] = Array.from({ length: 20 }, (_, i) => ({
    date: `2024-01-${String(i + 1).padStart(2, "0")}`,
    open: 100,
    high: 110,
    low: 90,
    close: 100,
    volume: 1000,
  }));

  it("returns nulls during the %K warm-up period", () => {
    const result = Stochastic(candles, 14, 3);
    expect(result.k[0]).toBeNull();
    expect(result.k[12]).toBeNull();
    expect(result.k[13]).not.toBeNull();
  });

  it("returns 50 for a flat series", () => {
    const result = Stochastic(candles, 14, 3);
    expect(result.k[19]).toBeCloseTo(50, 5);
  });

  it("returns 100 when close equals the period high", () => {
    // Every candle closes at its own high, and highs strictly increase,
    // so the last close is the 14-period high.
    const rising = candles.map((c, i) => ({
      ...c,
      low: 100 + i,
      high: 110 + i,
      close: 110 + i,
    }));
    const result = Stochastic(rising, 14, 3);
    expect(result.k[19]).toBeCloseTo(100, 5);
  });

  it("returns 0 when close equals the period low", () => {
    // Every candle closes at its own low, and lows strictly decrease,
    // so the last close is the 14-period low.
    const falling = candles.map((c, i) => ({
      ...c,
      low: 100 - i,
      high: 110 - i,
      close: 100 - i,
    }));
    const result = Stochastic(falling, 14, 3);
    expect(result.k[19]).toBeCloseTo(0, 5);
  });

  it("keeps %D as a rolling average of the last dPeriod %K values", () => {
    const result = Stochastic(candles, 14, 3);
    const kValues = result.k.filter((v): v is number => v !== null);
    expect(result.d[19]).toBeCloseTo(
      (kValues[kValues.length - 3]! + kValues[kValues.length - 2]! + kValues[kValues.length - 1]!) / 3,
      5
    );
  });

  it("returns k and d arrays of matching length", () => {
    const result = Stochastic(candles, 14, 3);
    expect(result.k).toHaveLength(20);
    expect(result.d).toHaveLength(20);
  });
});
