"use client";

import { useState, useEffect } from "react";
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
  LogIn,
  Loader2,
  AlertCircle,
  Save,
} from "lucide-react";
import Link from "next/link";
import { UserProfile, useUser } from "@clerk/nextjs";
import { useTheme } from "next-themes";
import { GlassCard } from "@/components/ui/glass-card";
import { GlowBadge } from "@/components/ui/glow-badge";
import { GradientButton } from "@/components/ui/gradient-button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { usePreferences } from "@/hooks/use-preferences";
import {
  type SubscriptionTier,
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

export default function SettingsPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const { preferences, loading: prefsLoading, saving, updatePreferences, error: prefsError } = usePreferences();
  const [mounted, setMounted] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  useEffect(() => {
    setMounted(true);
  }, []);

  // Show sign-in CTA if not authenticated
  if (mounted && isLoaded && !isSignedIn) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-xl font-bold tracking-tight sm:text-2xl">
            <span className="gradient-text">Settings</span>
          </h1>
          <p className="mt-1 text-xs text-muted sm:text-sm">Manage your account, subscription, and notifications</p>
        </div>
        <GlassCard>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-accent/10">
              <LogIn className="h-8 w-8 text-accent" />
            </div>
            <h3 className="mb-1 font-display text-lg font-semibold">Sign in to manage settings</h3>
            <p className="mb-6 max-w-sm text-sm text-muted">
              Sign in to manage your profile, subscription, and notification preferences.
            </p>
            <Link href="/sign-in">
              <GradientButton variant="brand" size="md">
                <LogIn className="h-4 w-4" />
                Sign In
              </GradientButton>
            </Link>
          </div>
        </GlassCard>
      </div>
    );
  }

  const handleToggle = async (key: "emailAlerts" | "priceAlerts" | "predictionUpdates" | "weeklyDigest" | "earningsAlerts", value: boolean) => {
    setSaveStatus("saving");
    try {
      await updatePreferences({ [key]: value });
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div className="min-w-0">
          <h1 className="font-display text-xl font-bold tracking-tight sm:text-2xl">
            <span className="gradient-text">Settings</span>
          </h1>
          <p className="mt-1 text-xs text-muted sm:text-sm">Manage your account, subscription, and notifications</p>
        </div>
        <div className="flex items-center gap-2">
          {preferences && (
            <GlowBadge variant={getTierBadgeVariant(preferences)}>
              {user?.emailAddresses?.[0]?.emailAddress?.split("@")[0] || "Member"}
            </GlowBadge>
          )}
          {saveStatus === "saving" && (
            <span className="flex items-center gap-1 text-xs text-muted">
              <Loader2 className="h-3 w-3 animate-spin" />
              Saving...
            </span>
          )}
          {saveStatus === "saved" && (
            <span className="flex items-center gap-1 text-xs text-emerald-400">
              <Check className="h-3 w-3" />
              Saved
            </span>
          )}
          {saveStatus === "error" && (
            <span className="flex items-center gap-1 text-xs text-red-400">
              <AlertCircle className="h-3 w-3" />
              Error
            </span>
          )}
        </div>
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
            <TabsTrigger value="appearance" className="gap-1.5">
              <Palette className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Appearance</span>
              <span className="sm:hidden">Theme</span>
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
              const tierColors: Record<string, string> = {
                FREE: "border-border",
                PRO: "border-cyan/30",
                ELITE: "border-purple/30",
                ENTERPRISE: "border-amber/30",
              };
              const isActive = t.tier === "FREE"; // Hardcoded for now
              return (
                <GlassCard
                  key={t.tier}
                  padding="none"
                  className={cn(
                    "relative overflow-hidden",
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
              <GlowBadge variant="default">FREE</GlowBadge>
            </div>
            <div className="space-y-0">
              {[
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
              ].map((f) => {
                const allowed = f.name === "watchlists" || f.name === "alerts" || f.name === "predictions";
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

        {/* Appearance Tab */}
        <TabsContent value="appearance" className="space-y-6">
          <GlassCard>
            <div className="mb-4 flex items-center gap-2">
              <Palette className="h-4 w-4 text-accent" />
              <h2 className="font-display text-sm font-semibold">Theme</h2>
            </div>
            <p className="mb-4 text-sm text-muted">
              Choose how StockIQ looks. Your preference is saved automatically.
            </p>

            {/* Inline theme picker — works on mobile too */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                { value: "light", label: "Light", desc: "Bright, easy on the eyes during the day" },
                { value: "dark", label: "Dark", desc: "Easier on the eyes in low light" },
                { value: "system", label: "System", desc: "Follows your device settings" },
              ].map(({ value, label, desc }) => (
                <ThemeOption key={value} value={value} label={label} desc={desc} />
              ))}
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

            {prefsError && (
              <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/5 p-3 text-sm text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                Failed to load preferences. Changes may not save.
              </div>
            )}

            {prefsLoading && !preferences ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-12 animate-pulse rounded bg-panel-elevated" />
                ))}
              </div>
            ) : preferences ? (
              <div className="space-y-4">
                {[
                  { key: "priceAlerts" as const, label: "Price Alerts", desc: "Get notified when price targets are hit" },
                  { key: "predictionUpdates" as const, label: "Prediction Updates", desc: "AI prediction signal changes" },
                  { key: "earningsAlerts" as const, label: "Earnings Reminders", desc: "Upcoming earnings reports" },
                  { key: "weeklyDigest" as const, label: "Weekly Digest", desc: "Portfolio summary every Monday" },
                  { key: "emailAlerts" as const, label: "All Email Notifications", desc: "Master toggle for all emails" },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className="text-[10px] text-muted">{item.desc}</p>
                    </div>
                    <button
                      onClick={() => handleToggle(item.key, !preferences[item.key])}
                      disabled={saving}
                      className={cn(
                        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors disabled:opacity-50",
                        preferences[item.key] ? "bg-accent" : "bg-zinc-500/20"
                      )}
                      aria-label={`Toggle ${item.label}`}
                    >
                      <span
                        className={cn(
                          "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                          preferences[item.key] ? "translate-x-6" : "translate-x-1"
                        )}
                      />
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
          </GlassCard>
        </TabsContent>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <GlassCard padding="none">
            <div className="flex items-center gap-2 border-b border-border px-4 py-3">
              <User className="h-4 w-4 text-purple" />
              <h2 className="font-display text-sm font-semibold">Profile</h2>
            </div>
            <div className="p-4">
              {user ? (
                <UserProfile
                  appearance={{
                    elements: {
                      rootBox: "w-full",
                      card: "bg-transparent shadow-none w-full",
                      navbar: "hidden",
                      pageScrollBox: "p-0",
                      profileSectionPrimaryButton__manage: "hidden",
                      profileSectionTitleText: "text-foreground font-display",
                      profileSectionContent: "text-muted",
                      formButtonPrimary: "bg-accent text-accent-fg hover:bg-accent/90",
                      formFieldInput: "bg-panel-elevated border-border",
                      avatarImageActionsUpload: "hidden",
                      userPreview: "border-border bg-panel-elevated",
                    },
                  }}
                />
              ) : (
                <div className="py-8 text-center">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted" />
                </div>
              )}
            </div>
          </GlassCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function getTierBadgeVariant(prefs: { emailAlerts: boolean; priceAlerts: boolean }): "default" | "info" {
  return prefs.emailAlerts && prefs.priceAlerts ? "info" : "default";
}

function ThemeOption({ value, label, desc }: { value: string; label: string; desc: string }) {
  const { theme, setTheme } = useTheme();
  const active = theme === value;

  return (
    <button
      onClick={() => setTheme(value)}
      className={cn(
        "group flex flex-col items-start gap-3 rounded-lg border p-4 text-left transition-all min-h-[44px]",
        active
          ? "border-accent bg-accent/10"
          : "border-border bg-panel hover:border-accent/30"
      )}
    >
      <div className="flex w-full items-center justify-between">
        <div className={cn(
          "flex h-10 w-10 items-center justify-center rounded-lg",
          active ? "bg-accent text-accent-fg" : "bg-panel-elevated text-muted"
        )}>
          {value === "light" && <span className="text-lg">☀️</span>}
          {value === "dark" && <span className="text-lg">🌙</span>}
          {value === "system" && <span className="text-lg">💻</span>}
        </div>
        {active && (
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-accent-fg">
            <Check className="h-3 w-3" />
          </div>
        )}
      </div>
      <div>
        <p className="font-display text-sm font-semibold">{label}</p>
        <p className="mt-0.5 text-xs text-muted">{desc}</p>
      </div>
    </button>
  );
}
