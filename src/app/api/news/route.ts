import { NextResponse } from "next/server";
import { cached, TTL } from "@/lib/server-cache";

export interface NewsItem {
  id: string;
  ticker: string;
  title: string;
  publisher: string;
  link: string;
  publishedAt: string; // ISO
  publishedAtRelative: string;
  thumbnail?: string;
  summary?: string;
  sentiment: "bullish" | "bearish" | "neutral";
  sentimentScore: number; // -1 to +1
  category: "earnings" | "product" | "market" | "leadership" | "analyst" | "general";
  tickers: string[];
}

const YAHOO_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  Accept: "application/json",
};

// Bullish / bearish keyword lists for sentiment analysis
const BULLISH_WORDS = [
  "surge", "surges", "surged", "rally", "rallies", "rallied", "soar", "soars", "soared",
  "jump", "jumps", "jumped", "climb", "climbs", "climbed", "rise", "rises", "rose",
  "gain", "gains", "gained", "profit", "profits", "profitable", "beat", "beats", "exceeded",
  "strong", "bullish", "upgrade", "upgraded", "outperform", "buy rating", "record high",
  "growth", "growing", "expand", "expansion", "expand", "breakthrough", "win", "wins",
  "approved", "success", "successful", "partnership", "deal", "acquisition", "acquire",
  "dividend", "buyback", "repurchase", "innovation", "milestone", "best", "top",
];

const BEARISH_WORDS = [
  "fall", "falls", "fell", "drop", "drops", "dropped", "plunge", "plunges", "plunged",
  "tumble", "tumbles", "tumbled", "decline", "declines", "declined", "sink", "sinks", "sank",
  "lose", "loss", "losses", "lost", "downgrade", "downgraded", "underperform", "sell rating",
  "weak", "bearish", "miss", "missed", "below", "disappointing", "concern", "concerns",
  "warning", "warns", "risk", "risks", "lawsuit", "investigation", "fine", "fined",
  "penalty", "scandal", "fraud", "recall", "layoff", "layoffs", "cuts", "slashed",
  "crash", "slump", "slumps", "downturn", "recession",
];

const CATEGORY_KEYWORDS: Record<NewsItem["category"], string[]> = {
  earnings: ["earnings", "revenue", "eps", "profit", "quarterly", "guidance", "fiscal"],
  product: ["launch", "product", "release", "unveil", "announce", "new feature", "update"],
  market: ["market", "trading", "shares", "stock", "price target", "valuation"],
  leadership: ["ceo", "cfo", "executive", "board", "appoint", "resign", "step down"],
  analyst: ["analyst", "rating", "price target", "upgrade", "downgrade", "outlook"],
  general: [],
};

function analyzeSentiment(title: string): { sentiment: NewsItem["sentiment"]; score: number } {
  const lower = title.toLowerCase();
  let score = 0;

  for (const word of BULLISH_WORDS) {
    if (lower.includes(word)) score += 1;
  }
  for (const word of BEARISH_WORDS) {
    if (lower.includes(word)) score -= 1;
  }

  // Normalize to -1 to +1
  const normalized = Math.max(-1, Math.min(1, score / 3));

  let sentiment: NewsItem["sentiment"];
  if (normalized > 0.2) sentiment = "bullish";
  else if (normalized < -0.2) sentiment = "bearish";
  else sentiment = "neutral";

  return { sentiment, score: normalized };
}

function categorize(title: string): NewsItem["category"] {
  const lower = title.toLowerCase();
  for (const [cat, words] of Object.entries(CATEGORY_KEYWORDS)) {
    if (cat === "general") continue;
    if (words.some((w) => lower.includes(w))) return cat as NewsItem["category"];
  }
  return "general";
}

function timeAgo(isoString: string): string {
  const now = Date.now();
  const then = new Date(isoString).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  if (diffDay < 30) return `${Math.floor(diffDay / 7)}w ago`;
  return `${Math.floor(diffDay / 30)}mo ago`;
}

function extractTickers(title: string, requestedTicker: string): string[] {
  const matches = title.match(/\$([A-Z]{1,5})\b|\(([A-Z]{1,5})\)/g) || [];
  const tickers = new Set<string>([requestedTicker.toUpperCase()]);
  for (const m of matches) {
    const t = m.replace(/[\$\(\)]/g, "");
    if (t.length <= 5 && t.length >= 1) tickers.add(t);
  }
  return Array.from(tickers);
}

interface YahooNewsItem {
  id: string;
  title: string;
  publisher: string;
  link: string;
  providerPublishTime: number; // unix seconds
  thumbnail?: { resolutions?: { url: string; width: number; height: number }[] };
  relatedTickers?: string[];
  summary?: string;
}

async function fetchYahooNews(ticker: string): Promise<NewsItem[]> {
  const url = `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(ticker)}&newsCount=20`;
  const res = await fetch(url, {
    headers: YAHOO_HEADERS,
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) return [];
  const data = await res.json();
  const news = data?.news;
  if (!Array.isArray(news)) return [];

  const tickerUpper = ticker.toUpperCase();

  return news.map((item: YahooNewsItem): NewsItem => {
    const { sentiment, score } = analyzeSentiment(item.title);
    const category = categorize(item.title);

    // Pick the largest thumbnail resolution
    let thumbnail: string | undefined;
    if (item.thumbnail?.resolutions?.length) {
      const largest = item.thumbnail.resolutions.reduce((prev, curr) =>
        curr.width > prev.width ? curr : prev
      );
      thumbnail = largest.url;
    }

    const publishedAt = new Date(item.providerPublishTime * 1000).toISOString();

    return {
      id: item.id,
      ticker: tickerUpper,
      title: item.title,
      publisher: item.publisher,
      link: item.link,
      publishedAt,
      publishedAtRelative: timeAgo(publishedAt),
      thumbnail,
      summary: item.summary,
      sentiment,
      sentimentScore: Math.round(score * 100) / 100,
      category,
      tickers: extractTickers(item.title, tickerUpper),
    };
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ticker = searchParams.get("ticker");
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);

  if (!ticker) {
    return NextResponse.json(
      { success: false, error: "ticker parameter required" },
      { status: 400 }
    );
  }

  try {
    const news = await cached(
      `news:${ticker.toUpperCase()}`,
      async () => {
        const items = await fetchYahooNews(ticker);
        // Dedupe by title
        const seen = new Set<string>();
        return items.filter((item) => {
          if (seen.has(item.title)) return false;
          seen.add(item.title);
          return true;
        });
      },
      TTL.SHORT
    );

    return NextResponse.json({
      success: true,
      data: news.slice(0, limit),
      meta: {
        ticker: ticker.toUpperCase(),
        total: news.length,
        fetchedAt: new Date().toISOString(),
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to fetch news" },
      { status: 500 }
    );
  }
}
