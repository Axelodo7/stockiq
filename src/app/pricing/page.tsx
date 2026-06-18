import MarketingShell from "../components/marketing-shell";
import Link from "next/link";
import { Check, Lock, Zap, Crown, Building2 } from "lucide-react";

const tiers = [
  {
    name: "Free",
    icon: Zap,
    price: "$0",
    period: "forever",
    description: "Perfect for getting started with stock tracking",
    color: "text-muted",
    borderColor: "border-white/[0.06]",
    features: [
      { text: "3 watchlists", included: true },
      { text: "5 price alerts", included: true },
      { text: "1 portfolio", included: true },
      { text: "10 tracked tickers", included: true },
      { text: "Basic predictions", included: true },
      { text: "Daily market summary", included: true },
      { text: "AI analysis", included: false },
      { text: "Backtesting", included: false },
    ],
    cta: "Get Started",
    href: "/sign-up",
    highlighted: false,
  },
  {
    name: "Pro",
    icon: Crown,
    price: "$49",
    period: "/month",
    description: "For serious traders who need AI-powered insights",
    color: "text-cyan",
    borderColor: "border-cyan/30",
    features: [
      { text: "Unlimited watchlists", included: true },
      { text: "Unlimited alerts", included: true },
      { text: "5 portfolios", included: true },
      { text: "Unlimited tracked tickers", included: true },
      { text: "AI predictions (6 windows)", included: true },
      { text: "AI analysis & signals", included: true },
      { text: "Advanced charts", included: true },
      { text: "Backtesting", included: true },
    ],
    cta: "Start Pro Trial",
    href: "/sign-up",
    highlighted: true,
  },
  {
    name: "Elite",
    icon: Crown,
    price: "$99",
    period: "/month",
    description: "For traders who want full ML model control",
    color: "text-purple",
    borderColor: "border-purple/30",
    features: [
      { text: "Everything in Pro", included: true },
      { text: "Custom ML model training", included: true },
      { text: "Real-time data feeds", included: true },
      { text: "REST & WebSocket API", included: true },
      { text: "Unlimited portfolios", included: true },
      { text: "Portfolio risk analytics", included: true },
      { text: "Earnings calendar", included: true },
      { text: "Priority support", included: true },
    ],
    cta: "Start Elite Trial",
    href: "/sign-up",
    highlighted: false,
  },
  {
    name: "Enterprise",
    icon: Building2,
    price: "$299",
    period: "/month",
    description: "For teams and institutions",
    color: "text-amber",
    borderColor: "border-amber/30",
    features: [
      { text: "Everything in Elite", included: true },
      { text: "Custom reports", included: true },
      { text: "Team access (unlimited)", included: true },
      { text: "Dedicated account manager", included: true },
      { text: "99.99% SLA guarantee", included: true },
      { text: "Custom integrations & SSO", included: true },
      { text: "On-premise deployment", included: true },
      { text: "White-label option", included: true },
    ],
    cta: "Contact Sales",
    href: "/sign-up",
    highlighted: false,
  },
];

export default function PricingPage() {
  return (
    <MarketingShell>
      <section className="relative py-24">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 h-[400px] w-[800px] -translate-x-1/2 -translate-y-1/4 rounded-full bg-accent/5 blur-[120px]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
              <span className="gradient-text">Simple, transparent pricing</span>
            </h1>
            <p className="mt-4 text-lg text-muted">
              Start for free, upgrade when you need more power.
            </p>
          </div>

          <div className="mt-16 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {tiers.map((tier) => {
              const Icon = tier.icon;
              return (
                <div
                  key={tier.name}
                  className={`relative flex flex-col rounded-2xl border bg-white/[0.02] p-6 backdrop-blur-xl transition-all hover:bg-white/[0.04] ${
                    tier.highlighted
                      ? `${tier.borderColor} shadow-[0_0_40px_-15px_var(--accent)]`
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
                    <h2 className="font-display text-lg font-semibold">{tier.name}</h2>
                  </div>

                  <p className="mb-4 text-xs text-muted">{tier.description}</p>

                  <div className="mb-6 flex items-baseline gap-1">
                    <span className="font-display text-4xl font-bold">{tier.price}</span>
                    <span className="text-xs text-muted">{tier.period}</span>
                  </div>

                  <ul className="mb-6 flex-1 space-y-2.5">
                    {tier.features.map((feat) => (
                      <li key={feat.text} className="flex items-center gap-2 text-xs">
                        {feat.included ? (
                          <Check className="h-3.5 w-3.5 shrink-0 text-positive" />
                        ) : (
                          <Lock className="h-3.5 w-3.5 shrink-0 text-muted/30" />
                        )}
                        <span className={feat.included ? "text-foreground" : "text-muted/40"}>
                          {feat.text}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={tier.href}
                    className={`block w-full rounded-xl py-2.5 text-center text-sm font-bold transition-all ${
                      tier.highlighted
                        ? "bg-gradient-to-r from-cyan to-accent text-black hover:shadow-lg hover:shadow-accent/20"
                        : "border border-white/10 bg-white/[0.03] text-foreground hover:bg-white/[0.06]"
                    }`}
                  >
                    {tier.cta}
                  </Link>
                </div>
              );
            })}
          </div>

          <p className="mt-10 text-center text-xs text-muted">
            All plans include SSL, 2FA, and bank-level encryption. Cancel anytime.
            <br />
            Prices in USD. Annual billing saves 20%.
          </p>
        </div>
      </section>
    </MarketingShell>
  );
}
