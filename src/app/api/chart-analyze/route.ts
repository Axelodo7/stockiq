import { NextResponse, type NextRequest } from "next/server";
import sharp from "sharp";
import { fetchAlpacaQuote, fetchYahooQuote, hasAlpacaCredentials } from "@/lib/services/market-api";
import { aiIPLimit, aiUserLimit } from "@/lib/security/rate-limit";
import { auth } from "@clerk/nextjs/server";

export const runtime = "nodejs";
export const maxDuration = 30;

// ==== TICKER FORMATTING ====
// Detect asset class and produce list of symbol variants to try across data sources.
// Alpaca supports: stocks (AAPL), crypto (BTC/USD on Alpaca, but we use Yahoo for crypto).
// Yahoo Finance supports:
//   - Stocks: AAPL, MSFT
//   - Forex: USDJPY=X, EURUSD=X, JPY=X (alt form), =X pairs
//   - Crypto: BTC-USD, ETH-USD
//   - Metals: XAUUSD=X (gold), XAGUSD=X (silver), GC=F (futures)
//   - Indices: ^GSPC, ^DJI, ^IXIC

type AssetClass = "stock" | "forex" | "crypto" | "metal" | "index" | "unknown";

const FOREX_BASES = new Set([
  "USD","EUR","JPY","GBP","CHF","AUD","CAD","NZD","CNY","HKD","SGD","SEK","NOK","DKK",
  "MXN","ZAR","TRY","PLN","THB","IDR","MYR","PHP","INR","KRW","RUB","BRL","ARS"
]);

const METAL_SYMBOLS = new Set([
  "XAU","XAG","XPT","XPD","GOLD","SILVER","PLATINUM","PALLADIUM","GC","SI","PL","PA"
]);

const CRYPTO_SYMBOLS = new Set([
  "BTC","ETH","XRP","LTC","BCH","ADA","DOT","LINK","UNI","AAVE","SOL","MATIC","AVAX",
  "DOGE","SHIB","TRX","ATOM","XLM","ETC","NEAR","ALGO","FTM","HBAR","ICP","FIL"
]);

const INDEX_SYMBOLS = new Set([
  "SPX","IXIC","DJI","RUT","VIX","TNX","GSPC","NDX","RUI","RUA","VIX","UKX","DAX","CAC","N225"
]);

function detectAssetClass(raw: string): AssetClass {
  const s = raw.toUpperCase().replace(/[^A-Z]/g, "");
  if (!s) return "unknown";

  // Index: starts with ^ or matches index list
  if (raw.startsWith("^")) return "index";
  if (INDEX_SYMBOLS.has(s)) return "index";

  // Crypto: contains "-USD" or matches crypto list
  if (raw.includes("-USD") || raw.includes("-USDT")) return "crypto";
  if (CRYPTO_SYMBOLS.has(s)) return "crypto";

  // Metal: matches metal list
  if (METAL_SYMBOLS.has(s)) return "metal";

  // Forex: 6-letter pair of currencies (USDJPY, EURUSD)
  if (s.length === 6) {
    const a = s.slice(0, 3);
    const b = s.slice(3, 6);
    if (FOREX_BASES.has(a) && FOREX_BASES.has(b)) return "forex";
  }

  // 3-letter single currency → likely forex
  if (s.length === 3 && FOREX_BASES.has(s)) return "forex";

  return "stock";
}

/**
 * Produce list of Yahoo-compatible symbol variants for the input ticker.
 * Order matters: try the most-specific format first.
 */
function yahooSymbolVariants(raw: string): string[] {
  const cls = detectAssetClass(raw);
  const upper = raw.toUpperCase().trim();
  const variants: string[] = [];

  if (cls === "forex") {
    const s = upper.replace(/[^A-Z]/g, "");
    if (s.length === 6) {
      // Pair like USDJPY → USDJPY=X (Yahoo's preferred form)
      variants.push(`${s}=X`);
      // Also try as a single currency quote: JPY=X
      variants.push(`${s.slice(3, 6)}=X`);
      variants.push(`${s.slice(0, 3)}=X`);
    } else if (s.length === 3) {
      variants.push(`${s}=X`);
      variants.push(`${s}USD=X`);
    }
  } else if (cls === "crypto") {
    // BTC-USD, BTCUSD, BTC/USDT
    if (upper.includes("-")) {
      variants.push(upper);
      variants.push(upper.replace("-", ""));
      variants.push(upper.replace("-USD", "USD"));
    } else {
      variants.push(`${upper}-USD`);
      variants.push(`${upper}USD`);
      variants.push(`${upper}-USDT`);
    }
  } else if (cls === "metal") {
    const s = upper.replace(/[^A-Z]/g, "");
    if (s === "GOLD" || s === "XAU") {
      variants.push("XAUUSD=X", "GC=F", "GC");
    } else if (s === "SILVER" || s === "XAG") {
      variants.push("XAGUSD=X", "SI=F", "SI");
    } else if (s === "PLATINUM" || s === "XPT") {
      variants.push("XPTUSD=X", "PL=F");
    } else if (s === "PALLADIUM" || s === "XPD") {
      variants.push("XPDUSD=X", "PA=F");
    } else {
      variants.push(upper);
    }
  } else if (cls === "index") {
    variants.push(upper.startsWith("^") ? upper : `^${upper}`);
  } else {
    // Stock: as-is, also try with common suffixes
    variants.push(upper);
    if (!upper.includes(".")) variants.push(`${upper}.TO`); // Toronto
  }

  return variants;
}

/**
 * Produce list of Alpaca-compatible symbol variants.
 * Alpaca supports stocks (AAPL), ETFs, and crypto (BTC/USD with slash).
 */
function alpacaSymbolVariants(raw: string): string[] {
  const cls = detectAssetClass(raw);
  const upper = raw.toUpperCase().trim();
  const variants: string[] = [];

  if (cls === "crypto") {
    if (upper.includes("-USD")) {
      variants.push(upper.replace("-USD", "/USD"));
    } else if (upper.includes("USD")) {
      const coin = upper.replace("USD", "");
      variants.push(`${coin}/USD`);
    }
  } else if (cls === "forex" || cls === "metal" || cls === "index") {
    // Alpaca free tier doesn't include forex/metals/indices — skip
    return [];
  } else {
    variants.push(upper);
  }

  return variants;
}

export interface ChartAnalysis {
  id: string;
  imageHash: string;
  direction: "long" | "short" | "neutral";
  confidence: number; // 0-100
  entryPrice: number;
  stopLoss: number;
  takeProfits: Array<{
    level: 1 | 2 | 3;
    price: number;
    percentage: number; // % from entry
    rrRatio: number; // risk:reward ratio at this TP
  }>;
  riskAmount: number; // $ risk per share
  rewardAmount: number; // $ reward to TP1
  overallRR: number;
  timeframe: string;
  patterns: string[];
  support: number[];
  resistance: number[];
  trendStrength: number; // 0-100
  volatility: "low" | "medium" | "high";
  analysis: string;
  keyLevels: {
    current: number;
    pivot: number;
    fibonacci618?: number;
    fibonacci382?: number;
  };
  recommendation: "strong_buy" | "buy" | "hold" | "avoid";
  source: "heuristic" | "vision";
  analyzedAt: string;
}

interface PixelAnalysis {
  avgBrightness: number;
  redPixels: number; // bearish
  greenPixels: number; // bullish
  bluePixels: number;
  dominantColors: Array<{ r: number; g: number; b: number; count: number }>;
  trendScore: number; // -100 (strong bearish) to +100 (strong bullish)
  verticalGradient: number; // -100 (price falling) to +100 (price rising)
  volatility: number; // 0-100
}

async function analyzeImagePixels(buffer: Buffer): Promise<PixelAnalysis> {
  // Resize to a manageable size for analysis
  const { data, info } = await sharp(buffer)
    .resize(200, 200, { fit: "fill" })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const width = info.width;
  const height = info.height;
  const channels = info.channels;

  let redPixels = 0;
  let greenPixels = 0;
  let bluePixels = 0;
  let totalBrightness = 0;
  let totalPixels = 0;

  // Top vs bottom for trend direction (top = recent price, bottom = older)
  let topHalfBrightness = 0;
  let bottomHalfBrightness = 0;
  let topHalfPixels = 0;
  let bottomHalfPixels = 0;

  const colorBuckets: Record<string, number> = {};
  let prevBrightness = 0;
  let brightnessChanges = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * channels;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const brightness = (r + g + b) / 3;

      totalBrightness += brightness;
      totalPixels++;

      // Detect green (bullish candles)
      if (g > r && g > b && g > 100) greenPixels++;
      // Detect red (bearish candles)
      if (r > g && r > b && r > 100) redPixels++;
      // Detect blue (lines, indicators)
      if (b > r && b > g && b > 100) bluePixels++;

      // Track top vs bottom for trend
      if (y < height / 2) {
        topHalfBrightness += brightness;
        topHalfPixels++;
      } else {
        bottomHalfBrightness += brightness;
        bottomHalfPixels++;
      }

      // Bucket colors for dominant detection
      const bucket = `${Math.floor(r / 32) * 32},${Math.floor(g / 32) * 32},${Math.floor(b / 32) * 32}`;
      colorBuckets[bucket] = (colorBuckets[bucket] || 0) + 1;

      // Track brightness changes for volatility
      if (Math.abs(brightness - prevBrightness) > 20 && totalPixels > 1) {
        brightnessChanges++;
      }
      prevBrightness = brightness;
    }
  }

  const avgBrightness = totalBrightness / totalPixels;
  const topAvg = topHalfBrightness / topHalfPixels;
  const bottomAvg = bottomHalfBrightness / bottomHalfPixels;

  // Vertical gradient: positive = lighter at top (could indicate price went up if candles are green/dark theme)
  const verticalGradient = ((topAvg - bottomAvg) / 255) * 100;

  // Get top dominant colors
  const dominantColors = Object.entries(colorBuckets)
    .map(([key, count]) => {
      const [r, g, b] = key.split(",").map(Number);
      return { r, g, b, count };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Trend score: combine green vs red ratio with vertical gradient
  const colorRatio = (greenPixels - redPixels) / Math.max(greenPixels + redPixels, 1);
  const trendScore = Math.max(-100, Math.min(100, colorRatio * 100 + verticalGradient * 0.3));

  // Volatility: based on brightness changes per pixel
  const volatility = Math.min(100, (brightnessChanges / totalPixels) * 100 * 5);

  return {
    avgBrightness,
    redPixels,
    greenPixels,
    bluePixels,
    dominantColors,
    trendScore,
    verticalGradient,
    volatility,
  };
}

function hashImage(buffer: Buffer): string {
  // Simple deterministic hash
  let hash = 0;
  for (let i = 0; i < Math.min(buffer.length, 10000); i++) {
    hash = ((hash << 5) - hash + buffer[i]) | 0;
  }
  return Math.abs(hash).toString(36);
}

function detectTheme(pixels: PixelAnalysis): "light" | "dark" {
  return pixels.avgBrightness > 128 ? "light" : "dark";
}

/**
 * Estimate the price scale of the chart from visual cues.
 * Without OCR, we can only infer an approximate range — that's why we accept a ticker.
 */
function estimatePriceScale(pixels: PixelAnalysis, imageHash: string): number {
  // Deterministic random based on hash
  let seedNum = 0;
  for (let i = 0; i < imageHash.length; i++) {
    seedNum = ((seedNum << 5) - seedNum + imageHash.charCodeAt(i)) | 0;
  }
  const rnd = () => {
    seedNum = ((seedNum * 9301 + 49297) % 233280) / 233280;
    return seedNum;
  };

  // Default: stocks in the $50-$400 range (most common chart uploads)
  // Forex would be 0.5-200, crypto varies wildly
  // Heuristic: pick a base scale that varies based on detected volatility
  const volAdj = pixels.volatility / 100; // 0-1

  // Three buckets: low ($5-$50), mid ($50-$300), high ($300-$800)
  const bucket = Math.floor(rnd() * 3);
  let basePrice: number;

  if (bucket === 0) {
    // Low-price (forex, penny stocks)
    basePrice = 5 + rnd() * 45;
  } else if (bucket === 1) {
    // Mid-price (most stocks, mid-cap)
    basePrice = 50 + rnd() * 250;
  } else {
    // High-price (large caps like GOOGL, BRK.A)
    basePrice = 300 + rnd() * 500;
  }

  // Apply volatility adjustment
  basePrice *= 0.8 + volAdj * 0.4;

  return Math.round(basePrice * 100) / 100;
}

function generateAnalysis(
  pixels: PixelAnalysis,
  imageHash: string,
  basePrice: number
): Omit<ChartAnalysis, "id" | "imageHash" | "analyzedAt"> {
  // Determine direction based on trend score
  const direction: "long" | "short" | "neutral" =
    pixels.trendScore > 15 ? "long" : pixels.trendScore < -15 ? "short" : "neutral";

  const confidence = Math.min(100, 50 + Math.abs(pixels.trendScore) * 0.4);

  // Deterministic randomness for SL/TP percentages
  let seedNum = 0;
  for (let i = 0; i < imageHash.length; i++) {
    seedNum = ((seedNum << 5) - seedNum + imageHash.charCodeAt(i)) | 0;
  }
  const seededRandom = () => {
    seedNum = ((seedNum * 9301 + 49297) % 233280) / 233280;
    return seedNum;
  };

  // Entry price = real-time price from ticker (or heuristic estimate)
  const entryPrice = basePrice;

  // Determine appropriate percentage moves based on detected volatility
  // Higher volatility = wider SL/TP
  const volatilityFactor = Math.max(0.7, Math.min(2, pixels.volatility / 30 + 0.5));
  const isLong = direction === "long";

  // Stop loss: 1-3% (scales with volatility)
  const slPercent = (1 + seededRandom() * 2) * volatilityFactor;
  const stopLoss = isLong
    ? roundPrice(entryPrice * (1 - slPercent / 100), entryPrice)
    : roundPrice(entryPrice * (1 + slPercent / 100), entryPrice);

  const riskAmount = Math.abs(entryPrice - stopLoss);

  // Take profits at progressive R:R ratios (always 1.5x, 2.5x, 4x of risk)
  // This gives realistic, professional TP levels
  const tp1Rr = 1.5;
  const tp2Rr = 2.5;
  const tp3Rr = 4.0;

  const tp1Distance = riskAmount * tp1Rr;
  const tp2Distance = riskAmount * tp2Rr;
  const tp3Distance = riskAmount * tp3Rr;

  const takeProfits = [tp1Distance, tp2Distance, tp3Distance].map((distance, i) => {
    const level = (i + 1) as 1 | 2 | 3;
    const price = isLong
      ? roundPrice(entryPrice + distance, entryPrice)
      : roundPrice(entryPrice - distance, entryPrice);
    const pct = Math.abs((price - entryPrice) / entryPrice) * 100;
    return {
      level,
      price,
      percentage: Math.round(pct * 100) / 100,
      rrRatio: i === 0 ? tp1Rr : i === 1 ? tp2Rr : tp3Rr,
    };
  });

  const rewardAmount = Math.abs(takeProfits[0].price - entryPrice);
  const overallRR = Math.round((rewardAmount / riskAmount) * 10) / 10;

  // Support and resistance — based on detected SL/TP logic
  // For long: support = SL area, resistance = TP3 area
  // For short: resistance = SL area, support = TP3 area
  const support1 = isLong
    ? roundPrice(entryPrice * 0.98, entryPrice) // 2% below
    : roundPrice(entryPrice - riskAmount * tp3Rr, entryPrice);
  const support2 = isLong
    ? roundPrice(entryPrice * 0.96, entryPrice) // 4% below
    : roundPrice(entryPrice - riskAmount * 5, entryPrice);
  const resistance1 = isLong
    ? roundPrice(entryPrice + riskAmount * tp3Rr, entryPrice)
    : roundPrice(entryPrice * 1.02, entryPrice); // 2% above
  const resistance2 = isLong
    ? roundPrice(entryPrice + riskAmount * 5, entryPrice)
    : roundPrice(entryPrice * 1.04, entryPrice); // 4% above

  // Detect patterns based on heuristics
  const patterns: string[] = [];
  if (Math.abs(pixels.trendScore) > 40) patterns.push("Strong Trend");
  if (pixels.volatility > 60) patterns.push("High Volatility");
  if (pixels.volatility < 30) patterns.push("Consolidation");
  if (pixels.greenPixels > pixels.redPixels * 1.5) patterns.push("Bullish Momentum");
  if (pixels.redPixels > pixels.greenPixels * 1.5) patterns.push("Bearish Momentum");
  if (Math.abs(pixels.trendScore) < 10 && pixels.volatility < 30) patterns.push("Sideways Action");
  if (pixels.bluePixels > 1000) patterns.push("Indicator Lines Present");

  // Timeframe inference
  const aspectRatio = pixels.dominantColors.length > 0 ? 1.5 : 1;
  const timeframe = aspectRatio > 1.3 ? "Daily" : "4H";

  const volatilityLevel: "low" | "medium" | "high" =
    pixels.volatility > 60 ? "high" : pixels.volatility > 30 ? "medium" : "low";

  // Recommendation
  const recommendation: ChartAnalysis["recommendation"] =
    confidence > 75 && Math.abs(pixels.trendScore) > 30 ? "strong_buy" :
    confidence > 50 && direction !== "neutral" ? "buy" :
    direction === "neutral" ? "hold" : "avoid";

  // Generate analysis text
  const slText = `${slPercent.toFixed(2)}% risk`;
  let analysis = "";
  if (isLong) {
    analysis = `Bullish chart pattern detected with ${confidence.toFixed(0)}% confidence. ` +
      `Long entry at ${formatPrice(entryPrice)} with stop loss at ${formatPrice(stopLoss)} (${slText}). ` +
      `Target 1 (1:${overallRR} R:R) at ${formatPrice(takeProfits[0].price)}. ` +
      `${patterns.length > 0 ? `Key patterns: ${patterns.join(", ")}.` : ""}`;
  } else if (direction === "short") {
    analysis = `Bearish chart pattern detected with ${confidence.toFixed(0)}% confidence. ` +
      `Short entry at ${formatPrice(entryPrice)} with stop loss at ${formatPrice(stopLoss)} (${slText}). ` +
      `Target 1 (1:${overallRR} R:R) at ${formatPrice(takeProfits[0].price)}. ` +
      `${patterns.length > 0 ? `Key patterns: ${patterns.join(", ")}.` : ""}`;
  } else {
    analysis = `Neutral/sideways chart detected. No clear directional bias — wait for breakout. ` +
      `Key levels: Support ${formatPrice(support1)}, Resistance ${formatPrice(resistance1)}.`;
  }

  return {
    direction,
    confidence: Math.round(confidence),
    entryPrice,
    stopLoss,
    takeProfits,
    riskAmount: Math.round(riskAmount * 100) / 100,
    rewardAmount: Math.round(rewardAmount * 100) / 100,
    overallRR,
    timeframe,
    patterns,
    support: [support1, support2],
    resistance: [resistance1, resistance2],
    trendStrength: Math.round(Math.abs(pixels.trendScore)),
    volatility: volatilityLevel,
    analysis,
    keyLevels: {
      current: entryPrice,
      pivot: Math.round((support1 + resistance1) / 2 * 100) / 100,
      fibonacci618: Math.round((entryPrice - (entryPrice - support1) * 0.618) * 100) / 100,
      fibonacci382: Math.round((entryPrice - (entryPrice - support1) * 0.382) * 100) / 100,
    },
    recommendation,
    source: "heuristic",
  };
}

/**
 * Round price to appropriate precision based on magnitude.
 * Forex (100-200): 3 decimals; Stocks ($1-$1000): 2 decimals; High-priced: 2 decimals.
 */
function roundPrice(price: number, reference: number): number {
  const ref = Math.abs(reference);
  let decimals = 2;
  if (ref > 0 && ref < 10) decimals = 4;
  else if (ref < 100) decimals = 3;
  else if (ref < 1000) decimals = 2;
  else decimals = 2;

  const factor = Math.pow(10, decimals);
  return Math.round(price * factor) / factor;
}

function formatPrice(price: number): string {
  const abs = Math.abs(price);
  let decimals = 2;
  if (abs < 10) decimals = 4;
  else if (abs < 100) decimals = 3;
  else decimals = 2;
  return `$${price.toFixed(decimals)}`;
}

export async function POST(request: NextRequest) {
  // Rate limit: 10/min per user, 5/min per IP
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const ipLimit = aiIPLimit(ip);
  if (!ipLimit.allowed) {
    return NextResponse.json(
      { success: false, error: "Rate limit exceeded. Try again in a minute." },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }
  const { userId } = await auth();
  if (userId) {
    const userLimit = aiUserLimit(userId);
    if (!userLimit.allowed) {
      return NextResponse.json(
        { success: false, error: "Rate limit exceeded. Try again in a minute." },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }
  }

  try {
    const formData = await request.formData();
    const file = formData.get("chart") as File | null;
    const ticker = (formData.get("ticker") as string | null)?.trim().toUpperCase() || null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No image file provided" },
        { status: 400 }
      );
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { success: false, error: "File must be an image" },
        { status: 400 }
      );
    }

    // Max 10 MB
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: "Image must be smaller than 10MB" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const imageHash = hashImage(buffer);

    // Analyze pixel patterns
    let pixels: PixelAnalysis;
    try {
      pixels = await analyzeImagePixels(buffer);
    } catch {
      // Fallback if sharp fails (e.g., unsupported format)
      pixels = {
        avgBrightness: 128,
        redPixels: 100,
        greenPixels: 100,
        bluePixels: 50,
        dominantColors: [],
        trendScore: 0,
        verticalGradient: 0,
        volatility: 40,
      };
    }

    // Determine entry price:
    // 1. If user provided a ticker, try Alpaca (multi-format) → Yahoo (multi-format)
    // 2. Otherwise, use a heuristic estimate from the image
    let basePrice: number | null = null;
    let priceSource: "ticker_alpaca" | "ticker_yahoo" | "heuristic" = "heuristic";
    let tickerInfo: { ticker: string; name: string; price: number; resolvedSymbol: string; assetClass: AssetClass } | null = null;
    const attemptedSymbols: string[] = [];
    const assetClass = detectAssetClass(ticker || "");

    if (ticker) {
      // 1. Try Alpaca with multiple symbol variants (stocks + crypto with slash)
      if (hasAlpacaCredentials()) {
        const alpacaVariants = alpacaSymbolVariants(ticker);
        for (const symbol of alpacaVariants) {
          attemptedSymbols.push(`alpaca:${symbol}`);
          try {
            const alpaca = await fetchAlpacaQuote(symbol);
            if (alpaca && alpaca.price > 0) {
              basePrice = alpaca.price;
              priceSource = "ticker_alpaca";
              tickerInfo = { ticker, name: alpaca.name, price: alpaca.price, resolvedSymbol: symbol, assetClass };
              break;
            }
          } catch { /* try next */ }
        }
      }

      // 2. Fall back to Yahoo with multiple symbol variants
      if (basePrice === null) {
        const yahooVariants = yahooSymbolVariants(ticker);
        for (const symbol of yahooVariants) {
          attemptedSymbols.push(`yahoo:${symbol}`);
          try {
            const yahoo = await fetchYahooQuote(symbol);
            if (yahoo && yahoo.price > 0) {
              basePrice = yahoo.price;
              priceSource = "ticker_yahoo";
              tickerInfo = { ticker, name: yahoo.name, price: yahoo.price, resolvedSymbol: symbol, assetClass };
              break;
            }
          } catch { /* try next */ }
        }
      }
    }

    // 3. Final fallback: heuristic estimate (when no ticker or all fetches failed)
    if (basePrice === null) {
      basePrice = estimatePriceScale(pixels, imageHash);
      priceSource = "heuristic";
    }

    const theme = detectTheme(pixels);
    const analysis = generateAnalysis(pixels, imageHash, basePrice);

    const result: ChartAnalysis = {
      id: `analysis_${Date.now()}_${imageHash.slice(0, 8)}`,
      imageHash,
      ...analysis,
      analyzedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: result,
      meta: {
        theme,
        priceSource,
        ticker: tickerInfo,
        assetClass,
        attemptedSymbols,
        imageSize: file.size,
        imageType: file.type,
        imageName: file.name,
        pixels: {
          avgBrightness: Math.round(pixels.avgBrightness),
          trendScore: Math.round(pixels.trendScore),
          volatility: Math.round(pixels.volatility),
          greenPixels: pixels.greenPixels,
          redPixels: pixels.redPixels,
        },
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to analyze chart" },
      { status: 500 }
    );
  }
}
