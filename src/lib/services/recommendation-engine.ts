/**
 * AI Recommendation Engine — hybrid client-side + Python ML analysis.
 *
 * Client-side: RSI, MACD, Bollinger, SMA crossovers, momentum scoring
 * Python ML: XGBoost/Ensemble predictions when available (fallback to client-side)
 */

import { SMA, EMA, RSI, MACD, BollingerBands } from "@/lib/engines/indicators";
import type { OHLCV } from "@/types";

export interface StockRecommendation {
  ticker: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  signal: "strong_buy" | "buy" | "hold" | "sell" | "strong_sell";
  confidence: number; // 0-100
  indicators: {
    rsi: number | null;
    rsiSignal: "oversold" | "overbought" | "neutral";
    macdSignal: "bullish" | "bearish" | "neutral";
    bollingerSignal: "below_lower" | "above_upper" | "within";
    smaCross: "golden" | "death" | "none";
    momentum: number; // -100 to +100
  };
  reasoning: string[];
  source: "ml" | "technical" | "hybrid";
  modelAgreement?: number; // 0-100, only when ML is available
}

export interface PortfolioSellRecommendation {
  ticker: string;
  name: string;
  shares: number;
  avgCost: number;
  currentPrice: number;
  gainLoss: number;
  gainLossPercent: number;
  signal: "sell" | "reduce";
  confidence: number;
  reasoning: string[];
  allocationPercent: number; // % of portfolio
  riskLevel: "low" | "medium" | "high";
}

export interface RecommendationsResponse {
  buyRecommendations: StockRecommendation[];
  sellRecommendations: PortfolioSellRecommendation[];
  marketSentiment: "bullish" | "bearish" | "neutral";
  analyzedAt: string;
  source: "ml" | "technical" | "hybrid";
}

const UNIVERSE = [
  "AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "META", "TSLA", "JPM",
  "V", "UNH", "XOM", "WMT", "JNJ", "MA", "PG", "HD", "COST", "ABBV",
  "LLY", "AVGO", "CRM", "NFLX", "AMD", "ADBE", "PYPL", "QCOM",
  "INTC", "DIS", "BA", "GS", "CAT", "BLK", "SQ", "SHOP", "COIN",
  "PLTR", "SNOW", "UBER", "ABNB", "DKNG", "NET", "DDOG", "CRWD",
  "PANW", "ARM", "SMCI", "HOOD", "RBLX", "SPOT", "SE",
];

function computeIndicators(bars: OHLCV[]) {
  const closes = bars.map((b) => b.close);
  const highs = bars.map((b) => b.high);
  const lows = bars.map((b) => b.low);
  const volumes = bars.map((b) => b.volume);

  const rsiValues = RSI(closes, 14);
  const rsi = rsiValues[rsiValues.length - 1] ?? null;

  const macdResult = MACD(closes);
  const macdHist = macdResult.histogram;
  const prevMacdHist = macdHist.length > 1 ? macdHist[macdHist.length - 2] : null;
  const currMacdHist = macdHist[macdHist.length - 1] ?? null;

  const bb = BollingerBands(closes);
  const bbUpper = bb.upper[bb.upper.length - 1] ?? null;
  const bbLower = bb.lower[bb.lower.length - 1] ?? null;
  const bbMiddle = bb.middle[bb.middle.length - 1] ?? null;
  const lastClose = closes[closes.length - 1] ?? 0;

  const sma20 = SMA(closes, 20);
  const sma50 = SMA(closes, 50);
  const sma200 = SMA(closes, 200);
  const lastSma20 = sma20[sma20.length - 1] ?? null;
  const lastSma50 = sma50[sma50.length - 1] ?? null;
  const lastSma200 = sma200[sma200.length - 1] ?? null;
  const prevSma20 = sma20.length > 1 ? sma20[sma20.length - 2] : null;
  const prevSma50 = sma50.length > 1 ? sma50[sma50.length - 2] : null;

  // RSI signal
  let rsiSignal: "oversold" | "overbought" | "neutral" = "neutral";
  if (rsi !== null) {
    if (rsi < 30) rsiSignal = "oversold";
    else if (rsi > 70) rsiSignal = "overbought";
  }

  // MACD signal
  let macdSignal: "bullish" | "bearish" | "neutral" = "neutral";
  if (currMacdHist !== null && prevMacdHist !== null) {
    if (currMacdHist > 0 && prevMacdHist <= 0) macdSignal = "bullish";
    else if (currMacdHist < 0 && prevMacdHist >= 0) macdSignal = "bearish";
    else if (currMacdHist > 0) macdSignal = "bullish";
    else if (currMacdHist < 0) macdSignal = "bearish";
  }

  // Bollinger signal
  let bollingerSignal: "below_lower" | "above_upper" | "within" = "within";
  if (lastClose && bbLower && bbUpper) {
    if (lastClose < bbLower) bollingerSignal = "below_lower";
    else if (lastClose > bbUpper) bollingerSignal = "above_upper";
  }

  // SMA crossover
  let smaCross: "golden" | "death" | "none" = "none";
  if (lastSma20 !== null && lastSma50 !== null && prevSma20 !== null && prevSma50 !== null) {
    if (lastSma20 > lastSma50 && prevSma20 <= prevSma50) smaCross = "golden";
    else if (lastSma20 < lastSma50 && prevSma20 >= prevSma50) smaCross = "death";
  }

  // Momentum score (-100 to +100)
  let momentum = 0;
  if (rsi !== null) momentum += (rsi - 50) * 0.4; // RSI contribution
  if (currMacdHist !== null && lastClose) {
    momentum += Math.max(-20, Math.min(20, (currMacdHist / lastClose) * 1000));
  }
  if (bollingerSignal === "below_lower") momentum += 15;
  else if (bollingerSignal === "above_upper") momentum -= 15;
  if (smaCross === "golden") momentum += 20;
  else if (smaCross === "death") momentum -= 20;
  momentum = Math.max(-100, Math.min(100, momentum));

  return {
    rsi,
    rsiSignal,
    macdSignal,
    bollingerSignal,
    smaCross,
    momentum,
    lastClose,
    sma20: lastSma20,
    sma50: lastSma50,
    sma200: lastSma200,
  };
}

function computeSignalScore(indicators: ReturnType<typeof computeIndicators>): {
  signal: StockRecommendation["signal"];
  confidence: number;
  reasoning: string[];
} {
  let score = 0;
  const reasoning: string[] = [];
  let agreeCount = 0;
  let totalIndicators = 0;

  // RSI
  if (indicators.rsi !== null) {
    totalIndicators++;
    if (indicators.rsiSignal === "oversold") {
      score += 25;
      agreeCount++;
      reasoning.push(`RSI at ${indicators.rsi.toFixed(0)} — oversold territory, potential bounce`);
    } else if (indicators.rsiSignal === "overbought") {
      score -= 25;
      agreeCount++;
      reasoning.push(`RSI at ${indicators.rsi.toFixed(0)} — overbought, risk of pullback`);
    }
  }

  // MACD
  totalIndicators++;
  if (indicators.macdSignal === "bullish") {
    score += 20;
    agreeCount++;
    reasoning.push("MACD histogram turning positive — bullish momentum building");
  } else if (indicators.macdSignal === "bearish") {
    score -= 20;
    agreeCount++;
    reasoning.push("MACD histogram turning negative — bearish momentum building");
  }

  // Bollinger
  totalIndicators++;
  if (indicators.bollingerSignal === "below_lower") {
    score += 20;
    agreeCount++;
    reasoning.push("Price below lower Bollinger Band — potential mean reversion opportunity");
  } else if (indicators.bollingerSignal === "above_upper") {
    score -= 20;
    agreeCount++;
    reasoning.push("Price above upper Bollinger Band — extended, may revert to mean");
  }

  // SMA Cross
  totalIndicators++;
  if (indicators.smaCross === "golden") {
    score += 30;
    agreeCount++;
    reasoning.push("Golden cross detected (SMA20 > SMA50) — bullish trend confirmation");
  } else if (indicators.smaCross === "death") {
    score -= 30;
    agreeCount++;
    reasoning.push("Death cross detected (SMA20 < SMA50) — bearish trend confirmation");
  }

  // Price vs SMA200 (long-term trend)
  if (indicators.sma200 !== null && indicators.lastClose) {
    totalIndicators++;
    if (indicators.lastClose > indicators.sma200) {
      score += 10;
      agreeCount++;
      reasoning.push("Price above 200-day SMA — long-term uptrend intact");
    } else {
      score -= 10;
      agreeCount++;
      reasoning.push("Price below 200-day SMA — long-term downtrend");
    }
  }

  const confidence = totalIndicators > 0 ? Math.round((agreeCount / totalIndicators) * 100) : 50;

  let signal: StockRecommendation["signal"];
  if (score >= 40) signal = "strong_buy";
  else if (score >= 15) signal = "buy";
  else if (score <= -40) signal = "strong_sell";
  else if (score <= -15) signal = "sell";
  else signal = "hold";

  if (reasoning.length === 0) {
    reasoning.push("Mixed signals across indicators — no clear direction");
  }

  return { signal, confidence, reasoning };
}

export function analyzeStock(
  ticker: string,
  name: string,
  bars: OHLCV[],
  price: number,
  change: number,
  changePercent: number
): StockRecommendation | null {
  if (bars.length < 50) return null;

  const indicators = computeIndicators(bars);
  const { signal, confidence, reasoning } = computeSignalScore(indicators);

  return {
    ticker,
    name,
    price,
    change,
    changePercent,
    signal,
    confidence,
    indicators: {
      rsi: indicators.rsi,
      rsiSignal: indicators.rsiSignal,
      macdSignal: indicators.macdSignal,
      bollingerSignal: indicators.bollingerSignal,
      smaCross: indicators.smaCross,
      momentum: Math.round(indicators.momentum),
    },
    reasoning,
    source: "technical",
  };
}

export function analyzePortfolioSell(
  positions: { ticker: string; name: string; shares: number; avgCost: number }[],
  prices: Record<string, { price: number; change: number }>,
  totalPortfolioValue: number
): PortfolioSellRecommendation[] {
  const recommendations: PortfolioSellRecommendation[] = [];

  for (const pos of positions) {
    const priceData = prices[pos.ticker];
    if (!priceData) continue;

    const currentPrice = priceData.price;
    const gainLoss = (currentPrice - pos.avgCost) * pos.shares;
    const gainLossPercent = pos.avgCost > 0
      ? ((currentPrice - pos.avgCost) / pos.avgCost) * 100
      : 0;
    const allocationPercent = totalPortfolioValue > 0
      ? (currentPrice * pos.shares / totalPortfolioValue) * 100
      : 0;

    const reasoning: string[] = [];
    let score = 0;

    // Overconcentration check
    if (allocationPercent > 25) {
      score += 30;
      reasoning.push(`Position is ${allocationPercent.toFixed(1)}% of portfolio — overconcentrated, consider reducing`);
    } else if (allocationPercent > 15) {
      score += 10;
      reasoning.push(`Position is ${allocationPercent.toFixed(1)}% of portfolio — moderately concentrated`);
    }

    // Profit-taking check
    if (gainLossPercent > 50) {
      score += 25;
      reasoning.push(`Up ${gainLossPercent.toFixed(1)}% — consider taking profits`);
    } else if (gainLossPercent > 20) {
      score += 10;
      reasoning.push(`Up ${gainLossPercent.toFixed(1)}% — modest gains, evaluate hold vs sell`);
    }

    // Loss check
    if (gainLossPercent < -20) {
      score += 20;
      reasoning.push(`Down ${gainLossPercent.toFixed(1)}% — evaluate if thesis still holds`);
    } else if (gainLossPercent < -10) {
      score += 5;
      reasoning.push(`Down ${gainLossPercent.toFixed(1)}% — monitor closely`);
    }

    // Today's price action
    if (priceData.change < -3) {
      score += 15;
      reasoning.push(`Down ${priceData.change.toFixed(2)}% today — momentum weakness`);
    }

    if (reasoning.length === 0) {
      reasoning.push("Position looks healthy — no immediate sell signal");
    }

    const confidence = Math.min(100, Math.round(score * 2));
    const signal: "sell" | "reduce" = score >= 40 ? "sell" : score >= 20 ? "reduce" : "reduce";
    const riskLevel: "low" | "medium" | "high" =
      allocationPercent > 25 || gainLossPercent < -20 ? "high" :
      allocationPercent > 15 || gainLossPercent < -10 ? "medium" : "low";

    recommendations.push({
      ticker: pos.ticker,
      name: pos.name,
      shares: pos.shares,
      avgCost: pos.avgCost,
      currentPrice,
      gainLoss,
      gainLossPercent,
      signal,
      confidence,
      reasoning,
      allocationPercent,
      riskLevel,
    });
  }

  // Sort by confidence descending
  recommendations.sort((a, b) => b.confidence - a.confidence);
  return recommendations;
}

export { UNIVERSE };
