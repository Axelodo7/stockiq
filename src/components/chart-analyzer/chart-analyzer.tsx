"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  Upload,
  Image as ImageIcon,
  X,
  Loader2,
  Target,
  Shield,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Activity,
  BarChart3,
  Eye,
  RefreshCw,
} from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { GlowBadge } from "@/components/ui/glow-badge";
import { cn, formatCurrency, formatPercent } from "@/lib/utils";

interface ChartAnalysis {
  id: string;
  imageHash: string;
  direction: "long" | "short" | "neutral";
  confidence: number;
  entryPrice: number;
  stopLoss: number;
  takeProfits: Array<{
    level: 1 | 2 | 3;
    price: number;
    percentage: number;
    rrRatio: number;
  }>;
  riskAmount: number;
  rewardAmount: number;
  overallRR: number;
  timeframe: string;
  patterns: string[];
  support: number[];
  resistance: number[];
  trendStrength: number;
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

interface ChartAnalyzerProps {
  className?: string;
}

interface MetaInfo {
  priceSource?: string;
  ticker?: { ticker: string; name: string; price: number; resolvedSymbol: string; assetClass: string } | null;
  assetClass?: string;
  attemptedSymbols?: string[];
}

// Client-side asset class detection (mirror of server logic for UI hints)
const FOREX_BASES_CLIENT = new Set([
  "USD","EUR","JPY","GBP","CHF","AUD","CAD","NZD","CNY","HKD","SGD","SEK","NOK","DKK",
  "MXN","ZAR","TRY","PLN","THB","IDR","MYR","PHP","INR","KRW","RUB","BRL","ARS"
]);
const METAL_SYMBOLS_CLIENT = new Set([
  "XAU","XAG","XPT","XPD","GOLD","SILVER","PLATINUM","PALLADIUM","GC","SI","PL","PA"
]);
const CRYPTO_SYMBOLS_CLIENT = new Set([
  "BTC","ETH","XRP","LTC","BCH","ADA","DOT","LINK","UNI","AAVE","SOL","MATIC","AVAX",
  "DOGE","SHIB","TRX","ATOM","XLM","ETC","NEAR","ALGO","FTM","HBAR","ICP","FIL"
]);
const INDEX_SYMBOLS_CLIENT = new Set([
  "SPX","IXIC","DJI","RUT","VIX","TNX","GSPC","NDX","RUI","RUA","UKX","DAX","CAC","N225"
]);

function detectAssetClassClient(raw: string): "stock" | "forex" | "crypto" | "metal" | "index" | "unknown" {
  const s = raw.toUpperCase().replace(/[^A-Z]/g, "");
  if (!s) return "unknown";
  if (raw.startsWith("^")) return "index";
  if (INDEX_SYMBOLS_CLIENT.has(s)) return "index";
  if (raw.includes("-USD") || raw.includes("-USDT")) return "crypto";
  if (CRYPTO_SYMBOLS_CLIENT.has(s)) return "crypto";
  if (METAL_SYMBOLS_CLIENT.has(s)) return "metal";
  if (s.length === 6) {
    const a = s.slice(0, 3);
    const b = s.slice(3, 6);
    if (FOREX_BASES_CLIENT.has(a) && FOREX_BASES_CLIENT.has(b)) return "forex";
  }
  if (s.length === 3 && FOREX_BASES_CLIENT.has(s)) return "forex";
  return "stock";
}

function getFormatHint(cls: ReturnType<typeof detectAssetClassClient>): string {
  switch (cls) {
    case "forex": return "Yahoo: USDJPY=X";
    case "crypto": return "Yahoo: BTC-USD";
    case "metal": return "Yahoo: XAUUSD=X";
    case "index": return "Yahoo: ^GSPC";
    default: return "Yahoo: AAPL";
  }
}

export function ChartAnalyzer({ className }: ChartAnalyzerProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [ticker, setTicker] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<ChartAnalysis | null>(null);
  const [meta, setMeta] = useState<MetaInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((f: File) => {
    if (!f.type.startsWith("image/")) {
      setError("Please upload an image file");
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setError("Image must be smaller than 10MB");
      return;
    }
    setError(null);
    setResult(null);
    setMeta(null);
    setFile(f);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(f);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const f = e.dataTransfer.files?.[0];
      if (f) handleFile(f);
    },
    [handleFile]
  );

  const onPaste = useCallback(
    (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith("image/")) {
          const f = item.getAsFile();
          if (f) handleFile(f);
          break;
        }
      }
    },
    [handleFile]
  );

  useEffect(() => {
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [onPaste]);

  const analyzeChart = async () => {
    if (!file) return;
    setAnalyzing(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("chart", file);
      if (ticker.trim()) formData.append("ticker", ticker.trim());
      const res = await fetch("/api/chart-analyze", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (json.success) {
        setResult(json.data);
        setMeta(json.meta ?? null);
      } else {
        setError(json.error || "Analysis failed");
      }
    } catch {
      setError("Failed to analyze chart");
    } finally {
      setAnalyzing(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setMeta(null);
    setError(null);
  };

  return (
    <div className={cn("grid grid-cols-1 gap-6 lg:grid-cols-2", className)}>
      {/* Upload panel */}
      <div className="space-y-4">
        {/* Ticker input — always visible so users can pre-fill */}
        <GlassCard padding="sm">
          <label className="mb-2 block text-[10px] font-semibold uppercase tracking-wider text-muted">
            Ticker / Symbol <span className="text-muted/60">(optional, recommended)</span>
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              placeholder="AAPL · USDJPY · BTCUSD · XAUUSD"
              className="flex-1 rounded-lg border border-border bg-panel-elevated px-3 py-2 font-mono text-sm font-semibold uppercase tracking-wider text-foreground placeholder:font-sans placeholder:font-normal placeholder:tracking-normal placeholder:text-muted focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30"
              maxLength={20}
            />
            {ticker && (
              <button
                onClick={() => setTicker("")}
                className="rounded-lg p-2 text-muted hover:bg-panel-elevated hover:text-foreground"
                title="Clear"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          {ticker && (
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] text-muted">Detected:</span>
              <span className={cn(
                "rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                detectAssetClassClient(ticker) === "forex" ? "bg-cyan-500/10 text-cyan-400" :
                detectAssetClassClient(ticker) === "crypto" ? "bg-amber-500/10 text-amber-400" :
                detectAssetClassClient(ticker) === "metal" ? "bg-amber-500/10 text-amber-400" :
                detectAssetClassClient(ticker) === "index" ? "bg-purple-500/10 text-purple-400" :
                "bg-emerald-500/10 text-emerald-400"
              )}>
                {detectAssetClassClient(ticker)}
              </span>
              <span className="text-[10px] text-muted">
                · {getFormatHint(detectAssetClassClient(ticker))}
              </span>
            </div>
          )}
          <p className="mt-2 text-[10px] text-muted leading-relaxed">
            Supports stocks, forex (USDJPY), crypto (BTCUSD), metals (XAUUSD), indices (^GSPC). Yahoo Finance is used as fallback.
          </p>
        </GlassCard>

        {!preview ? (
          <GlassCard>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={onDrop}
              className={cn(
                "flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 sm:p-12 text-center transition-all",
                dragActive
                  ? "border-accent bg-accent/10"
                  : "border-border hover:border-accent/50 hover:bg-panel-elevated"
              )}
            >
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-accent/10 sm:mb-4 sm:h-16 sm:w-16">
                <Upload className="h-7 w-7 text-accent sm:h-8 sm:w-8" />
              </div>
              <h3 className="font-display text-base font-semibold mb-2 sm:text-lg">
                Upload Your Chart
              </h3>
              <p className="text-xs text-muted mb-4 max-w-xs sm:text-sm">
                Drag and drop, click to browse, or paste a screenshot
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="min-h-[44px] rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-accent-fg hover:bg-accent/90 active:scale-[0.98] transition-all"
              >
                Choose Image
              </button>
              <p className="mt-4 text-[10px] text-muted sm:text-xs">
                PNG, JPG, WebP · Max 10MB
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
              />
            </div>
          </GlassCard>
        ) : (
          <>
            <GlassCard padding="sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-accent" />
                  <span className="text-xs font-medium text-muted">Chart Preview</span>
                  {file && (
                    <span className="text-xs text-muted">
                      · {(file.size / 1024).toFixed(1)} KB
                    </span>
                  )}
                </div>
                <button
                  onClick={reset}
                  className="rounded-lg p-1.5 text-muted hover:bg-panel-elevated hover:text-foreground"
                  title="Remove"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview}
                alt="Chart preview"
                className="w-full rounded-lg border border-border"
              />
            </GlassCard>

            <button
              onClick={analyzeChart}
              disabled={analyzing}
              className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-accent-fg transition-colors hover:bg-accent/90 active:scale-[0.98] disabled:opacity-50"
            >
              {analyzing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing Chart...
                </>
              ) : result ? (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Re-analyze
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4" />
                  Analyze Chart
                </>
              )}
            </button>
          </>
        )}

        {error && (
          <GlassCard>
            <div className="flex items-center gap-2 text-sm">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <span className="text-red-400">{error}</span>
            </div>
          </GlassCard>
        )}
      </div>

      {/* Results panel */}
      <div>
        {!result && !analyzing && (
          <GlassCard className="h-full">
            <div className="flex h-full min-h-[400px] flex-col items-center justify-center py-12 text-center">
              <BarChart3 className="mb-4 h-12 w-12 text-muted" />
              <h3 className="font-display text-lg font-semibold mb-2">
                Analysis Results
              </h3>
              <p className="text-sm text-muted max-w-sm">
                Upload a chart to get AI-powered take profit levels, stop loss, and entry recommendations.
              </p>
            </div>
          </GlassCard>
        )}

        {analyzing && (
          <GlassCard className="h-full">
            <div className="flex h-full min-h-[400px] flex-col items-center justify-center py-12 text-center">
              <Loader2 className="mb-4 h-12 w-12 text-accent animate-spin" />
              <h3 className="font-display text-lg font-semibold mb-2">
                Analyzing Chart...
              </h3>
              <p className="text-sm text-muted">
                Detecting patterns, calculating levels, identifying trends
              </p>
              <div className="mt-4 flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-1.5 w-12 rounded-full bg-accent animate-pulse"
                    style={{ animationDelay: `${i * 200}ms` }}
                  />
                ))}
              </div>
            </div>
          </GlassCard>
        )}

        {result && <AnalysisResults result={result} meta={meta} />}
      </div>
    </div>
  );
}

interface MetaInfoDuplicate { _removed?: boolean }

function AnalysisResults({ result, meta }: { result: ChartAnalysis; meta: MetaInfo | null }) {
  const isLong = result.direction === "long";
  const isShort = result.direction === "short";
  const isNeutral = result.direction === "neutral";

  const directionConfig = {
    long: { label: "LONG", icon: TrendingUp, color: "text-emerald-400", bg: "bg-emerald-500/15", border: "border-emerald-500/30" },
    short: { label: "SHORT", icon: TrendingDown, color: "text-red-400", bg: "bg-red-500/15", border: "border-red-500/30" },
    neutral: { label: "NEUTRAL", icon: Activity, color: "text-zinc-400", bg: "bg-zinc-500/10", border: "border-zinc-500/30" },
  };

  const recConfig = {
    strong_buy: { label: "STRONG BUY", color: "text-emerald-300", icon: CheckCircle2 },
    buy: { label: "BUY", color: "text-emerald-400", icon: CheckCircle2 },
    hold: { label: "HOLD", color: "text-zinc-300", icon: Activity },
    avoid: { label: "AVOID", color: "text-red-400", icon: AlertTriangle },
  };

  const cfg = directionConfig[result.direction];
  const DirectionIcon = cfg.icon;
  const recCfg = recConfig[result.recommendation];
  const RecIcon = recCfg.icon;

  const priceSourceLabel = (() => {
    switch (meta?.priceSource) {
      case "ticker_alpaca": return { text: "Live · Alpaca", color: "text-emerald-400", icon: true };
      case "ticker_yahoo": return { text: "Live · Yahoo", color: "text-cyan-400", icon: true };
      default: return { text: "Estimated · Visual", color: "text-amber-400", icon: false };
    }
  })();

  return (
    <div className="space-y-3">
      {/* Price source indicator */}
      {meta && (
        <div className="space-y-1">
          <div className="flex items-center justify-between rounded-lg border border-border bg-panel px-3 py-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={cn("h-1.5 w-1.5 rounded-full", priceSourceLabel.icon ? "bg-emerald-500 animate-pulse" : "bg-amber-500")} />
              <span className={cn("text-xs font-semibold", priceSourceLabel.color)}>
                {priceSourceLabel.text}
              </span>
              {meta.ticker && (
                <span className="text-xs text-muted">
                  · {meta.ticker.ticker}
                </span>
              )}
              {meta.assetClass && meta.assetClass !== "unknown" && (
                <span className="rounded-md bg-panel-elevated px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted">
                  {meta.assetClass}
                </span>
              )}
              {meta.ticker && (
                <span className="text-[10px] text-muted/70">
                  via {meta.ticker.resolvedSymbol}
                </span>
              )}
            </div>
            {meta.ticker && (
              <span className="font-mono text-xs font-bold text-foreground">
                {formatCurrency(meta.ticker.price)}
              </span>
            )}
          </div>
          {priceSourceLabel.text.startsWith("Estimated") && meta.attemptedSymbols && meta.attemptedSymbols.length > 0 && (
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2">
              <p className="text-[10px] text-muted leading-relaxed">
                <span className="font-semibold text-amber-400">No live price found.</span>{" "}
                Tried: {meta.attemptedSymbols.slice(0, 4).join(", ")}
                {meta.attemptedSymbols.length > 4 && ` +${meta.attemptedSymbols.length - 4} more`}.
                {" "}Try a different format like <span className="font-mono font-bold">{getFormatHint(detectAssetClassClient(meta.ticker?.ticker || ""))}</span>.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Header */}
      <GlassCard>
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-2.5 sm:gap-3">
            <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border sm:h-12 sm:w-12", cfg.bg, cfg.border, cfg.color)}>
              <DirectionIcon className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span className={cn("rounded-md border px-2 py-0.5 text-[10px] font-bold tracking-wider sm:text-xs", cfg.bg, cfg.color, cfg.border)}>
                  {cfg.label}
                </span>
                <GlowBadge variant={result.recommendation === "strong_buy" || result.recommendation === "buy" ? "success" : result.recommendation === "avoid" ? "danger" : "default"}>
                  <RecIcon className="h-3 w-3" />
                  {recCfg.label}
                </GlowBadge>
              </div>
              <p className="text-xs text-muted">{result.timeframe} · {result.confidence}% confidence</p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[10px] uppercase tracking-wider text-muted">Conf</p>
            <p className="font-mono text-xl font-bold text-foreground sm:text-2xl">{result.confidence}%</p>
          </div>
        </div>

        {/* Confidence bar */}
        <div className="h-1.5 w-full rounded-full bg-panel-elevated">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-700",
              result.confidence >= 70 ? "bg-emerald-500" :
              result.confidence >= 40 ? "bg-amber-500" : "bg-zinc-500"
            )}
            style={{ width: `${result.confidence}%` }}
          />
        </div>
      </GlassCard>

      {/* Entry / SL / TP Grid */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {/* Entry */}
        <GlassCard padding="sm" className={cfg.bg}>
          <div className="flex items-center gap-1.5 mb-1">
            <Target className={cn("h-3 w-3 shrink-0", cfg.color)} />
            <p className="text-[10px] uppercase tracking-wider text-muted">Entry</p>
          </div>
          <p className="truncate font-mono text-base font-bold text-foreground">{formatCurrency(result.entryPrice)}</p>
        </GlassCard>

        {/* Stop Loss */}
        <GlassCard padding="sm" className="bg-red-500/10">
          <div className="flex items-center gap-1.5 mb-1">
            <Shield className="h-3 w-3 shrink-0 text-red-400" />
            <p className="text-[10px] uppercase tracking-wider text-muted">Stop Loss</p>
          </div>
          <p className="truncate font-mono text-base font-bold text-red-400">{formatCurrency(result.stopLoss)}</p>
          <p className="text-[10px] text-muted mt-0.5">
            {formatPercent(((result.stopLoss - result.entryPrice) / result.entryPrice) * 100)}
          </p>
        </GlassCard>

        {/* Risk:Reward */}
        <GlassCard padding="sm" className="bg-cyan-500/10">
          <div className="flex items-center gap-1.5 mb-1">
            <Activity className="h-3 w-3 shrink-0 text-cyan-400" />
            <p className="text-[10px] uppercase tracking-wider text-muted">R:R Ratio</p>
          </div>
          <p className="truncate font-mono text-base font-bold text-cyan-400">1 : {result.overallRR}</p>
          <p className="text-[10px] text-muted mt-0.5">to TP1</p>
        </GlassCard>

        {/* Trend Strength */}
        <GlassCard padding="sm">
          <div className="flex items-center gap-1.5 mb-1">
            <BarChart3 className="h-3 w-3 shrink-0 text-amber-400" />
            <p className="text-[10px] uppercase tracking-wider text-muted">Trend</p>
          </div>
          <p className="font-mono text-base font-bold text-foreground">{result.trendStrength}%</p>
          <p className="text-[10px] text-muted mt-0.5 capitalize">{result.volatility} volatility</p>
        </GlassCard>
      </div>

      {/* Take Profit Levels */}
      <GlassCard>
        <div className="mb-3 flex items-center gap-2">
          <Target className="h-4 w-4 text-emerald-400" />
          <h3 className="font-display text-sm font-semibold">Take Profit Levels</h3>
        </div>
        <div className="space-y-2">
          {result.takeProfits.map((tp) => (
            <div
              key={tp.level}
              className="flex items-center justify-between gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3"
            >
              <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-sm">
                  {tp.level}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-mono text-sm font-bold text-emerald-400 sm:text-base">{formatCurrency(tp.price)}</p>
                  <p className="text-[10px] text-muted">
                    {tp.percentage > 0 ? "+" : ""}{formatPercent(tp.percentage)} from entry
                  </p>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-[10px] uppercase tracking-wider text-muted">R:R</p>
                <p className="font-mono text-xs font-bold text-foreground sm:text-sm">1 : {tp.rrRatio}</p>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Support & Resistance */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <GlassCard padding="sm">
          <div className="flex items-center gap-1.5 mb-2">
            <TrendingDown className="h-3 w-3 text-emerald-400" />
            <p className="text-[10px] uppercase tracking-wider text-muted">Support</p>
          </div>
          <div className="space-y-1">
            {result.support.map((s, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-[10px] text-muted">S{i + 1}</span>
                <span className="font-mono text-sm font-semibold text-emerald-400">{formatCurrency(s)}</span>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard padding="sm">
          <div className="flex items-center gap-1.5 mb-2">
            <TrendingUp className="h-3 w-3 text-red-400" />
            <p className="text-[10px] uppercase tracking-wider text-muted">Resistance</p>
          </div>
          <div className="space-y-1">
            {result.resistance.map((r, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-[10px] text-muted">R{i + 1}</span>
                <span className="font-mono text-sm font-semibold text-red-400">{formatCurrency(r)}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Key Levels */}
      <GlassCard padding="sm">
        <div className="mb-2 flex items-center gap-2">
          <BarChart3 className="h-3 w-3 text-accent" />
          <p className="text-[10px] uppercase tracking-wider text-muted">Key Fibonacci Levels</p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <p className="text-[10px] text-muted">Fib 38.2%</p>
            <p className="font-mono text-xs font-semibold">{formatCurrency(result.keyLevels.fibonacci382 ?? 0)}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted">Pivot</p>
            <p className="font-mono text-xs font-semibold">{formatCurrency(result.keyLevels.pivot)}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted">Fib 61.8%</p>
            <p className="font-mono text-xs font-semibold">{formatCurrency(result.keyLevels.fibonacci618 ?? 0)}</p>
          </div>
        </div>
      </GlassCard>

      {/* Patterns */}
      {result.patterns.length > 0 && (
        <GlassCard padding="sm">
          <p className="text-[10px] uppercase tracking-wider text-muted mb-2">Detected Patterns</p>
          <div className="flex flex-wrap gap-1.5">
            {result.patterns.map((p, i) => (
              <span
                key={i}
                className="rounded-md border border-border bg-panel-elevated px-2 py-1 text-xs font-medium"
              >
                {p}
              </span>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Analysis */}
      <GlassCard padding="sm">
        <div className="mb-2 flex items-center gap-2">
          <Eye className="h-3 w-3 text-accent" />
          <p className="text-[10px] uppercase tracking-wider text-muted">AI Analysis</p>
        </div>
        <p className="text-sm leading-relaxed">{result.analysis}</p>
      </GlassCard>

      {/* Disclaimer */}
      <div className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
        <AlertTriangle className="h-3.5 w-3.5 text-amber-400 mt-0.5 shrink-0" />
        <p className="text-[10px] text-muted leading-relaxed">
          <span className="font-semibold text-foreground">Risk Disclaimer:</span> This analysis is generated by algorithmic chart pattern detection and should not be considered financial advice. Always conduct your own research, use proper risk management, and never risk more than you can afford to lose.
        </p>
      </div>
    </div>
  );
}
