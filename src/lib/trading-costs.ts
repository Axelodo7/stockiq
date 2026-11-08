/**
 * Trading cost model used by the backtester.
 *
 * Defaults mirror what a retail broker charges on a typical US equity order:
 *  - $0.005 per share commission (Schwab / IBKR entry tier)
 *  - 5 basis points of slippage per side (0.05%)
 */

/** Per-share commission in dollars. */
export const DEFAULT_COMMISSION = 0.005;

/** Slippage in basis points applied on both entry and exit. */
export const DEFAULT_SLIPPAGE_BPS = 5;

/** Convert basis points to a fractional price adjustment. */
export function bpsToFraction(bps: number): number {
  return bps / 10_000;
}
