"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import {
  LayoutDashboard,
  Search,
  TrendingUp,
  Brain,
  Briefcase,
  Star,
  Bell,
  Settings,
  BarChart3,
  Shield,
  Calendar,
  Cpu,
  ArrowRight,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Markets", href: "/market", icon: BarChart3 },
  { label: "Predictions", href: "/predictions", icon: Brain },
  { label: "Models", href: "/models", icon: Cpu },
  { label: "Portfolio", href: "/portfolio", icon: Briefcase },
  { label: "Watchlist", href: "/watchlist", icon: Star },
  { label: "Risk Dashboard", href: "/risk", icon: Shield },
  { label: "Earnings", href: "/earnings", icon: Calendar },
  { label: "Alerts", href: "/alerts", icon: Bell },
  { label: "Settings", href: "/settings", icon: Settings },
];

const allStocks = [
  // Mega Cap Tech
  { ticker: "AAPL", name: "Apple Inc.", sector: "Technology" },
  { ticker: "MSFT", name: "Microsoft Corp.", sector: "Technology" },
  { ticker: "GOOGL", name: "Alphabet Inc.", sector: "Technology" },
  { ticker: "AMZN", name: "Amazon.com Inc.", sector: "E-Commerce" },
  { ticker: "NVDA", name: "NVIDIA Corp.", sector: "Technology" },
  { ticker: "META", name: "Meta Platforms Inc.", sector: "Technology" },
  { ticker: "TSLA", name: "Tesla Inc.", sector: "Automotive" },
  { ticker: "BRK.B", name: "Berkshire Hathaway", sector: "Financial" },
  { ticker: "LLY", name: "Eli Lilly & Co.", sector: "Healthcare" },
  { ticker: "AVGO", name: "Broadcom Inc.", sector: "Technology" },
  // Large Cap
  { ticker: "JPM", name: "JPMorgan Chase & Co.", sector: "Financial" },
  { ticker: "V", name: "Visa Inc.", sector: "Financial" },
  { ticker: "UNH", name: "UnitedHealth Group", sector: "Healthcare" },
  { ticker: "XOM", name: "Exxon Mobil Corp.", sector: "Energy" },
  { ticker: "WMT", name: "Walmart Inc.", sector: "Consumer Staples" },
  { ticker: "JNJ", name: "Johnson & Johnson", sector: "Healthcare" },
  { ticker: "MA", name: "Mastercard Inc.", sector: "Financial" },
  { ticker: "PG", name: "Procter & Gamble", sector: "Consumer Staples" },
  { ticker: "HD", name: "Home Depot Inc.", sector: "Consumer Disc." },
  { ticker: "COST", name: "Costco Wholesale", sector: "Consumer Staples" },
  { ticker: "ABBV", name: "AbbVie Inc.", sector: "Healthcare" },
  { ticker: "NFLX", name: "Netflix Inc.", sector: "Technology" },
  { ticker: "CRM", name: "Salesforce Inc.", sector: "Technology" },
  { ticker: "BAC", name: "Bank of America", sector: "Financial" },
  { ticker: "AMD", name: "Advanced Micro Devices", sector: "Technology" },
  { ticker: "KO", name: "Coca-Cola Co.", sector: "Consumer Staples" },
  { ticker: "MRK", name: "Merck & Co.", sector: "Healthcare" },
  { ticker: "CVX", name: "Chevron Corp.", sector: "Energy" },
  { ticker: "ORCL", name: "Oracle Corp.", sector: "Technology" },
  { ticker: "PEP", name: "PepsiCo Inc.", sector: "Consumer Staples" },
  { ticker: "LIN", name: "Linde plc", sector: "Materials" },
  { ticker: "TMO", name: "Thermo Fisher Scientific", sector: "Healthcare" },
  { ticker: "CSCO", name: "Cisco Systems", sector: "Technology" },
  { ticker: "WFC", name: "Wells Fargo & Co.", sector: "Financial" },
  { ticker: "INTC", name: "Intel Corp.", sector: "Technology" },
  { ticker: "DIS", name: "Walt Disney Co.", sector: "Communication" },
  { ticker: "ADBE", name: "Adobe Inc.", sector: "Technology" },
  { ticker: "PFE", name: "Pfizer Inc.", sector: "Healthcare" },
  { ticker: "CMCSA", name: "Comcast Corp.", sector: "Communication" },
  { ticker: "ACN", name: "Accenture plc", sector: "Technology" },
  { ticker: "T", name: "AT&T Inc.", sector: "Communication" },
  { ticker: "ABT", name: "Abbott Laboratories", sector: "Healthcare" },
  { ticker: "NKE", name: "Nike Inc.", sector: "Consumer Disc." },
  { ticker: "TXN", name: "Texas Instruments", sector: "Technology" },
  { ticker: "VZ", name: "Verizon Communications", sector: "Communication" },
  { ticker: "PM", name: "Philip Morris International", sector: "Consumer Staples" },
  { ticker: "UPS", name: "United Parcel Service", sector: "Industrials" },
  { ticker: "QCOM", name: "Qualcomm Inc.", sector: "Technology" },
  { ticker: "RTX", name: "RTX Corp.", sector: "Industrials" },
  { ticker: "HON", name: "Honeywell International", sector: "Industrials" },
  { ticker: "LOW", name: "Lowe's Companies", sector: "Consumer Disc." },
  { ticker: "INTU", name: "Intuit Inc.", sector: "Technology" },
  { ticker: "IBM", name: "IBM Corp.", sector: "Technology" },
  { ticker: "GS", name: "Goldman Sachs Group", sector: "Financial" },
  { ticker: "CAT", name: "Caterpillar Inc.", sector: "Industrials" },
  { ticker: "BA", name: "Boeing Co.", sector: "Industrials" },
  { ticker: "GE", name: "GE Aerospace", sector: "Industrials" },
  { ticker: "AMGN", name: "Amgen Inc.", sector: "Healthcare" },
  { ticker: "BLK", name: "BlackRock Inc.", sector: "Financial" },
  { ticker: "GILD", name: "Gilead Sciences", sector: "Healthcare" },
  { ticker: "MDLZ", name: "Mondelez International", sector: "Consumer Staples" },
  { ticker: "SBUX", name: "Starbucks Corp.", sector: "Consumer Disc." },
  { ticker: "PLD", name: "Prologis Inc.", sector: "Real Estate" },
  { ticker: "ADI", name: "Analog Devices", sector: "Technology" },
  { ticker: "MDT", name: "Medtronic plc", sector: "Healthcare" },
  { ticker: "ISRG", name: "Intuitive Surgical", sector: "Healthcare" },
  { ticker: "SCHW", name: "Charles Schwab Corp.", sector: "Financial" },
  { ticker: "DE", name: "Deere & Co.", sector: "Industrials" },
  { ticker: "REGN", name: "Regeneron Pharmaceuticals", sector: "Healthcare" },
  { ticker: "VRTX", name: "Vertex Pharmaceuticals", sector: "Healthcare" },
  { ticker: "TJX", name: "TJX Companies", sector: "Consumer Disc." },
  { ticker: "SYK", name: "Stryker Corp.", sector: "Healthcare" },
  { ticker: "ZTS", name: "Zoetis Inc.", sector: "Healthcare" },
  { ticker: "CME", name: "CME Group Inc.", sector: "Financial" },
  { ticker: "SO", name: "Southern Company", sector: "Utilities" },
  { ticker: "MMC", name: "Marsh & McLennan", sector: "Financial" },
  { ticker: "BMY", name: "Bristol-Myers Squibb", sector: "Healthcare" },
  { ticker: "CI", name: "Cigna Group", sector: "Healthcare" },
  { ticker: "DUK", name: "Duke Energy", sector: "Utilities" },
  { ticker: "USB", name: "U.S. Bancorp", sector: "Financial" },
  { ticker: "PNC", name: "PNC Financial Services", sector: "Financial" },
  { ticker: "TGT", name: "Target Corp.", sector: "Consumer Disc." },
  { ticker: "CL", name: "Colgate-Palmolive", sector: "Consumer Staples" },
  { ticker: "NSC", name: "Norfolk Southern", sector: "Industrials" },
  { ticker: "FDX", name: "FedEx Corp.", sector: "Industrials" },
  { ticker: "GD", name: "General Dynamics", sector: "Industrials" },
  { ticker: "EOG", name: "EOG Resources", sector: "Energy" },
  { ticker: "SLB", name: "Schlumberger N.V.", sector: "Energy" },
  { ticker: "VRTX", name: "Vertex Pharmaceuticals", sector: "Healthcare" },
  { ticker: "MCD", name: "McDonald's Corp.", sector: "Consumer Disc." },
  { ticker: "SYY", name: "Sysco Corp.", sector: "Consumer Staples" },
  { ticker: "AON", name: "Aon plc", sector: "Financial" },
  { ticker: "USB", name: "U.S. Bancorp", sector: "Financial" },
  // Popular mid/small cap
  { ticker: "COIN", name: "Coinbase Global", sector: "Financial" },
  { ticker: "SQ", name: "Block Inc.", sector: "Financial" },
  { ticker: "SNOW", name: "Snowflake Inc.", sector: "Technology" },
  { ticker: "PLTR", name: "Palantir Technologies", sector: "Technology" },
  { ticker: "RIVN", name: "Rivian Automotive", sector: "Automotive" },
  { ticker: "LCID", name: "Lucid Group", sector: "Automotive" },
  { ticker: "SOFI", name: "SoFi Technologies", sector: "Financial" },
  { ticker: "ROKU", name: "Roku Inc.", sector: "Technology" },
  { ticker: "DKNG", name: "DraftKings Inc.", sector: "Consumer Disc." },
  { ticker: "ABNB", name: "Airbnb Inc.", sector: "Consumer Disc." },
  { ticker: "UBER", name: "Uber Technologies", sector: "Technology" },
  { ticker: "LYFT", name: "Lyft Inc.", sector: "Technology" },
  { ticker: "PATH", name: "UiPath Inc.", sector: "Technology" },
  { ticker: "NET", name: "Cloudflare Inc.", sector: "Technology" },
  { ticker: "DDOG", name: "Datadog Inc.", sector: "Technology" },
  { ticker: "CRWD", name: "CrowdStrike Holdings", sector: "Technology" },
  { ticker: "ZS", name: "Zscaler Inc.", sector: "Technology" },
  { ticker: "PANW", name: "Palo Alto Networks", sector: "Technology" },
  { ticker: "MDB", name: "MongoDB Inc.", sector: "Technology" },
  { ticker: "COIN", name: "Coinbase Global", sector: "Financial" },
  { ticker: "ARM", name: "Arm Holdings", sector: "Technology" },
  { ticker: "SMCI", name: "Super Micro Computer", sector: "Technology" },
  { ticker: "MARA", name: "Marathon Digital Holdings", sector: "Technology" },
  { ticker: "RIOT", name: "Riot Platforms", sector: "Technology" },
  { ticker: "HOOD", name: "Robinhood Markets", sector: "Financial" },
  { ticker: "RBLX", name: "Roblox Corp.", sector: "Technology" },
  { ticker: "SPOT", name: "Spotify Technology", sector: "Communication" },
  { ticker: "SE", name: "Sea Limited", sector: "Technology" },
  { ticker: "BABA", name: "Alibaba Group", sector: "E-Commerce" },
  { ticker: "JD", name: "JD.com Inc.", sector: "E-Commerce" },
  { ticker: "PDD", name: "PDD Holdings", sector: "E-Commerce" },
  { ticker: "NIO", name: "NIO Inc.", sector: "Automotive" },
  { ticker: "LI", name: "Li Auto Inc.", sector: "Automotive" },
  { ticker: "XPEV", name: "XPeng Inc.", sector: "Automotive" },
  { ticker: "PYPL", name: "PayPal Holdings", sector: "Financial" },
  { ticker: "SNAP", name: "Snap Inc.", sector: "Communication" },
  { ticker: "PINS", name: "Pinterest Inc.", sector: "Communication" },
  { ticker: "BIDU", name: "Baidu Inc.", sector: "Technology" },
  { ticker: "TSM", name: "Taiwan Semiconductor", sector: "Technology" },
  { ticker: "ASML", name: "ASML Holding", sector: "Technology" },
  { ticker: "SONY", name: "Sony Group Corp.", sector: "Technology" },
  { ticker: "TM", name: "Toyota Motor Corp.", sector: "Automotive" },
  { ticker: "NVO", name: "Novo Nordisk A/S", sector: "Healthcare" },
  { ticker: "SAP", name: "SAP SE", sector: "Technology" },
  { ticker: "SHOP", name: "Shopify Inc.", sector: "E-Commerce" },
  { ticker: "TTD", name: "The Trade Desk", sector: "Technology" },
  { ticker: "CEG", name: "Constellation Energy", sector: "Utilities" },
  { ticker: "VST", name: "Vistra Corp.", sector: "Utilities" },
  { ticker: "SMCI", name: "Super Micro Computer", sector: "Technology" },
  { ticker: "CRDO", name: "Credo Technology", sector: "Technology" },
  { ticker: "AEHR", name: "Aehr Test Systems", sector: "Technology" },
  { ticker: "IONQ", name: "IonQ Inc.", sector: "Technology" },
  { ticker: "RGTI", name: "Rigetti Computing", sector: "Technology" },
  { ticker: "QUBT", name: "Quantum Computing", sector: "Technology" },
];

// Deduplicate by ticker
const stocks = Array.from(new Map(allStocks.map((s) => [s.ticker, s])).values());

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
      if (e.key === "Escape") {
        onOpenChange(false);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  const handleSelect = (href: string) => {
    router.push(href);
    onOpenChange(false);
    setSearch("");
  };

  const filteredStocks = useMemo(() => {
    if (!search) return stocks.slice(0, 8);
    const q = search.toUpperCase();
    return stocks.filter(
      (s) =>
        s.ticker.includes(q) ||
        s.name.toUpperCase().includes(q) ||
        s.sector.toUpperCase().includes(q)
    ).slice(0, 12);
  }, [search]);

  const isTicker = /^[A-Z.]{1,5}$/i.test(search.trim());
  const tickerUpper = search.trim().toUpperCase();
  const tickerInList = stocks.some((s) => s.ticker === tickerUpper);

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />
      <div className="fixed left-1/2 top-[20%] z-50 w-full max-w-lg -translate-x-1/2 animate-scale-in">
        <Command className="glass-strong overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
          <div className="flex items-center border-b border-white/[0.06] px-4">
            <Search className="h-4 w-4 text-muted" />
            <Command.Input
              value={search}
              onValueChange={setSearch}
              placeholder="Search any stock ticker or page..."
              className="flex-1 bg-transparent px-3 py-4 text-sm text-foreground outline-none placeholder:text-muted/50"
            />
            <kbd className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[10px] text-muted">
              ESC
            </kbd>
          </div>

          <Command.List className="max-h-80 overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-muted">
              {search ? (
                <div className="space-y-2">
                  <p>No results for &quot;{search}&quot;</p>
                  {isTicker && !tickerInList && (
                    <button
                      onClick={() => handleSelect(`/stock/${tickerUpper}`)}
                      className="inline-flex items-center gap-2 rounded-lg bg-accent/10 px-3 py-1.5 text-xs text-accent transition-colors hover:bg-accent/20"
                    >
                      Go to {tickerUpper}
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ) : (
                "Type a stock ticker or page name..."
              )}
            </Command.Empty>

            {/* Dynamic "Go to ticker" option when typing a valid ticker not in list */}
            {isTicker && !tickerInList && search.length > 0 && (
              <>
                <Command.Group heading="Stock" className="px-2">
                  <Command.Item
                    value={`go-to-${tickerUpper}`}
                    onSelect={() => handleSelect(`/stock/${tickerUpper}`)}
                    className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:bg-white/[0.05] hover:text-foreground data-[selected]:bg-white/[0.05] data-[selected]:text-foreground"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 font-mono text-xs font-bold text-accent">
                      {tickerUpper}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs">Go to stock page</p>
                      <p className="text-[10px] text-muted">View analysis for {tickerUpper}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted" />
                  </Command.Item>
                </Command.Group>
                <Command.Separator className="my-2 h-px bg-white/[0.06]" />
              </>
            )}

            {/* Navigation */}
            <Command.Group heading="Navigation" className="px-2">
              {navItems
                .filter((item) =>
                  item.label.toLowerCase().includes(search.toLowerCase())
                )
                .map((item) => (
                  <Command.Item
                    key={item.href}
                    value={`nav-${item.label}`}
                    onSelect={() => handleSelect(item.href)}
                    className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:bg-white/[0.05] hover:text-foreground data-[selected]:bg-white/[0.05] data-[selected]:text-foreground"
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Command.Item>
                ))}
            </Command.Group>

            {/* Stocks */}
            {filteredStocks.length > 0 && (
              <>
                <Command.Separator className="my-2 h-px bg-white/[0.06]" />
                <Command.Group heading="Stocks" className="px-2">
                  {filteredStocks.map((stock) => (
                    <Command.Item
                      key={stock.ticker}
                      value={`stock-${stock.ticker}-${stock.name}`}
                      onSelect={() => handleSelect(`/stock/${stock.ticker}`)}
                      className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:bg-white/[0.05] hover:text-foreground data-[selected]:bg-white/[0.05] data-[selected]:text-foreground"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.05] font-mono text-[10px] font-bold">
                        {stock.ticker.slice(0, 4)}
                      </div>
                      <div className="flex-1">
                        <p className="font-mono text-xs font-bold">{stock.ticker}</p>
                        <p className="text-[10px] text-muted">{stock.name}</p>
                      </div>
                      <span className="text-[10px] text-muted/60">{stock.sector}</span>
                    </Command.Item>
                  ))}
                </Command.Group>
              </>
            )}
          </Command.List>
        </Command>
      </div>
    </>
  );
}
