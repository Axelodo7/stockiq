"use client";

import { useState } from "react";
import {
  User,
  Bell,
  Palette,
  Shield,
  Crown,
  Lock,
  Check,
  Zap,
  Mail,
  CreditCard,
} from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { GlowBadge } from "@/components/ui/glow-badge";
import { GradientButton } from "@/components/ui/gradient-button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  type SubscriptionTier,
  hasFeature,
  getTierInfo,
} from "@/lib/feature-gating";

const tiers: { tier: SubscriptionTier; price: string; period: string; features: string[] }[] = [
  {
    tier: "FREE",
    price: "$0",
    period: "forever",
    features: ["3 watchlists", "5 price alerts", "1 portfolio", "Basic predictions", "10 tracked tickers"],
  },
  {
    tier: "PRO",
    price: "$49",
    period: "/month",
    features: ["Unlimited watchlists", "Unlimited alerts", "5 portfolios", "AI analysis", "Advanced charts", "Backtesting"],
  },
  {
    tier: "ELITE",
    price: "$99",
    period: "/month",
    features: ["Everything in Pro", "Model training", "Real-time data", "API access", "Unlimited portfolios", "Priority support"],
  },
  {
    tier: "ENTERPRISE",
    price: "$299",
    period: "/month",
    features: ["Everything in Elite", "Custom reports", "Team access", "Dedicated support", "SLA guarantee", "Custom integrations"],
  },
];

const allFeatures = [
  { name: "watchlists", label: "Watchlists", icon: "📊" },
  { name: "alerts", label: "Price Alerts", icon: "🔔" },
  { name: "portfolios", label: "Portfolios", icon: "💼" },
  { name: "predictions", label: "AI Predictions", icon: "🧠" },
  { name: "ai_analysis", label: "AI Analysis", icon: "📈" },
  { name: "backtesting", label: "Backtesting", icon: "⏱️" },
  { name: "model_training", label: "Model Training", icon: "⚙️" },
  { name: "advanced_charts", label: "Advanced Charts", icon: "📉" },
  { name: "api_access", label: "API Access", icon: "🔗" },
  { name: "custom_reports", label: "Custom Reports", icon: "📄" },
] as const;

export default function SettingsPage() {
  const [currentTier] = useState<SubscriptionTier>("FREE");
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [priceAlerts, setPriceAlerts] = useState(true);
  const [predictionUpdates, setPredictionUpdates] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(true);
  const [earningsAlerts, setEarningsAlerts] = useState(false);

  const tierInfo = getTierInfo(currentTier);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            <span className="gradient-text">Settings</span>
          </h1>
          <p className="mt-1 text-sm text-muted">Manage your account, subscription, and notifications</p>
        </div>
        <GlowBadge variant={currentTier === "FREE" ? "default" : currentTier === "PRO" ? "info" : currentTier === "ELITE" ? "purple" : "warning"}>
          {tierInfo.label} Plan
        </GlowBadge>
      </div>

      <Tabs defaultValue="subscription" className="space-y-6">
        <div className="overflow-x-auto">
          <TabsList className="w-full min-w-0 sm:w-auto">
            <TabsTrigger value="subscription" className="gap-1.5">
              <Crown className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Subscription</span>
              <span className="sm:hidden">Plan</span>
            </TabsTrigger>
            <TabsTrigger value="features" className="gap-1.5">
              <Shield className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Features</span>
              <span className="sm:hidden">Perks</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-1.5">
              <Bell className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Notifications</span>
              <span className="sm:hidden">Alerts</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="gap-1.5">
              <User className="h-3.5 w-3.5" />
              Profile
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Subscription Tab */}
        <TabsContent value="subscription" className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {tiers.map((t) => {
              const isActive = t.tier === currentTier;
              const tierColors: Record<string, string> = {
                FREE: "border-border",
                PRO: "border-cyan/30",
                ELITE: "border-purple/30",
                ENTERPRISE: "border-amber/30",
              };
              return (
                <GlassCard
                  key={t.tier}
                  padding="none"
                  className={cn(
                    "relative overflow-hidden",
                    isActive && "ring-1 ring-accent/30",
                    tierColors[t.tier]
                  )}
                >
                  {isActive && (
                    <div className="absolute right-3 top-3">
                      <GlowBadge variant="success">
                        <Check className="h-3 w-3" /> Current
                      </GlowBadge>
                    </div>
                  )}
                  <div className="p-5">
                    <div className="mb-4">
                      <h3 className="font-display text-sm font-semibold">{getTierInfo(t.tier).label}</h3>
                      <div className="mt-2 flex items-baseline gap-1">
                        <span className="font-display text-3xl font-bold">{t.price}</span>
                        <span className="text-xs text-muted">{t.period}</span>
                      </div>
                    </div>
                    <ul className="mb-5 space-y-2">
                      {t.features.map((f) => (
                        <li key={f} className="flex items-center gap-2 text-xs">
                          <Check className="h-3 w-3 shrink-0 text-positive" />
                          <span className="text-muted">{f}</span>
                        </li>
                      ))}
                    </ul>
                    <GradientButton
                      variant={isActive ? "ghost" : t.tier === "PRO" ? "brand" : t.tier === "ELITE" ? "success" : "brand"}
                      size="sm"
                      className="w-full"
                      disabled={isActive}
                    >
                      {isActive ? "Current Plan" : "Upgrade"}
                    </GradientButton>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        </TabsContent>

        {/* Features Tab */}
        <TabsContent value="features" className="space-y-6">
          <GlassCard>
            <div className="mb-4 flex items-center gap-2">
              <Shield className="h-4 w-4 text-accent" />
              <h2 className="font-display text-sm font-semibold">Feature Access</h2>
              <GlowBadge variant="default">{getTierInfo(currentTier).label}</GlowBadge>
            </div>
            <div className="space-y-0">
              {allFeatures.map((f) => {
                const allowed = hasFeature(currentTier, f.name as Parameters<typeof hasFeature>[1]);
                return (
                  <div
                    key={f.name}
                    className={cn(
                      "flex items-center justify-between border-b border-border py-3 last:border-0",
                      !allowed && "opacity-50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-base">{f.icon}</span>
                      <span className="text-sm">{f.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {allowed ? (
                        <GlowBadge variant="success">
                          <Check className="h-3 w-3" /> Included
                        </GlowBadge>
                      ) : (
                        <GlowBadge variant="default">
                          <Lock className="h-3 w-3" /> Locked
                        </GlowBadge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </GlassCard>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <GlassCard>
            <div className="mb-4 flex items-center gap-2">
              <Mail className="h-4 w-4 text-cyan" />
              <h2 className="font-display text-sm font-semibold">Email Notifications</h2>
            </div>
            <div className="space-y-4">
              {[
                { label: "Price Alerts", desc: "Get notified when price targets are hit", checked: priceAlerts, onChange: setPriceAlerts },
                { label: "Prediction Updates", desc: "AI prediction signal changes", checked: predictionUpdates, onChange: setPredictionUpdates },
                { label: "Earnings Reminders", desc: "Upcoming earnings reports", checked: earningsAlerts, onChange: setEarningsAlerts },
                { label: "Weekly Digest", desc: "Portfolio summary every Monday", checked: weeklyDigest, onChange: setWeeklyDigest },
                { label: "Email Alerts", desc: "Enable all email notifications", checked: emailAlerts, onChange: setEmailAlerts },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-[10px] text-muted">{item.desc}</p>
                  </div>
                  <button
                    onClick={() => item.onChange(!item.checked)}
                    className={cn(
                      "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors",
                      item.checked ? "bg-accent" : "bg-white/10"
                    )}
                  >
                    <span
                      className={cn(
                        "inline-block h-4 w-4 rounded-full bg-white transition-transform",
                        item.checked ? "translate-x-6" : "translate-x-1"
                      )}
                    />
                  </button>
                </div>
              ))}
            </div>
          </GlassCard>
        </TabsContent>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <GlassCard>
            <div className="mb-4 flex items-center gap-2">
              <User className="h-4 w-4 text-purple" />
              <h2 className="font-display text-sm font-semibold">Profile</h2>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[10px] font-medium uppercase text-muted">Name</label>
                  <input
                    type="text"
                    defaultValue="Alex Johnson"
                    className="w-full rounded-lg border border-border bg-panel-elevated px-3 py-2 text-xs text-foreground placeholder:text-muted focus:border-accent/30 focus:outline-none focus:ring-1 focus:ring-accent/20"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-medium uppercase text-muted">Email</label>
                  <input
                    type="email"
                    defaultValue="alex@stockiq.app"
                    className="w-full rounded-lg border border-border bg-panel-elevated px-3 py-2 text-xs text-foreground placeholder:text-muted focus:border-accent/30 focus:outline-none focus:ring-1 focus:ring-accent/20"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <GradientButton variant="brand" size="sm">
                  Save Changes
                </GradientButton>
              </div>
            </div>
          </GlassCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}
