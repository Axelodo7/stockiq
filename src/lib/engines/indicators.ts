import type { OHLCV, MACDResult, BollingerBandsResult, StochasticResult } from "@/types";

export function SMA(prices: number[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  for (let i = 0; i < prices.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else {
      const slice = prices.slice(i - period + 1, i + 1);
      result.push(slice.reduce((a, b) => a + b, 0) / period);
    }
  }
  return result;
}

export function EMA(prices: number[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  const multiplier = 2 / (period + 1);
  let ema: number | null = null;

  for (let i = 0; i < prices.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else if (i === period - 1) {
      ema = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;
      result.push(ema);
    } else {
      ema = (prices[i] - (ema as number)) * multiplier + (ema as number);
      result.push(ema);
    }
  }
  return result;
}

export function RSI(prices: number[], period = 14): (number | null)[] {
  const result: (number | null)[] = [];
  const gains: number[] = [];
  const losses: number[] = [];

  for (let i = 0; i < prices.length; i++) {
    if (i === 0) {
      result.push(null);
      continue;
    }

    const change = prices[i] - prices[i - 1];
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? Math.abs(change) : 0);

    if (i < period) {
      result.push(null);
    } else {
      const avgGain = gains.slice(-period).reduce((a, b) => a + b, 0) / period;
      const avgLoss = losses.slice(-period).reduce((a, b) => a + b, 0) / period;
      if (avgLoss === 0) {
        result.push(100);
      } else {
        const rs = avgGain / avgLoss;
        result.push(100 - 100 / (1 + rs));
      }
    }
  }
  return result;
}

export function MACD(
  prices: number[],
  fastPeriod = 12,
  slowPeriod = 26,
  signalPeriod = 9
): MACDResult {
  const fastEMA = EMA(prices, fastPeriod);
  const slowEMA = EMA(prices, slowPeriod);
  const macdLine: number[] = [];

  for (let i = 0; i < prices.length; i++) {
    if (fastEMA[i] === null || slowEMA[i] === null) {
      macdLine.push(0);
    } else {
      macdLine.push((fastEMA[i] as number) - (slowEMA[i] as number));
    }
  }

  const signalLine = EMA(macdLine, signalPeriod);
  const histogram: number[] = [];

  for (let i = 0; i < prices.length; i++) {
    if (signalLine[i] === null) {
      histogram.push(0);
    } else {
      histogram.push(macdLine[i] - (signalLine[i] as number));
    }
  }

  return { macd: macdLine, signal: signalLine as number[], histogram };
}

export function BollingerBands(
  prices: number[],
  period = 20,
  stdDevMultiplier = 2
): BollingerBandsResult {
  const sma = SMA(prices, period);
  const upper: number[] = [];
  const lower: number[] = [];

  for (let i = 0; i < prices.length; i++) {
    if (sma[i] === null) {
      upper.push(0);
      lower.push(0);
    } else {
      const slice = prices.slice(i - period + 1, i + 1);
      const mean = sma[i] as number;
      const variance = slice.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / period;
      const stdDev = Math.sqrt(variance);
      upper.push(mean + stdDevMultiplier * stdDev);
      lower.push(mean - stdDevMultiplier * stdDev);
    }
  }

  return { upper, middle: sma as number[], lower };
}

export function VWAP(data: OHLCV[]): (number | null)[] {
  const result: (number | null)[] = [];
  let cumulativeTPV = 0;
  let cumulativeVolume = 0;

  for (const candle of data) {
    const typicalPrice = (candle.high + candle.low + candle.close) / 3;
    cumulativeTPV += typicalPrice * candle.volume;
    cumulativeVolume += candle.volume;
    result.push(cumulativeVolume > 0 ? cumulativeTPV / cumulativeVolume : null);
  }
  return result;
}

export function ATR(data: OHLCV[], period = 14): (number | null)[] {
  const trueRanges: number[] = [];
  const result: (number | null)[] = [null];

  for (let i = 1; i < data.length; i++) {
    const high = data[i].high;
    const low = data[i].low;
    const prevClose = data[i - 1].close;
    const tr = Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose));
    trueRanges.push(tr);

    if (i < period) {
      result.push(null);
    } else if (i === period) {
      result.push(trueRanges.slice(0, period).reduce((a, b) => a + b, 0) / period);
    } else {
      const prevATR = result[i - 1] as number;
      result.push((prevATR * (period - 1) + tr) / period);
    }
  }
  return result;
}

export function Stochastic(
  data: OHLCV[],
  kPeriod = 14,
  dPeriod = 3
): StochasticResult {
  const kValues: number[] = [];
  const k: (number | null)[] = [];
  const d: (number | null)[] = [];

  for (let i = 0; i < data.length; i++) {
    if (i < kPeriod - 1) {
      k.push(null);
      continue;
    }
    const slice = data.slice(i - kPeriod + 1, i + 1);
    const high = Math.max(...slice.map((c) => c.high));
    const low = Math.min(...slice.map((c) => c.low));
    const kVal = high === low ? 50 : ((data[i].close - low) / (high - low)) * 100;
    kValues.push(kVal);
    k.push(kVal);
  }

  for (let i = 0; i < k.length; i++) {
    if (k[i] === null || kValues.length < dPeriod) {
      d.push(null);
    } else {
      const slice = kValues.slice(-dPeriod);
      d.push(slice.reduce((a, b) => a + b, 0) / dPeriod);
    }
  }

  return { k, d };
}
