/** Shared mock data utilities for generating stock data and price history. */

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
};

/** Simple string hash for deterministic pseudo-random data per ticker. */
function hashStr(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

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

/** Get stock info for any ticker — uses known data or generates deterministic mock data. */
export function getStockInfo(ticker: string): StockInfo {
  const t = ticker.toUpperCase();
  if (stockData[t]) return stockData[t];

  const rand = seededRandom(hashStr(t));
  const basePrice = 20 + rand() * 480; // $20 - $500
  const change = (rand() - 0.45) * basePrice * 0.05;
  const changePercent = (change / basePrice) * 100;
  const high52w = basePrice * (1.1 + rand() * 0.4);
  const low52w = basePrice * (0.5 + rand() * 0.3);
  const known = knownNames[t];

  return {
    name: known?.name || `${t} Corp.`,
    sector: known?.sector || ["Technology", "Healthcare", "Financial", "Energy", "Consumer Disc.", "Industrials", "Communication"][Math.floor(rand() * 7)],
    price: Math.round(basePrice * 100) / 100,
    change: Math.round(change * 100) / 100,
    changePercent: Math.round(changePercent * 100) / 100,
    marketCap: Math.round((basePrice * (1e9 + rand() * 3e12))),
    volume: Math.floor(5e6 + rand() * 100e6),
    peRatio: Math.round((10 + rand() * 50) * 10) / 10,
    eps: Math.round((basePrice / (10 + rand() * 30)) * 100) / 100,
    dividend: rand() > 0.4 ? Math.round(rand() * 4 * 100) / 100 : 0,
    beta: Math.round((0.6 + rand() * 1.8) * 100) / 100,
    high52w: Math.round(high52w * 100) / 100,
    low52w: Math.round(low52w * 100) / 100,
    open: Math.round((basePrice - change * 0.3) * 100) / 100,
    high: Math.round((basePrice + Math.abs(change) * 0.5) * 100) / 100,
    low: Math.round((basePrice - Math.abs(change) * 0.5) * 100) / 100,
    prevClose: Math.round((basePrice - change) * 100) / 100,
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

/** Generate full OHLCV price history with realistic candle structures. */
export function generatePriceHistory(
  base: number,
  days = 4788
): OHLCVBar[] {
  const data: OHLCVBar[] = [];
  let value = base * 0.85;
  const now = new Date();

  for (let i = days; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    if (d.getDay() === 0 || d.getDay() === 6) continue;

    const change = (Math.random() - 0.48) * value * 0.025;
    const open = value;
    const close = value + change;
    const high = Math.max(open, close) + Math.random() * value * 0.008;
    const low = Math.min(open, close) - Math.random() * value * 0.008;

    data.push({
      date: d.toISOString().split("T")[0],
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume: Math.floor(Math.random() * 50_000_000 + 10_000_000),
    });

    value = close;
  }
  return data;
}

/** Simple price history for UI display (close + volume only). */
export function generateSimplePriceHistory(
  base: number,
  days = 90
): { date: string; close: number; volume: number }[] {
  const data: { date: string; close: number; volume: number }[] = [];
  let value = base * 0.92;
  const now = new Date();
  for (let i = days; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    value += (Math.random() - 0.45) * (base * 0.012);
    data.push({
      date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      close: Math.round(value * 100) / 100,
      volume: Math.floor(Math.random() * 60_000_000 + 20_000_000),
    });
  }
  return data;
}
