import MarketingShell from "./components/marketing-shell";
import Link from "next/link";
import {
  TrendingUp,
  Activity,
  Brain,
  Briefcase,
  BarChart3,
  Check,
  Zap,
  Crown,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: Activity,
    title: "Real-time Data",
    description:
      "Live market feeds with sub-second latency across NYSE, NASDAQ, and global exchanges.",
  },
  {
    icon: BarChart3,
    title: "Technical Indicators",
    description:
      "50+ indicators including RSI, MACD, Bollinger Bands, and custom algorithmic signals.",
  },
  {
    icon: Brain,
    title: "AI Predictions",
    description:
      "Machine learning models trained on decades of market data for price forecasting.",
  },
  {
    icon: Briefcase,
    title: "Portfolio Tracking",
    description:
      "Comprehensive portfolio analytics with real-time P&L, risk metrics, and allocation insights.",
  },
];

const stats = [
  { value: "10K+", label: "Active Users" },
  { value: "500+", label: "Tracked Stocks" },
  { value: "99.9%", label: "Uptime" },
];

const pricingTiers = [
  {
    name: "Free",
    icon: Zap,
    price: "$0",
    period: "forever",
    features: ["3 watchlists", "5 alerts", "1 portfolio", "Basic predictions", "10 tracked tickers"],
    cta: "Get Started",
    href: "/sign-up",
    highlighted: false,
    color: "text-muted",
  },
  {
    name: "Pro",
    icon: Crown,
    price: "$49",
    period: "/mo",
    features: ["Unlimited watchlists", "Unlimited alerts", "AI analysis", "Advanced charts", "Backtesting", "5 portfolios"],
    cta: "Start Pro Trial",
    href: "/sign-up",
    highlighted: true,
    color: "text-cyan",
  },
  {
    name: "Elite",
    icon: Crown,
    price: "$99",
    period: "/mo",
    features: ["ML model training", "Real-time data", "API access", "Risk analytics", "Unlimited portfolios", "Priority support"],
    cta: "Start Elite Trial",
    href: "/sign-up",
    highlighted: false,
    color: "text-purple",
  },
  {
    name: "Enterprise",
    icon: Building2,
    price: "$299",
    period: "/mo",
    features: ["Custom reports", "Team access", "SLA guarantee", "Custom integrations", "On-premise", "White-label"],
    cta: "Contact Sales",
    href: "/sign-up",
    highlighted: false,
    color: "text-amber",
  },
];

export default function MarketingHome() {
  return (
    <MarketingShell>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 h-[600px] w-[900px] -translate-x-1/2 -translate-y-1/4 rounded-full bg-accent/5 blur-[120px]" />
          <div className="absolute right-0 top-1/3 h-[400px] w-[500px] translate-x-1/4 rounded-full bg-accent/3 blur-[100px]" />
          <div className="absolute bottom-0 left-1/4 h-[300px] w-[400px] translate-y-1/3 rounded-full bg-positive/3 blur-[80px]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-32 sm:px-6 sm:py-40 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/5 px-4 py-1.5 text-xs font-medium text-accent">
              <TrendingUp className="h-3.5 w-3.5" />
              AI-Powered Market Intelligence
            </div>
            <h1 className="font-display text-4xl font-bold tracking-tight text-foreground sm:text-6xl lg:text-7xl">
              Smarter Trading,{" "}
              <span className="text-accent">Powered by AI</span>
            </h1>
            <p className="mt-6 text-lg text-muted sm:text-xl">
              Harness machine learning and real-time market data to make
              informed investment decisions. From technical analysis to
              portfolio optimization — all in one terminal.
            </p>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button size="lg" asChild>
                <a href="/sign-up">Get Started Free</a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-border bg-panel py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Everything you need to trade smarter
            </h2>
            <p className="mt-4 text-muted">
              Professional-grade tools previously available only to institutional
              traders, now in your hands.
            </p>
          </div>
          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <Card
                key={feature.title}
                className="group border-border/50 bg-background transition-all hover:border-accent/30 hover:shadow-[0_0_30px_-10px_var(--accent)]"
              >
                <CardContent className="p-6">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10 text-accent transition-colors group-hover:bg-accent/20">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-display text-lg font-semibold text-foreground">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-t border-border py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="font-mono text-4xl font-bold text-accent sm:text-5xl">
                  {stat.value}
                </div>
                <div className="mt-2 text-sm text-muted">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-t border-border bg-panel py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Simple, transparent pricing
            </h2>
            <p className="mt-4 text-muted">
              Choose the plan that fits your trading style.
            </p>
          </div>
          <div className="mt-16 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {pricingTiers.map((tier) => {
              const Icon = tier.icon;
              return (
                <div
                  key={tier.name}
                  className={`relative flex flex-col rounded-2xl border bg-white/[0.02] p-6 backdrop-blur-xl transition-all hover:bg-white/[0.04] ${
                    tier.highlighted
                      ? "border-cyan/30 shadow-[0_0_40px_-15px_var(--accent)]"
                      : "border-white/[0.06] hover:border-white/10"
                  }`}
                >
                  {tier.highlighted && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent px-3 py-1 text-[10px] font-bold text-black">
                      MOST POPULAR
                    </div>
                  )}
                  <div className="mb-4 flex items-center gap-2">
                    <Icon className={`h-5 w-5 ${tier.color}`} />
                    <h3 className="font-display text-lg font-semibold text-foreground">
                      {tier.name}
                    </h3>
                  </div>
                  <div className="mb-6 flex items-baseline gap-1">
                    <span className="font-display text-4xl font-bold text-foreground">
                      {tier.price}
                    </span>
                    <span className="text-xs text-muted">{tier.period}</span>
                  </div>
                  <ul className="mb-6 flex-1 space-y-2.5">
                    {tier.features.map((feat) => (
                      <li key={feat} className="flex items-center gap-2 text-xs">
                        <Check className="h-3.5 w-3.5 shrink-0 text-positive" />
                        <span className="text-foreground">{feat}</span>
                      </li>
                    ))}
                  </ul>
                    <a
                      href={tier.href}
                      className={`flex w-full items-center justify-center rounded-xl py-2.5 text-sm font-bold transition-all ${
                        tier.highlighted
                          ? "bg-gradient-to-r from-cyan to-accent text-black hover:shadow-lg hover:shadow-accent/20"
                          : ""
                      } ${tier.highlighted ? "" : "border border-white/10 bg-white/[0.03] text-foreground hover:bg-white/[0.06]"}`}
                    >
                      {tier.cta}
                    </a>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="border-t border-border py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Built for the future of investing
            </h2>
            <p className="mt-6 text-lg text-muted">
              StockIQ combines institutional-grade data infrastructure with
              cutting-edge machine learning to give every investor an edge.
              Our platform processes millions of data points per second to
              surface actionable insights before the market moves.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border bg-panel py-20">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl font-bold tracking-tight text-foreground">
            Ready to trade smarter?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted">
            Join thousands of traders using AI to make better investment
            decisions.
          </p>
          <div className="mt-8">
            <Button size="lg" asChild>
              <a href="/sign-up">Start Free Today</a>
            </Button>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
