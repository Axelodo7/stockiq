/** Shared mock data utilities for generating stock data and price history. */

/** Global real-price cache populated by Yahoo Finance fetches.
 *  getStockInfo checks this first so every page shows correct prices. */
import { seededRandom } from "@/lib/utils";

const realPriceCache = new Map<string, { price: number; name?: string; change?: number; changePercent?: number; volume?: number; high52w?: number; low52w?: number }>();

export function setRealPrice(ticker: string, data: { price: number; name?: string; change?: number; changePercent?: number; volume?: number; high52w?: number; low52w?: number }) {
  realPriceCache.set(ticker.toUpperCase(), data);
}



/** Server-side: fetch real price via Alpaca (or Yahoo fallback), cache it, return price. */
export async function fetchRealPriceServer(ticker: string): Promise<number | null> {
  const t = ticker.toUpperCase();
  const cached = realPriceCache.get(t);
  if (cached && cached.price > 0) return cached.price;

  const { fetchAlpacaQuote, fetchYahooQuote } = await import("./market-api");
  const alpaca = await fetchAlpacaQuote(t);
  if (alpaca) {
    setRealPrice(t, { price: alpaca.price, change: alpaca.change, changePercent: alpaca.changePercent, volume: alpaca.volume, name: alpaca.name });
    return alpaca.price;
  }

  const yahoo = await fetchYahooQuote(t);
  if (yahoo) {
    setRealPrice(t, { price: yahoo.price, change: yahoo.change, changePercent: yahoo.changePercent, volume: yahoo.volume, name: yahoo.name });
    return yahoo.price;
  }

  return null;
}


export interface StockInfo {
  name: string;
  sector: string;
  price: number;
  change: number;
  changePercent: number;
  marketCap: number;
  volume: number;
  peRatio: number;
  eps: number;
  dividend: number;
  beta: number;
  high52w: number;
  low52w: number;
  open: number;
  high: number;
  low: number;
  prevClose: number;
}

export const stockData: Record<string, StockInfo> = {
  AAPL: {
    name: "Apple Inc.",
    sector: "Technology",
    price: 298.01,
    change: 2.06,
    changePercent: 0.70,
    marketCap: 4.62e12,
    volume: 76_700_000,
    peRatio: 33.12,
    eps: 6.47,
    dividend: 0.96,
    beta: 1.24,
    high52w: 317.40,
    low52w: 196.86,
    open: 298.01,
    high: 300.57,
    low: 295.62,
    prevClose: 295.95,
  },
  GOOGL: {
    name: "Alphabet Inc.",
    sector: "Technology",
    price: 368.03,
    change: 4.24,
    changePercent: 1.17,
    marketCap: 2.15e12,
    volume: 44_359_000,
    peRatio: 24.87,
    eps: 7.09,
    dividend: 0,
    beta: 1.06,
    high52w: 408.61,
    low52w: 162.00,
    open: 368.03,
    high: 369.48,
    low: 358.67,
    prevClose: 363.79,
  },
  MSFT: {
    name: "Microsoft Corp.",
    sector: "Technology",
    price: 379.40,
    change: 0.49,
    changePercent: 0.13,
    marketCap: 2.82e12,
    volume: 58_466_000,
    peRatio: 37.68,
    eps: 11.95,
    dividend: 3.32,
    beta: 0.93,
    high52w: 555.45,
    low52w: 356.28,
    open: 379.40,
    high: 381.37,
    low: 373.28,
    prevClose: 378.91,
  },
  AMZN: {
    name: "Amazon.com Inc.",
    sector: "E-Commerce",
    price: 220.12,
    change: -0.87,
    changePercent: -0.39,
    marketCap: 2.32e12,
    volume: 42_100_000,
    peRatio: 42.15,
    eps: 5.2,
    dividend: 0,
    beta: 1.15,
    high52w: 242.52,
    low52w: 161.02,
    open: 221.00,
    high: 222.00,
    low: 218.50,
    prevClose: 220.99,
  },
  TSLA: {
    name: "Tesla Inc.",
    sector: "Automotive",
    price: 400.49,
    change: 4.11,
    changePercent: 1.04,
    marketCap: 1.29e12,
    volume: 54_706_000,
    peRatio: 128.53,
    eps: 2.51,
    dividend: 0,
    beta: 2.08,
    high52w: 498.83,
    low52w: 288.77,
    open: 400.49,
    high: 402.52,
    low: 384.70,
    prevClose: 396.38,
  },
  NVDA: {
    name: "NVIDIA Corp.",
    sector: "Technology",
    price: 210.69,
    change: 6.04,
    changePercent: 2.95,
    marketCap: 5.13e12,
    volume: 238_264_000,
    peRatio: 54.89,
    eps: 2.62,
    dividend: 0.01,
    beta: 1.67,
    high52w: 236.54,
    low52w: 142.03,
    open: 210.69,
    high: 211.39,
    low: 206.50,
    prevClose: 204.65,
  },
  META: {
    name: "Meta Platforms Inc.",
    sector: "Technology",
    price: 612.77,
    change: 8.91,
    changePercent: 1.47,
    marketCap: 1.56e12,
    volume: 18_300_000,
    peRatio: 28.5,
    eps: 21.5,
    dividend: 0,
    beta: 1.25,
    high52w: 650.0,
    low52w: 420.0,
    open: 604.0,
    high: 615.0,
    low: 602.0,
    prevClose: 603.86,
  },
  JPM: {
    name: "JPMorgan Chase & Co.",
    sector: "Financial",
    price: 267.43,
    change: -1.24,
    changePercent: -0.46,
    marketCap: 771e9,
    volume: 9_800_000,
    peRatio: 13.2,
    eps: 20.26,
    dividend: 5.0,
    beta: 1.1,
    high52w: 296.0,
    low52w: 190.0,
    open: 268.7,
    high: 269.5,
    low: 265.8,
    prevClose: 268.67,
  },
  CRM: {
    name: "Salesforce Inc.",
    sector: "Technology",
    price: 151.0,
    change: 2.15,
    changePercent: 1.44,
    marketCap: 145e9,
    volume: 8_500_000,
    peRatio: 45.0,
    eps: 3.36,
    dividend: 0,
    beta: 1.3,
    high52w: 185.0,
    low52w: 120.0,
    open: 149.0,
    high: 152.5,
    low: 148.2,
    prevClose: 148.85,
  },
  NFLX: {
    name: "Netflix Inc.",
    sector: "Technology",
    price: 1180.0,
    change: 15.2,
    changePercent: 1.31,
    marketCap: 510e9,
    volume: 4_200_000,
    peRatio: 50.0,
    eps: 23.6,
    dividend: 0,
    beta: 1.4,
    high52w: 1250.0,
    low52w: 750.0,
    open: 1165.0,
    high: 1185.0,
    low: 1160.0,
    prevClose: 1164.8,
  },
  AMD: {
    name: "Advanced Micro Devices",
    sector: "Technology",
    price: 165.0,
    change: 3.8,
    changePercent: 2.36,
    marketCap: 266e9,
    volume: 55_000_000,
    peRatio: 45.0,
    eps: 3.67,
    dividend: 0,
    beta: 1.7,
    high52w: 200.0,
    low52w: 115.0,
    open: 161.2,
    high: 166.5,
    low: 160.0,
    prevClose: 161.2,
  },
  BAC: {
    name: "Bank of America Corp.",
    sector: "Financial",
    price: 45.5,
    change: -0.32,
    changePercent: -0.7,
    marketCap: 340e9,
    volume: 35_000_000,
    peRatio: 13.0,
    eps: 3.5,
    dividend: 0.92,
    beta: 1.15,
    high52w: 52.0,
    low52w: 33.0,
    open: 45.8,
    high: 46.0,
    low: 45.0,
    prevClose: 45.82,
  },
  KO: {
    name: "Coca-Cola Co.",
    sector: "Consumer Staples",
    price: 62.0,
    change: 0.15,
    changePercent: 0.24,
    marketCap: 268e9,
    volume: 12_000_000,
    peRatio: 25.0,
    eps: 2.48,
    dividend: 1.94,
    beta: 0.6,
    high52w: 70.0,
    low52w: 55.0,
    open: 61.8,
    high: 62.3,
    low: 61.5,
    prevClose: 61.85,
  },
  V: {
    name: "Visa Inc.",
    sector: "Financial",
    price: 320.15,
    change: 2.04,
    changePercent: 0.64,
    marketCap: 640e9,
    volume: 7_200_000,
    peRatio: 31.0,
    eps: 10.33,
    dividend: 2.08,
    beta: 0.95,
    high52w: 350.0,
    low52w: 252.0,
    open: 318.0,
    high: 321.5,
    low: 317.0,
    prevClose: 318.11,
  },
  JNJ: {
    name: "Johnson & Johnson",
    sector: "Healthcare",
    price: 156.30,
    change: 0.41,
    changePercent: 0.26,
    marketCap: 377e9,
    volume: 7_500_000,
    peRatio: 16.0,
    eps: 9.77,
    dividend: 4.96,
    beta: 0.55,
    high52w: 168.0,
    low52w: 140.0,
    open: 155.8,
    high: 157.0,
    low: 155.0,
    prevClose: 155.89,
  },
  WMT: {
    name: "Walmart Inc.",
    sector: "Consumer Staples",
    price: 97.12,
    change: -0.32,
    changePercent: -0.33,
    marketCap: 783e9,
    volume: 15_000_000,
    peRatio: 38.0,
    eps: 2.56,
    dividend: 0.83,
    beta: 0.5,
    high52w: 105.0,
    low52w: 65.0,
    open: 97.4,
    high: 97.8,
    low: 96.5,
    prevClose: 97.44,
  },
  XOM: {
    name: "Exxon Mobil Corp.",
    sector: "Energy",
    price: 109.45,
    change: -1.84,
    changePercent: -1.66,
    marketCap: 460e9,
    volume: 14_000_000,
    peRatio: 14.0,
    eps: 7.82,
    dividend: 3.8,
    beta: 0.85,
    high52w: 125.0,
    low52w: 95.0,
    open: 111.2,
    high: 111.8,
    low: 108.5,
    prevClose: 111.29,
  },
  UNH: {
    name: "UnitedHealth Group",
    sector: "Healthcare",
    price: 310.0,
    change: -4.5,
    changePercent: -1.43,
    marketCap: 282e9,
    volume: 5_000_000,
    peRatio: 18.0,
    eps: 17.22,
    dividend: 7.52,
    beta: 0.7,
    high52w: 400.0,
    low52w: 280.0,
    open: 314.0,
    high: 315.0,
    low: 308.0,
    prevClose: 314.5,
  },
  HD: {
    name: "Home Depot Inc.",
    sector: "Consumer Disc.",
    price: 380.0,
    change: 5.2,
    changePercent: 1.39,
    marketCap: 378e9,
    volume: 4_500_000,
    peRatio: 26.0,
    eps: 14.62,
    dividend: 9.0,
    beta: 1.05,
    high52w: 420.0,
    low52w: 300.0,
    open: 375.0,
    high: 382.0,
    low: 374.0,
    prevClose: 374.8,
  },
  COST: {
    name: "Costco Wholesale",
    sector: "Consumer Staples",
    price: 960.0,
    change: 12.0,
    changePercent: 1.27,
    marketCap: 426e9,
    volume: 2_000_000,
    peRatio: 52.0,
    eps: 18.46,
    dividend: 4.64,
    beta: 0.75,
    high52w: 1050.0,
    low52w: 700.0,
    open: 948.0,
    high: 965.0,
    low: 945.0,
    prevClose: 948.0,
  },
  ABBV: {
    name: "AbbVie Inc.",
    sector: "Healthcare",
    price: 195.0,
    change: 1.8,
    changePercent: 0.93,
    marketCap: 345e9,
    volume: 6_000_000,
    peRatio: 16.0,
    eps: 12.19,
    dividend: 6.56,
    beta: 0.65,
    high52w: 210.0,
    low52w: 155.0,
    open: 193.2,
    high: 196.0,
    low: 192.5,
    prevClose: 193.2,
  },
  PG: {
    name: "Procter & Gamble",
    sector: "Consumer Staples",
    price: 168.0,
    change: 0.5,
    changePercent: 0.3,
    marketCap: 395e9,
    volume: 6_500_000,
    peRatio: 27.0,
    eps: 6.22,
    dividend: 4.0,
    beta: 0.45,
    high52w: 180.0,
    low52w: 150.0,
    open: 167.5,
    high: 169.0,
    low: 167.0,
    prevClose: 167.5,
  },
  MA: {
    name: "Mastercard Inc.",
    sector: "Financial",
    price: 530.0,
    change: 4.5,
    changePercent: 0.86,
    marketCap: 490e9,
    volume: 3_500_000,
    peRatio: 37.0,
    eps: 14.32,
    dividend: 2.36,
    beta: 1.1,
    high52w: 570.0,
    low52w: 400.0,
    open: 525.5,
    high: 532.0,
    low: 524.0,
    prevClose: 525.5,
  },
  LLY: {
    name: "Eli Lilly and Co.",
    sector: "Healthcare",
    price: 850.0,
    change: 15.0,
    changePercent: 1.8,
    marketCap: 807e9,
    volume: 3_000_000,
    peRatio: 110.0,
    eps: 7.73,
    dividend: 1.62,
    beta: 0.4,
    high52w: 970.0,
    low52w: 700.0,
    open: 835.0,
    high: 855.0,
    low: 832.0,
    prevClose: 835.0,
  },
};


/** Known names for displaying correct company names in search/dropdown. */
const knownNames: Record<string, { name: string; sector: string }> = {
  AAPL: { name: "Apple Inc.", sector: "Technology" },
  MSFT: { name: "Microsoft Corp.", sector: "Technology" },
  GOOGL: { name: "Alphabet Inc.", sector: "Technology" },
  AMZN: { name: "Amazon.com Inc.", sector: "E-Commerce" },
  NVDA: { name: "NVIDIA Corp.", sector: "Technology" },
  META: { name: "Meta Platforms Inc.", sector: "Technology" },
  TSLA: { name: "Tesla Inc.", sector: "Automotive" },
  JPM: { name: "JPMorgan Chase & Co.", sector: "Financial" },
  V: { name: "Visa Inc.", sector: "Financial" },
  UNH: { name: "UnitedHealth Group", sector: "Healthcare" },
  XOM: { name: "Exxon Mobil Corp.", sector: "Energy" },
  WMT: { name: "Walmart Inc.", sector: "Consumer Staples" },
  JNJ: { name: "Johnson & Johnson", sector: "Healthcare" },
  MA: { name: "Mastercard Inc.", sector: "Financial" },
  PG: { name: "Procter & Gamble", sector: "Consumer Staples" },
  HD: { name: "Home Depot Inc.", sector: "Consumer Disc." },
  COST: { name: "Costco Wholesale", sector: "Consumer Staples" },
  ABBV: { name: "AbbVie Inc.", sector: "Healthcare" },
  NFLX: { name: "Netflix Inc.", sector: "Technology" },
  CRM: { name: "Salesforce Inc.", sector: "Technology" },
  BAC: { name: "Bank of America", sector: "Financial" },
  AMD: { name: "Advanced Micro Devices", sector: "Technology" },
  KO: { name: "Coca-Cola Co.", sector: "Consumer Staples" },
  MRK: { name: "Merck & Co.", sector: "Healthcare" },
  CVX: { name: "Chevron Corp.", sector: "Energy" },
  ORCL: { name: "Oracle Corp.", sector: "Technology" },
  PEP: { name: "PepsiCo Inc.", sector: "Consumer Staples" },
  CSCO: { name: "Cisco Systems", sector: "Technology" },
  INTC: { name: "Intel Corp.", sector: "Technology" },
  DIS: { name: "Walt Disney Co.", sector: "Communication" },
  ADBE: { name: "Adobe Inc.", sector: "Technology" },
  PFE: { name: "Pfizer Inc.", sector: "Healthcare" },
  T: { name: "AT&T Inc.", sector: "Communication" },
  NKE: { name: "Nike Inc.", sector: "Consumer Disc." },
  TXN: { name: "Texas Instruments", sector: "Technology" },
  VZ: { name: "Verizon Communications", sector: "Communication" },
  QCOM: { name: "Qualcomm Inc.", sector: "Technology" },
  BA: { name: "Boeing Co.", sector: "Industrials" },
  GE: { name: "GE Aerospace", sector: "Industrials" },
  GS: { name: "Goldman Sachs Group", sector: "Financial" },
  CAT: { name: "Caterpillar Inc.", sector: "Industrials" },
  BLK: { name: "BlackRock Inc.", sector: "Financial" },
  PYPL: { name: "PayPal Holdings", sector: "Financial" },
  SHOP: { name: "Shopify Inc.", sector: "E-Commerce" },
  COIN: { name: "Coinbase Global", sector: "Financial" },
  PLTR: { name: "Palantir Technologies", sector: "Technology" },
  SNOW: { name: "Snowflake Inc.", sector: "Technology" },
  UBER: { name: "Uber Technologies", sector: "Technology" },
  ABNB: { name: "Airbnb Inc.", sector: "Consumer Disc." },
  SQ: { name: "Block Inc.", sector: "Financial" },
  RIVN: { name: "Rivian Automotive", sector: "Automotive" },
  SOFI: { name: "SoFi Technologies", sector: "Financial" },
  ROKU: { name: "Roku Inc.", sector: "Technology" },
  DKNG: { name: "DraftKings Inc.", sector: "Consumer Disc." },
  NET: { name: "Cloudflare Inc.", sector: "Technology" },
  DDOG: { name: "Datadog Inc.", sector: "Technology" },
  CRWD: { name: "CrowdStrike Holdings", sector: "Technology" },
  ZS: { name: "Zscaler Inc.", sector: "Technology" },
  PANW: { name: "Palo Alto Networks", sector: "Technology" },
  MDB: { name: "MongoDB Inc.", sector: "Technology" },
  ARM: { name: "Arm Holdings", sector: "Technology" },
  SMCI: { name: "Super Micro Computer", sector: "Technology" },
  HOOD: { name: "Robinhood Markets", sector: "Financial" },
  RBLX: { name: "Roblox Corp.", sector: "Technology" },
  SPOT: { name: "Spotify Technology", sector: "Communication" },
  SE: { name: "Sea Limited", sector: "Technology" },
  BABA: { name: "Alibaba Group", sector: "E-Commerce" },
  NIO: { name: "NIO Inc.", sector: "Automotive" },
  TSM: { name: "Taiwan Semiconductor", sector: "Technology" },
  ASML: { name: "ASML Holding", sector: "Technology" },
  NVO: { name: "Novo Nordisk A/S", sector: "Healthcare" },
  LLY: { name: "Eli Lilly & Co.", sector: "Healthcare" },
  AVGO: { name: "Broadcom Inc.", sector: "Technology" },
  BRK_B: { name: "Berkshire Hathaway", sector: "Financial" },
  PM: { name: "Philip Morris International", sector: "Consumer Staples" },
  TMO: { name: "Thermo Fisher Scientific", sector: "Healthcare" },
  ISRG: { name: "Intuitive Surgical", sector: "Healthcare" },
  SYK: { name: "Stryker Corp.", sector: "Healthcare" },
  DE: { name: "Deere & Co.", sector: "Industrials" },
  MCD: { name: "McDonald's Corp.", sector: "Consumer Disc." },
  CME: { name: "CME Group Inc.", sector: "Financial" },
  SO: { name: "Southern Company", sector: "Utilities" },
  BMY: { name: "Bristol-Myers Squibb", sector: "Healthcare" },
  CI: { name: "Cigna Group", sector: "Healthcare" },
  FDX: { name: "FedEx Corp.", sector: "Industrials" },
  SLB: { name: "Schlumberger N.V.", sector: "Energy" },
  EOG: { name: "EOG Resources", sector: "Energy" },
  TGT: { name: "Target Corp.", sector: "Consumer Disc." },
  LOW: { name: "Lowe's Companies", sector: "Consumer Disc." },
  SBUX: { name: "Starbucks Corp.", sector: "Consumer Disc." },
  TJX: { name: "TJX Companies", sector: "Consumer Disc." },
  CL: { name: "Colgate-Palmolive", sector: "Consumer Staples" },
  MDLZ: { name: "Mondelez International", sector: "Consumer Staples" },
  GILD: { name: "Gilead Sciences", sector: "Healthcare" },
  AMGN: { name: "Amgen Inc.", sector: "Healthcare" },
  REGN: { name: "Regeneron Pharmaceuticals", sector: "Healthcare" },
  VRTX: { name: "Vertex Pharmaceuticals", sector: "Healthcare" },
  ZTS: { name: "Zoetis Inc.", sector: "Healthcare" },
  MDT: { name: "Medtronic plc", sector: "Healthcare" },
  ABT: { name: "Abbott Laboratories", sector: "Healthcare" },
  PPL: { name: "PPL Corp.", sector: "Utilities" },
  DUK: { name: "Duke Energy", sector: "Utilities" },
  CEG: { name: "Constellation Energy", sector: "Utilities" },
  VST: { name: "Vistra Corp.", sector: "Utilities" },
  IONQ: { name: "IonQ Inc.", sector: "Technology" },
  RGTI: { name: "Rigetti Computing", sector: "Technology" },
  LCID: { name: "Lucid Group", sector: "Automotive" },
  PATH: { name: "UiPath Inc.", sector: "Technology" },
  LYFT: { name: "Lyft Inc.", sector: "Technology" },
  PINS: { name: "Pinterest Inc.", sector: "Communication" },
  SNAP: { name: "Snap Inc.", sector: "Communication" },
  BIDU: { name: "Baidu Inc.", sector: "Technology" },
  JD: { name: "JD.com Inc.", sector: "E-Commerce" },
  PDD: { name: "PDD Holdings", sector: "E-Commerce" },
  LI: { name: "Li Auto Inc.", sector: "Automotive" },
  XPEV: { name: "XPeng Inc.", sector: "Automotive" },
  SONY: { name: "Sony Group Corp.", sector: "Technology" },
  TM: { name: "Toyota Motor Corp.", sector: "Automotive" },
  SAP: { name: "SAP SE", sector: "Technology" },
  TTD: { name: "The Trade Desk", sector: "Technology" },
  MARA: { name: "Marathon Digital Holdings", sector: "Technology" },
  RIOT: { name: "Riot Platforms", sector: "Technology" },
};

/** Get stock info for any ticker — checks real price cache first, then known data, then generates mock. */
export function getStockInfo(ticker: string): StockInfo {
  const t = ticker.toUpperCase();
  const cached = realPriceCache.get(t);
  if (cached && stockData[t]) {
    return { ...stockData[t], price: cached.price, ...(cached.name ? { name: cached.name } : {}), ...(cached.change != null ? { change: cached.change } : {}), ...(cached.changePercent != null ? { changePercent: cached.changePercent } : {}), ...(cached.volume != null ? { volume: cached.volume } : {}), ...(cached.high52w != null ? { high52w: cached.high52w } : {}), ...(cached.low52w != null ? { low52w: cached.low52w } : {}) };
  }
  if (cached) {
    const known = knownNames[t];
    return {
      name: cached.name || known?.name || `${t} Corp.`,
      sector: known?.sector || "Technology",
      price: cached.price,
      change: cached.change ?? 0,
      changePercent: cached.changePercent ?? 0,
      marketCap: 0,
      volume: cached.volume ?? 0,
      peRatio: 0,
      eps: 0,
      dividend: 0,
      beta: 1,
      high52w: cached.high52w ?? cached.price * 1.2,
      low52w: cached.low52w ?? cached.price * 0.8,
      open: cached.price,
      high: cached.price,
      low: cached.price,
      prevClose: cached.price,
    };
  }
  if (stockData[t]) return stockData[t];

  const known = knownNames[t];
  

  return {
    name: known?.name || `${t} Corp.`,
    sector: known?.sector || "Unknown",
    price: 0,
    change: 0,
    changePercent: 0,
    marketCap: 0,
    volume: 0,
    peRatio: 0,
    eps: 0,
    dividend: 0,
    beta: 1,
    high52w: 0,
    low52w: 0,
    open: 0,
    high: 0,
    low: 0,
    prevClose: 0,
  };
}

export interface OHLCVBar {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/** Generate full OHLCV price history with realistic candle structures.
 *  Always ends with close === base. Uses seeded PRNG for determinism. */
export function generatePriceHistory(
  base: number,
  days = 4788
): OHLCVBar[] {
  if (!base || base <= 0) return [];
  const data: OHLCVBar[] = [];
  let value = base * 0.85;
  const now = new Date();
  const rng = seededRandom(Math.round(base * 1000) + days);

  for (let i = days; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    if (d.getDay() === 0 || d.getDay() === 6) continue;

    const change = (rng() - 0.48) * value * 0.025;
    const open = value;
    const close = value + change;
    const high = Math.max(open, close) + rng() * value * 0.008;
    const low = Math.min(open, close) - rng() * value * 0.008;

    data.push({
      date: d.toISOString().split("T")[0],
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume: Math.floor(rng() * 50_000_000 + 10_000_000),
    });

    value = close;
  }

  // Scale the entire history so the last bar ends exactly at base
  if (data.length > 0) {
    const lastClose = data[data.length - 1].close;
    if (Math.abs(lastClose - base) > 0.01) {
      const factor = base / lastClose;
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
