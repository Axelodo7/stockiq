"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Newspaper,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  Minus,
  Clock,
  RefreshCw,
  BarChart3,
} from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { cn, formatChange } from "@/lib/utils";

interface NewsItem {
  id: string;
  ticker: string;
  title: string;
  publisher: string;
  link: string;
  publishedAt: string;
  publishedAtRelative: string;
  thumbnail?: string;
  summary?: string;
  sentiment: "bullish" | "bearish" | "neutral";
  sentimentScore: number;
  category: "earnings" | "product" | "market" | "leadership" | "analyst" | "general";
  tickers: string[];
}

const sentimentConfig = {
  bullish: { icon: TrendingUp, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", label: "Bullish" },
  bearish: { icon: TrendingDown, color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20", label: "Bearish" },
  neutral: { icon: Minus, color: "text-zinc-400", bg: "bg-zinc-500/10", border: "border-zinc-500/20", label: "Neutral" },
};

const categoryColors: Record<NewsItem["category"], string> = {
  earnings: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  product: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  market: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  leadership: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  analyst: "bg-pink-500/10 text-pink-400 border-pink-500/20",
  general: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
};

interface NewsSectionProps {
  ticker: string;
  initialNews?: NewsItem[];
}

export function NewsSection({ ticker, initialNews }: NewsSectionProps) {
  const [news, setNews] = useState<NewsItem[]>(initialNews || []);
  const [loading, setLoading] = useState(!initialNews);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "bullish" | "bearish" | "neutral">("all");

  const fetchNews = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/news?ticker=${ticker}&limit=20`);
      const json = await res.json();
      if (json.success) {
        setNews(json.data);
      } else {
        setError(json.error || "Failed to load news");
      }
    } catch {
      setError("Failed to fetch news");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!initialNews) fetchNews();
  }, [ticker]); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredNews = filter === "all" ? news : news.filter((n) => n.sentiment === filter);

  const sentimentCounts = {
    bullish: news.filter((n) => n.sentiment === "bullish").length,
    bearish: news.filter((n) => n.sentiment === "bearish").length,
    neutral: news.filter((n) => n.sentiment === "neutral").length,
  };

  const overallSentiment =
    sentimentCounts.bullish > sentimentCounts.bearish + 1 ? "bullish" :
    sentimentCounts.bearish > sentimentCounts.bullish + 1 ? "bearish" : "neutral";

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Newspaper className="h-5 w-5 text-accent" />
          <h2 className="font-display text-lg font-semibold">
            Latest News <span className="font-mono text-muted">·</span> <span className="font-mono">{ticker}</span>
          </h2>
        </div>
        <button
          onClick={fetchNews}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-lg border border-border bg-panel px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:bg-panel-elevated hover:text-foreground disabled:opacity-50"
        >
          <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} />
          Refresh
        </button>
      </div>

      {/* Sentiment summary */}
      {!loading && news.length > 0 && (
        <GlassCard padding="sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="text-[10px] uppercase tracking-wider text-muted">News Sentiment</div>
              <SentimentBadge sentiment={overallSentiment} />
            </div>
            <div className="flex items-center gap-2">
              {(["all", "bullish", "bearish", "neutral"] as const).map((f) => {
                const count = f === "all" ? news.length : sentimentCounts[f];
                return (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={cn(
                      "rounded-md px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider transition-colors",
                      filter === f
                        ? "bg-accent/10 text-accent"
                        : "text-muted hover:bg-panel-elevated hover:text-foreground"
                    )}
                  >
                    {f} <span className="ml-1 opacity-70">({count})</span>
                  </button>
                );
              })}
            </div>
          </div>
        </GlassCard>
      )}

      {/* Loading state */}
      {loading && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <NewsCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <GlassCard>
          <div className="flex flex-col items-center justify-center py-8">
            <p className="text-sm text-muted">{error}</p>
            <button
              onClick={fetchNews}
              className="mt-3 rounded-lg border border-border bg-panel px-4 py-2 text-sm font-medium text-foreground hover:bg-panel-elevated"
            >
              Try Again
            </button>
          </div>
        </GlassCard>
      )}

      {/* Empty */}
      {!loading && !error && filteredNews.length === 0 && news.length > 0 && (
        <GlassCard>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-sm text-foreground">No {filter} news found</p>
            <p className="text-xs text-muted mt-1">Try selecting a different filter</p>
          </div>
        </GlassCard>
      )}

      {/* Empty — no news at all */}
      {!loading && !error && news.length === 0 && (
        <GlassCard>
          <div className="flex flex-col items-center justify-center py-12">
            <Newspaper className="h-10 w-10 text-muted mb-3" />
            <p className="text-sm text-foreground">No news available</p>
            <p className="text-xs text-muted mt-1">Check back later for updates on {ticker}</p>
          </div>
        </GlassCard>
      )}

      {/* News grid */}
      {!loading && filteredNews.length > 0 && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {filteredNews.map((item) => (
            <NewsCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

function NewsCardSkeleton() {
  return (
    <GlassCard>
      <div className="animate-pulse space-y-3">
        <div className="flex gap-3">
          <div className="h-20 w-20 shrink-0 rounded-lg bg-panel-elevated" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-3/4 rounded bg-panel-elevated" />
            <div className="h-3 w-1/2 rounded bg-panel-elevated" />
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

function SentimentBadge({ sentiment }: { sentiment: NewsItem["sentiment"] }) {
  const cfg = sentimentConfig[sentiment];
  const Icon = cfg.icon;
  return (
    <div className={cn("flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-semibold", cfg.bg, cfg.border, cfg.color)}>
      <Icon className="h-3 w-3" />
      {cfg.label}
    </div>
  );
}

function NewsCard({ item }: { item: NewsItem }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <GlassCard hover className="group">
      <div className="flex gap-3">
        {/* Thumbnail */}
        {item.thumbnail && (
          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-panel-elevated">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.thumbnail}
              alt=""
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Badges row */}
          <div className="flex flex-wrap items-center gap-1.5 mb-2">
            <SentimentBadge sentiment={item.sentiment} />
            <span
              className={cn(
                "rounded-md border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                categoryColors[item.category]
              )}
            >
              {item.category}
            </span>
          </div>

          {/* Title */}
          <a
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-sm font-semibold leading-snug text-foreground hover:text-accent transition-colors line-clamp-2"
          >
            {item.title}
          </a>

          {/* Meta */}
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-muted">
            <span className="font-medium text-foreground">{item.publisher}</span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {item.publishedAtRelative}
            </span>
          </div>

          {/* Summary (expandable) */}
          {item.summary && (
            <div className="mt-2">
              <p
                className={cn(
                  "text-xs text-muted leading-relaxed",
                  expanded ? "" : "line-clamp-2"
                )}
              >
                {item.summary}
              </p>
              <button
                onClick={() => setExpanded(!expanded)}
                className="mt-1 text-[10px] font-medium text-accent hover:underline"
              >
                {expanded ? "Show less" : "Read more"}
              </button>
            </div>
          )}

          {/* Other tickers mentioned */}
          {item.tickers.length > 1 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {item.tickers.slice(0, 4).map((t) => (
                <Link
                  key={t}
                  href={`/stock/${t}`}
                  className="rounded bg-panel-elevated px-1.5 py-0.5 text-[10px] font-mono font-medium text-muted hover:bg-accent/10 hover:text-accent transition-colors"
                >
                  {t}
                </Link>
              ))}
            </div>
          )}

          {/* Open link button */}
          <a
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1 text-[10px] font-medium text-accent hover:underline"
          >
            Read full article <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </GlassCard>
  );
}

/** Compact news card for use on dashboard */
export function NewsCompactList({ ticker, limit = 5 }: { ticker: string; limit?: number }) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/news?ticker=${ticker}&limit=${limit}`)
      .then((r) => r.json())
      .then((json) => { if (json.success) setNews(json.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [ticker, limit]);

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: limit }).map((_, i) => (
          <div key={i} className="h-12 animate-pulse rounded bg-panel-elevated" />
        ))}
      </div>
    );
  }

  if (news.length === 0) {
    return (
      <div className="flex items-center justify-center py-6 text-center">
        <div>
          <Newspaper className="mx-auto h-6 w-6 text-muted mb-2" />
          <p className="text-xs text-muted">No recent news</p>
        </div>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {news.map((item) => {
        const Icon =
          item.sentiment === "bullish" ? TrendingUp :
          item.sentiment === "bearish" ? TrendingDown : Minus;
        const color =
          item.sentiment === "bullish" ? "text-emerald-400" :
          item.sentiment === "bearish" ? "text-red-400" : "text-zinc-400";

        return (
          <a
            key={item.id}
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="block px-4 py-3 transition-colors hover:bg-panel-elevated"
          >
            <div className="flex items-start gap-2">
              <Icon className={cn("mt-0.5 h-3 w-3 shrink-0", color)} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium leading-snug text-foreground line-clamp-2">{item.title}</p>
                <p className="mt-0.5 text-[10px] text-muted">
                  {item.publisher} · {item.publishedAtRelative}
                </p>
              </div>
            </div>
          </a>
        );
      })}
    </div>
  );
}

export type { NewsItem };
