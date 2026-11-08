import { NextResponse, type NextRequest } from "next/server";
import { fetchAlpacaSnapshots, fetchAlpacaBars, hasAlpacaCredentials } from "@/lib/services/market-api";
import { cached, TTL } from "@/lib/server-cache";
import { checkAIRateLimit } from "@/lib/security/ai-rate-limit";

const UNIVERSE = [
  "AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "META", "TSLA", "JPM",
  "V", "UNH", "XOM", "WMT", "JNJ", "MA", "PG", "HD", "COST", "ABBV",
  "LLY", "AVGO", "CRM", "NFLX", "AMD", "ADBE", "QCOM", "INTC",
  "DIS", "GS", "CAT", "BLK", "SQ", "SHOP", "COIN", "PLTR",
  "SNOW", "UBER", "ABNB", "DKNG", "NET", "DDOG", "CRWD",
  "PANW", "ARM", "HOOD", "RBLX", "SPOT", "SE",
];

interface PortfolioPosition {
  ticker: string;
  name?: string;
  shares: number;
  avgCost: number;
}

interface Bar {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface Indicators {
  rsi: number | null;
  rsiSignal: "oversold" | "overbought" | "neutral";
  macdSignal: "bullish" | "bearish" | "neutral";
  bollingerSignal: "below_lower" | "above_upper" | "within";
  smaCross: "golden" | "death" | "none";
  momentum: number;
}

interface Recommendation {
  ticker: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  signal: "strong_buy" | "buy" | "hold" | "sell" | "strong_sell";
  confidence: number;
  indicators: Indicators;
  reasoning: string[];
  source: "technical";
}

interface PortfolioSellRec {
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
  allocationPercent: number;
  riskLevel: "low" | "medium" | "high";
}

function sma(values: number[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) { result.push(null); continue; }
    result.push(values.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period);
  }
  return result;
}

function ema(values: number[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  const k = 2 / (period + 1);
  let prev: number | null = null;
  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) { result.push(null); continue; }
    if (prev === null) {
      prev = values.slice(0, period).reduce((a, b) => a + b, 0) / period;
    } else {
      prev = values[i] * k + prev * (1 - k);
    }
    result.push(prev);
  }
  return result;
}

function rsi(closes: number[], period = 14): (number | null)[] {
  const result: (number | null)[] = [];
  const gains: number[] = [];
  const losses: number[] = [];
  for (let i = 0; i < closes.length; i++) {
    if (i === 0) { result.push(null); continue; }
    const change = closes[i] - closes[i - 1];
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? Math.abs(change) : 0);
    if (i < period) { result.push(null); continue; }
    const avgGain = gains.slice(-period).reduce((a, b) => a + b, 0) / period;
    const avgLoss = losses.slice(-period).reduce((a, b) => a + b, 0) / period;
    result.push(avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss));
  }
  return result;
}

function macd(closes: number[]) {
  const fast = ema(closes, 12);
  const slow = ema(closes, 26);
  const macdLine = closes.map((_, i) =>
    fast[i] !== null && slow[i] !== null ? (fast[i] as number) - (slow[i] as number) : 0
  );
  const signal = ema(macdLine, 9);
  const histogram = macdLine.map((v, i) => signal[i] !== null ? v - (signal[i] as number) : 0);
  return { macdLine, signal, histogram };
}

function bollinger(closes: number[], period = 20) {
  const mid = sma(closes, period);
  const upper: number[] = [];
  const lower: number[] = [];
  for (let i = 0; i < closes.length; i++) {
    if (mid[i] === null) { upper.push(0); lower.push(0); continue; }
    const slice = closes.slice(i - period + 1, i + 1);
    const mean = mid[i] as number;
    const variance = slice.reduce((acc, val) => acc + (val - mean) ** 2, 0) / period;
    const std = Math.sqrt(variance);
    upper.push(mean + 2 * std);
    lower.push(mean - 2 * std);
  }
  return { upper, middle: mid as number[], lower };
}

function computeIndicators(bars: Bar[]): Indicators | null {
  if (bars.length < 50) return null;
  const closes = bars.map((b) => b.close);
  const last = closes[closes.length - 1];

  const rsiValues = rsi(closes, 14);
  const rsiVal = rsiValues[rsiValues.length - 1];

  const macdResult = macd(closes);
  const hist = macdResult.histogram;
  const currHist = hist[hist.length - 1] ?? 0;
  const prevHist = hist.length > 1 ? hist[hist.length - 2] : 0;

  const bb = bollinger(closes);
  const bbUpper = bb.upper[bb.upper.length - 1];
  const bbLower = bb.lower[bb.lower.length - 1];

  const sma20 = sma(closes, 20);
  const sma50 = sma(closes, 50);
  const sma200 = sma(closes, 200);
  const lastSma20 = sma20[sma20.length - 1];
  const lastSma50 = sma50[sma50.length - 1];
  const lastSma200 = sma200[sma200.length - 1];
  const prevSma20 = sma20.length > 1 ? sma20[sma20.length - 2] : null;
  const prevSma50 = sma50.length > 1 ? sma50[sma50.length - 2] : null;

  let rsiSignal: "oversold" | "overbought" | "neutral" = "neutral";
  if (rsiVal !== null) {
    if (rsiVal < 30) rsiSignal = "oversold";
    else if (rsiVal > 70) rsiSignal = "overbought";
  }

  let macdSignal: "bullish" | "bearish" | "neutral" = "neutral";
  if (currHist > 0 && prevHist <= 0) macdSignal = "bullish";
  else if (currHist < 0 && prevHist >= 0) macdSignal = "bearish";
  else if (currHist > 0) macdSignal = "bullish";
  else if (currHist < 0) macdSignal = "bearish";

  let bollingerSignal: "below_lower" | "above_upper" | "within" = "within";
  if (last < bbLower) bollingerSignal = "below_lower";
  else if (last > bbUpper) bollingerSignal = "above_upper";

  let smaCross: "golden" | "death" | "none" = "none";
  if (lastSma20 !== null && lastSma50 !== null && prevSma20 !== null && prevSma50 !== null) {
    if (lastSma20 > lastSma50 && prevSma20 <= prevSma50) smaCross = "golden";
    else if (lastSma20 < lastSma50 && prevSma20 >= prevSma50) smaCross = "death";
  }

  let momentum = 0;
  if (rsiVal !== null) momentum += (rsiVal - 50) * 0.4;
  momentum += Math.max(-20, Math.min(20, (currHist / last) * 1000));
  if (bollingerSignal === "below_lower") momentum += 15;
  else if (bollingerSignal === "above_upper") momentum -= 15;
  if (smaCross === "golden") momentum += 20;
  else if (smaCross === "death") momentum -= 20;
  momentum = Math.max(-100, Math.min(100, momentum));

  return { rsi: rsiVal, rsiSignal, macdSignal, bollingerSignal, smaCross, momentum };
}

function scoreSignal(ind: Indicators): { signal: Recommendation["signal"]; confidence: number; reasoning: string[] } {
  let score = 0;
  const reasoning: string[] = [];
  let agree = 0;
  let total = 0;

  if (ind.rsi !== null) {
    total++;
    if (ind.rsiSignal === "oversold") { score += 25; agree++; reasoning.push(`RSI at ${ind.rsi.toFixed(0)} — oversold, potential bounce`); }
    else if (ind.rsiSignal === "overbought") { score -= 25; agree++; reasoning.push(`RSI at ${ind.rsi.toFixed(0)} — overbought, risk of pullback`); }
  }
  total++;
  if (ind.macdSignal === "bullish") { score += 20; agree++; reasoning.push("MACD bullish crossover — momentum building"); }
  else if (ind.macdSignal === "bearish") { score -= 20; agree++; reasoning.push("MACD bearish crossover — momentum weakening"); }
  total++;
  if (ind.bollingerSignal === "below_lower") { score += 20; agree++; reasoning.push("Below lower Bollinger — mean reversion opportunity"); }
  else if (ind.bollingerSignal === "above_upper") { score -= 20; agree++; reasoning.push("Above upper Bollinger — extended, may revert"); }
  total++;
  if (ind.smaCross === "golden") { score += 30; agree++; reasoning.push("Golden cross (SMA20 > SMA50) — bullish trend"); }
  else if (ind.smaCross === "death") { score -= 30; agree++; reasoning.push("Death cross (SMA20 < SMA50) — bearish trend"); }

  const confidence = total > 0 ? Math.round((agree / total) * 100) : 50;
  let signal: Recommendation["signal"];
  if (score >= 40) signal = "strong_buy";
  else if (score >= 15) signal = "buy";
  else if (score <= -40) signal = "strong_sell";
  else if (score <= -15) signal = "sell";
  else signal = "hold";

  if (reasoning.length === 0) reasoning.push("Mixed signals — no clear direction");
  return { signal, confidence, reasoning };
}

async function analyzeTicker(ticker: string, quote: { price: number; change: number; changePercent: number; name: string }): Promise<Recommendation | null> {
  const start = new Date();
  start.setDate(start.getDate() - 365);
  const bars = await fetchAlpacaBars(ticker, "1Day", start.toISOString().split("T")[0], 400);
  if (bars.length < 50) return null;

  const ind = computeIndicators(bars as Bar[]);
  if (!ind) return null;

  const { signal, confidence, reasoning } = scoreSignal(ind);

  return {
    ticker,
    name: quote.name || ticker,
    price: quote.price,
    change: quote.change,
    changePercent: quote.changePercent,
    signal,
    confidence,
    indicators: ind,
    reasoning,
    source: "technical",
  };
}

export async function POST(request: NextRequest) {
  const limit = await checkAIRateLimit(request);
  if (limit.blocked) return limit.response!;

  try {
    const body = await request.json().catch(() => ({}));
    const portfolio: PortfolioPosition[] = Array.isArray(body?.portfolio) ? body.portfolio : [];

    const result = await cached(
      "ai:recommendations",
      async () => {
        if (!hasAlpacaCredentials()) {
          return { error: "Alpaca API credentials not configured" };
        }

        // Build analysis universe — top stocks + user's portfolio tickers (deduped)
        const portfolioTickers = portfolio.map((p) => p.ticker.toUpperCase()).filter(Boolean);
        const tickersToAnalyze = Array.from(new Set([...UNIVERSE, ...portfolioTickers]));

        // Batch fetch snapshots
        const snapshots = await fetchAlpacaSnapshots(tickersToAnalyze);

        // Analyze each stock with enough data
        const recommendations: Recommendation[] = [];
        const batch = tickersToAnalyze.filter((t) => snapshots.has(t));

        // Process in batches of 8 to avoid overwhelming the API
        for (let i = 0; i < batch.length; i += 8) {
          const chunk = batch.slice(i, i + 8);
          const results = await Promise.all(
            chunk.map((ticker) => {
              const snap = snapshots.get(ticker);
              if (!snap) return null;
              return analyzeTicker(ticker, snap);
            })
          );
          for (const r of results) {
            if (r) recommendations.push(r);
          }
        }

        // Sort by signal priority then confidence
        const signalOrder = { strong_buy: 0, buy: 1, hold: 2, sell: 3, strong_sell: 4 };
        recommendations.sort((a, b) => {
          const diff = signalOrder[a.signal] - signalOrder[b.signal];
          if (diff !== 0) return diff;
          return b.confidence - a.confidence;
        });

        // Market sentiment from universe signals
        const universeRecs = recommendations.filter((r) => UNIVERSE.includes(r.ticker));
        const bullish = universeRecs.filter((r) => r.signal === "strong_buy" || r.signal === "buy").length;
        const bearish = universeRecs.filter((r) => r.signal === "strong_sell" || r.signal === "sell").length;
        const marketSentiment = bullish > bearish + 2 ? "bullish" : bearish > bullish + 2 ? "bearish" : "neutral";

        // Portfolio-aware sell recommendations
        const sellRecommendations: PortfolioSellRec[] = [];
        if (portfolio.length > 0) {
          const totalValue = portfolio.reduce((sum, pos) => {
            const snap = snapshots.get(pos.ticker.toUpperCase());
            return sum + (snap ? snap.price * pos.shares : pos.avgCost * pos.shares);
          }, 0);

          for (const pos of portfolio) {
            const ticker = pos.ticker.toUpperCase();
            const snap = snapshots.get(ticker);
            const rec = recommendations.find((r) => r.ticker === ticker);
            if (!snap) continue;

            const currentPrice = snap.price;
            const gainLoss = (currentPrice - pos.avgCost) * pos.shares;
            const gainLossPercent = pos.avgCost > 0 ? ((currentPrice - pos.avgCost) / pos.avgCost) * 100 : 0;
            const allocationPercent = totalValue > 0 ? (currentPrice * pos.shares / totalValue) * 100 : 0;

            const reasoning: string[] = [];
            let score = 0;

            // Overconcentration
            if (allocationPercent > 25) {
              score += 30;
              reasoning.push(`Position is ${allocationPercent.toFixed(1)}% of portfolio — overconcentrated, consider reducing`);
            } else if (allocationPercent > 15) {
              score += 10;
              reasoning.push(`Position is ${allocationPercent.toFixed(1)}% of portfolio — moderately concentrated`);
            }

            // Profit taking
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
            if (snap.change < -3) {
              score += 15;
              reasoning.push(`Down ${snap.change.toFixed(2)}% today — momentum weakness`);
            }

            // Technical signal agreement
            if (rec && (rec.signal === "strong_sell" || rec.signal === "sell")) {
              score += 25;
              reasoning.push(`Technical analysis shows ${rec.signal.replace("_", " ")} signal`);
            }

            if (reasoning.length === 0) {
              reasoning.push("Position looks healthy — no immediate sell signal");
            }

            const confidence = Math.min(100, Math.round(score * 2));
            const signal: "sell" | "reduce" = score >= 40 ? "sell" : score >= 20 ? "reduce" : "reduce";
            const riskLevel: "low" | "medium" | "high" =
              allocationPercent > 25 || gainLossPercent < -20 ? "high" :
              allocationPercent > 15 || gainLossPercent < -10 ? "medium" : "low";

            sellRecommendations.push({
              ticker,
              name: pos.name || ticker,
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

          // Sort by confidence
          sellRecommendations.sort((a, b) => b.confidence - a.confidence);
        }

        // Top universe sells (for users without portfolio)
        const topUniverseSells: PortfolioSellRec[] = universeRecs
          .filter((r) => r.signal === "strong_sell" || r.signal === "sell")
          .slice(0, 5)
          .map((r) => ({
            ticker: r.ticker,
            name: r.name,
            shares: 0,
            avgCost: 0,
            currentPrice: r.price,
            gainLoss: 0,
            gainLossPercent: 0,
            signal: "sell" as const,
            confidence: r.confidence,
            reasoning: r.reasoning,
            allocationPercent: 0,
            riskLevel: "medium" as const,
          }));

        return {
          buyRecommendations: recommendations.filter((r) => r.signal === "strong_buy" || r.signal === "buy").slice(0, 10),
          sellRecommendations: portfolio.length > 0 ? sellRecommendations : topUniverseSells,
          holdCount: recommendations.filter((r) => r.signal === "hold").length,
          marketSentiment,
          analyzedCount: recommendations.length,
          analyzedAt: new Date().toISOString(),
          source: "technical" as const,
          portfolioBased: portfolio.length > 0,
        };
      },
      TTL.SHORT
    );

    const res = result as Record<string, unknown>;
    if ("error" in res) {
      return NextResponse.json({ success: false, error: String(res.error) }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: result });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to generate recommendations" }, { status: 500 });
  }
}

export async function GET() {
  // Keep GET working for backward compat — empty portfolio
  return POST(new Request("http://x", { method: "POST", body: JSON.stringify({ portfolio: [] }) }) as unknown as NextRequest);
}
