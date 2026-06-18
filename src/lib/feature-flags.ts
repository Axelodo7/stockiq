/** Feature flags for gradual rollout and rollback safety */

export const FEATURE_FLAGS = {
  /** New glassmorphism design system */
  NEW_DESIGN: true,

  /** TradingView Lightweight Charts for candlestick */
  CANDLESTICK_CHARTS: true,

  /** AI analysis reports (stock, market, trends, risk, earnings) */
  AI_ANALYSIS: true,

  /** Email + in-app notification system */
  NOTIFICATIONS: true,

  /** Command palette (Cmd+K) */
  COMMAND_PALETTE: true,

  /** Heatmaps and sector maps */
  HEATMAPS: true,

  /** Portfolio allocation charts */
  PORTFOLIO_CHARTS: true,
} as const;

export type FeatureFlag = keyof typeof FEATURE_FLAGS;

export function isFeatureEnabled(flag: FeatureFlag): boolean {
  return FEATURE_FLAGS[flag] === true;
}
