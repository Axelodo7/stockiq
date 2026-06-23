import MarketingShell from "./components/marketing-shell";
import Link from "next/link";
import {
  Activity,
  Brain,
  Briefcase,
  BarChart3,
  Check,
  Zap,
  Crown,
  Building2,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

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
  },
];

export default function MarketingHome() {
  return (
    <MarketingShell>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="relative mx-auto max-w-7xl px-4 py-32 sm:px-6 sm:py-40 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="font-display text-4xl font-bold tracking-tight text-foreground sm:text-6xl lg:text-7xl" style={{ textWrap: "balance" }}>
              Smarter Trading,
              <br />
              <span className="text-accent">Powered by AI</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted sm:text-xl" style={{ textWrap: "pretty" }}>
              Harness machine learning and real-time market data to make
              informed investment decisions. From technical analysis to
              portfolio optimization — all in one terminal.
            </p>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button size="lg" asChild>
                <Link href="/sign-up">Get Started Free</Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/sign-in">
                  Log In
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-border bg-panel py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl" style={{ textWrap: "balance" }}>
              Everything you need to trade smarter
            </h2>
            <p className="mt-4 text-muted" style={{ textWrap: "pretty" }}>
              Professional-grade tools previously available only to institutional
              traders, now in your hands.
            </p>
          </div>
          <div className="mt-16 grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group bg-panel p-6 transition-colors hover:bg-panel-elevated"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="font-display text-base font-semibold text-foreground">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {feature.description}
                </p>
              </div>
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
                <div className="font-display text-4xl font-bold text-foreground sm:text-5xl">
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
            <h2 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl" style={{ textWrap: "balance" }}>
              Simple, transparent pricing
            </h2>
            <p className="mt-4 text-muted" style={{ textWrap: "pretty" }}>
              Choose the plan that fits your trading style.
            </p>
          </div>
          <div className="mt-16 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {pricingTiers.map((tier) => {
              const Icon = tier.icon;
              return (
                <div
                  key={tier.name}
                  className={`relative flex flex-col rounded-xl border p-6 transition-colors ${
                    tier.highlighted
                      ? "border-accent bg-panel-elevated"
                      : "border-border bg-panel hover:border-accent/30"
                  }`}
                >
                  {tier.highlighted && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-md bg-accent px-3 py-1 text-xs font-semibold text-accent-fg">
                      Most Popular
                    </div>
                  )}
                  <div className="mb-4 flex items-center gap-2">
                    <Icon className="h-5 w-5 text-accent" />
                    <h3 className="font-display text-lg font-semibold text-foreground">
                      {tier.name}
                    </h3>
                  </div>
                  <div className="mb-6 flex items-baseline gap-1">
                    <span className="font-display text-4xl font-bold text-foreground">
                      {tier.price}
                    </span>
                    <span className="text-sm text-muted">{tier.period}</span>
                  </div>
                  <ul className="mb-6 flex-1 space-y-2.5">
                    {tier.features.map((feat) => (
                      <li key={feat} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 shrink-0 text-positive" />
                        <span className="text-foreground">{feat}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full"
                    variant={tier.highlighted ? "default" : "outline"}
                    asChild
                  >
                    <Link href={tier.href}>{tier.cta}</Link>
                  </Button>
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
            <h2 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl" style={{ textWrap: "balance" }}>
              Built for the future of investing
            </h2>
            <p className="mt-6 text-lg text-muted" style={{ textWrap: "pretty" }}>
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
          <h2 className="font-display text-3xl font-bold tracking-tight text-foreground" style={{ textWrap: "balance" }}>
            Ready to trade smarter?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted" style={{ textWrap: "pretty" }}>
            Join thousands of traders using AI to make better investment
            decisions.
          </p>
          <div className="mt-8">
            <Button size="lg" asChild>
              <Link href="/sign-up">Start Free Today</Link>
            </Button>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
