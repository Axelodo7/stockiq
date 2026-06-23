"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "bot";
  text: string;
}

const FAQ: Record<string, { answer: string; keywords: string[] }> = {
  "what is stockiq": {
    answer:
      "StockIQ is an AI-powered stock prediction platform that combines machine learning forecasts, portfolio management, real-time market data, and technical analysis — all in a professional, Bloomberg Terminal-style interface.",
    keywords: ["what", "stockiq", "about", "platform", "site"],
  },
  "how do predictions work": {
    answer:
      "StockIQ uses an ensemble of ML models (XGBoost, Random Forest, LSTM, Transformer) trained on historical price data and 37+ technical features. Models are backtested and the ensemble combines their outputs for more robust predictions. Predictions are estimates — not guaranteed investment performance.",
    keywords: ["prediction", "how", "work", "model", "ml", "ai", "forecast"],
  },
  "is it free": {
    answer:
      "Yes! The Free tier includes basic predictions, 3 watchlists, 5 alerts, and 1 portfolio. Pro ($49/mo) unlocks AI analysis and backtesting. Elite ($99/mo) adds model training and API access. Enterprise ($299/mo) includes custom reports and team access.",
    keywords: ["free", "pricing", "cost", "plan", "tier", "subscription", "price"],
  },
  "pricing tiers": {
    answer:
      "• Free ($0) — 3 watchlists, 5 alerts, 1 portfolio, basic predictions\n• Pro ($49/mo) — Unlimited watchlists/alerts, AI analysis, backtesting, advanced charts\n• Elite ($99/mo) — Model training, real-time data, API access, unlimited portfolios\n• Enterprise ($299/mo) — Custom reports, team access, dedicated support, SLA",
    keywords: ["pricing", "tiers", "plans", "pro", "elite", "enterprise"],
  },
  "what features does stockiq have": {
    answer:
      "StockIQ includes: AI price predictions, technical analysis, portfolio tracking, watchlists, price alerts, risk analytics, earnings calendar, backtesting, model training, market heatmap, and a Bloomberg-style dashboard. All with a dark \"Quantum Terminal\" aesthetic.",
    keywords: ["features", "include", "have", "offer", "tools"],
  },
  "how to use the portfolio": {
    answer:
      "Go to /portfolio to view your holdings. You can add positions by clicking \"Add Position\", enter your ticker, shares, and average cost. The portfolio shows real-time P&L, allocation charts, and an equity curve vs benchmark.",
    keywords: ["portfolio", "use", "add", "position", "holdings", "track"],
  },
  "how to set alerts": {
    answer:
      "Navigate to /alerts and click \"Create Alert\". Set a ticker, choose price/volume/percent condition, set your target value, and toggle it on. Alerts trigger when the condition is met and show up in your notification bell.",
    keywords: ["alert", "notification", "price", "set", "create"],
  },
  "what charts are available": {
    answer:
      "StockIQ uses TradingView's Lightweight Charts for professional-grade candlestick, volume, and area charts. You also get mini sparklines in watchlists, heatmaps on the market page, and equity curves in the portfolio.",
    keywords: ["chart", "graph", "candlestick", "tradingview", "visual"],
  },
  "what is backtesting": {
    answer:
      "Backtesting runs your ML models against historical data to evaluate how they would have performed. You can compare model accuracy, win rate, Sharpe ratio, and see equity curves. Available on Pro tier and above.",
    keywords: ["backtest", "backtesting", "history", "evaluate", "performance"],
  },
  "what is risk analytics": {
    answer:
      "The Risk Dashboard (/risk) shows portfolio risk metrics including VaR, Sharpe ratio, beta, concentration risk by sector/stock, and overall risk scoring. It helps you understand and manage portfolio downside.",
    keywords: ["risk", "analytics", "var", "sharpe", "beta", "safety"],
  },
  "how to search stocks": {
    answer:
      "Use the search bar at the top of any page (or press Cmd+K / Ctrl+K). Type any ticker symbol or company name. You can also navigate to /stock/AAPL (or any ticker) directly for detailed analysis.",
    keywords: ["search", "find", "stock", "ticker", "lookup"],
  },
  "who built stockiq": {
    answer:
      "StockIQ was built as a modern fintech platform using Next.js 15, TypeScript, Tailwind CSS, Prisma, Clerk auth, and a Python FastAPI ML service. It's designed to rival institutional-grade terminals with a consumer-friendly UX.",
    keywords: ["who", "built", "creator", "made", "tech", "stack"],
  },
  "is my data safe": {
    answer:
      "Yes. StockIQ uses Clerk for secure authentication, encrypted connections (HTTPS), and follows security best practices. Your portfolio and watchlist data is tied to your authenticated account and only accessible by you.",
    keywords: ["safe", "security", "data", "privacy", "secure", "encryption"],
  },
  "how to upgrade my plan": {
    answer:
      "Go to /settings and click the Subscription tab. Choose your desired plan tier and click Upgrade. Currently payment integration is in development — contact support for manual upgrades.",
    keywords: ["upgrade", "plan", "subscription", "change", "tier"],
  },
};

const FALLBACK_ANSWER =
  "I'm not sure about that specific question. Here are some things I can help with:\n\n• What is StockIQ?\n• How do predictions work?\n• Pricing and plans\n• How to use the portfolio\n• Setting alerts\n• Available charts\n• Backtesting\n• Risk analytics\n• Searching stocks\n• Data safety\n\nTry asking one of these topics!";

function matchFAQ(input: string): string {
  const lower = input.toLowerCase().trim();
  for (const [, entry] of Object.entries(FAQ)) {
    if (entry.keywords.some((kw) => lower.includes(kw))) {
      return entry.answer;
    }
  }
  return FALLBACK_ANSWER;
}

export function ChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "bot",
      text: "Hi! I'm StockIQ Assistant. Ask me anything about the platform — features, pricing, how to use it, or just say hi!",
    },
  ]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const send = () => {
    const text = input.trim();
    if (!text) return;

    const userMsg: Message = { id: Date.now().toString(), role: "user", text };
    const botMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: "bot",
      text: matchFAQ(text),
    };

    setMessages((prev) => [...prev, userMsg, botMsg]);
    setInput("");
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all duration-300 hover:scale-105",
          open
            ? "bg-panel-elevated text-foreground border border-border"
            : "bg-accent text-accent-fg"
        )}
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 flex w-[340px] max-w-[calc(100vw-3rem)] flex-col overflow-hidden rounded-xl border border-border bg-panel shadow-xl sm:w-[380px]">
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-border px-4 py-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent">
              <Bot className="h-4 w-4 text-foreground" />
            </div>
            <div>
              <p className="text-sm font-semibold">StockIQ Assistant</p>
              <p className="text-[10px] text-muted">Ask about features, pricing, or how to use the app</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3" style={{ maxHeight: "360px" }}>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn("flex gap-2", msg.role === "user" ? "justify-end" : "justify-start")}
              >
                {msg.role === "bot" && (
                  <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan/10">
                    <Bot className="h-3 w-3 text-cyan" />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[80%] whitespace-pre-line rounded-xl px-3 py-2 text-xs leading-relaxed",
                    msg.role === "user"
                      ? "bg-accent/20 text-foreground"
                      : "bg-panel-elevated text-muted"
                  )}
                >
                  {msg.text}
                </div>
                {msg.role === "user" && (
                  <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple/10">
                    <User className="h-3 w-3 text-purple" />
                  </div>
                )}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Quick questions */}
          <div className="flex gap-1.5 overflow-x-auto border-t border-border px-4 py-2">
            {["Pricing", "Features", "Portfolio", "Predictions"].map((q) => (
              <button
                key={q}
                onClick={() => {
                  setInput(q);
                  setTimeout(() => {
                    const userMsg: Message = { id: Date.now().toString(), role: "user", text: q };
                    const botMsg: Message = {
                      id: (Date.now() + 1).toString(),
                      role: "bot",
                      text: matchFAQ(q),
                    };
                    setMessages((prev) => [...prev, userMsg, botMsg]);
                    setInput("");
                  }, 100);
                }}
                className="shrink-0 rounded-full border border-border bg-panel-elevated px-3 py-1 text-[10px] text-muted transition-colors hover:border-cyan/30 hover:text-foreground"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="flex items-center gap-2 border-t border-border px-3 py-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Ask a question..."
              className="flex-1 rounded-lg bg-panel-elevated px-3 py-2 text-xs text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-cyan/30"
            />
            <button
              onClick={send}
              disabled={!input.trim()}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/20 text-accent transition-colors hover:bg-accent/30 disabled:opacity-30"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
