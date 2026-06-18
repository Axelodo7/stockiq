/** Feature gating based on subscription tier */

export type SubscriptionTier = "FREE" | "PRO" | "ELITE" | "ENTERPRISE";

type FeatureName =
  | "watchlists"
  | "alerts"
  | "portfolios"
  | "tracked_tickers"
  | "predictions"
  | "ai_analysis"
  | "backtesting"
  | "model_training"
  | "real_time_data"
  | "advanced_charts"
  | "api_access"
  | "custom_reports";

const tierLevel: Record<SubscriptionTier, number> = {
  FREE: 0,
  PRO: 1,
  ELITE: 2,
  ENTERPRISE: 3,
};

const featureLimits: Record<FeatureName, { tier: SubscriptionTier; limit?: number } | null> = {
  watchlists: { tier: "FREE", limit: 3 },
  alerts: { tier: "FREE", limit: 5 },
  portfolios: { tier: "FREE", limit: 1 },
  tracked_tickers: { tier: "FREE", limit: 10 },
  predictions: { tier: "FREE" },
  ai_analysis: { tier: "PRO" },
  backtesting: { tier: "PRO" },
  model_training: { tier: "ELITE" },
  real_time_data: { tier: "ELITE" },
  advanced_charts: { tier: "PRO" },
  api_access: { tier: "ELITE" },
  custom_reports: { tier: "ENTERPRISE" },
};

const tierRequired: Record<FeatureName, SubscriptionTier> = {
  watchlists: "FREE",
  alerts: "FREE",
  portfolios: "FREE",
  tracked_tickers: "FREE",
  predictions: "FREE",
  ai_analysis: "PRO",
  backtesting: "PRO",
  model_training: "ELITE",
  real_time_data: "ELITE",
  advanced_charts: "PRO",
  api_access: "ELITE",
  custom_reports: "ENTERPRISE",
};

/**
 * Check if a user's tier has access to a feature.
 */
export function hasFeature(userTier: SubscriptionTier, feature: FeatureName): boolean {
  return tierLevel[userTier] >= tierLevel[tierRequired[feature]];
}

/**
 * Get the remaining usage count for a feature (returns Infinity for unlimited).
 */
export function getRemainingUsage(
  userTier: SubscriptionTier,
  feature: FeatureName,
  currentUsage: number
): number {
  const config = featureLimits[feature];
  if (!config || tierLevel[userTier] > tierLevel[config.tier]) {
    return Infinity; // Higher tier = unlimited
  }
  if (!config.limit) return Infinity;
  return Math.max(0, config.limit - currentUsage);
}

/**
 * Check if user can perform an action, returns error message if not.
 */
export function checkFeatureAccess(
  userTier: SubscriptionTier,
  feature: FeatureName,
  currentUsage?: number
): { allowed: boolean; message?: string; requiredTier?: SubscriptionTier } {
  if (!hasFeature(userTier, feature)) {
    return {
      allowed: false,
      message: `${feature.replace(/_/g, " ")} requires ${tierRequired[feature]} plan`,
      requiredTier: tierRequired[feature],
    };
  }

  if (currentUsage !== undefined) {
    const remaining = getRemainingUsage(userTier, feature, currentUsage);
    if (remaining <= 0) {
      return {
        allowed: false,
        message: `You've reached the limit for ${feature.replace(/_/g, " ")}. Upgrade for more.`,
        requiredTier: tierRequired[feature],
      };
    }
  }

  return { allowed: true };
}

/**
 * Get tier display info.
 */
export function getTierInfo(tier: SubscriptionTier) {
  const info = {
    FREE: { label: "Free", color: "text-muted", bgColor: "bg-white/[0.05]" },
    PRO: { label: "Pro", color: "text-cyan", bgColor: "bg-cyan/10" },
    ELITE: { label: "Elite", color: "text-purple", bgColor: "bg-purple/10" },
    ENTERPRISE: { label: "Enterprise", color: "text-amber", bgColor: "bg-amber/10" },
  };
  return info[tier];
}
