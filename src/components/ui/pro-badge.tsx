import { cn } from "@/lib/utils";
import type { SubscriptionTier } from "@/lib/feature-gating";

interface ProBadgeProps {
  tier: SubscriptionTier;
  className?: string;
  size?: "sm" | "md";
}

const tierStyles: Record<SubscriptionTier, string> = {
  FREE: "bg-white/5 text-muted border-border",
  PRO: "bg-cyan/10 text-cyan border-cyan/20",
  ELITE: "bg-purple/10 text-purple border-purple/20",
  ENTERPRISE: "bg-amber/10 text-amber border-amber/20",
};

const tierLabels: Record<SubscriptionTier, string> = {
  FREE: "FREE",
  PRO: "PRO",
  ELITE: "ELITE",
  ENTERPRISE: "ENT",
};

export function ProBadge({ tier, className, size = "sm" }: ProBadgeProps) {
  if (tier === "FREE") return null;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-1.5 py-0.5 font-mono text-[8px] font-bold uppercase tracking-wider",
        tierStyles[tier],
        size === "md" && "px-2 py-0.5 text-[10px]",
        className
      )}
    >
      {tierLabels[tier]}
    </span>
  );
}

interface LockedFeatureProps {
  requiredTier: SubscriptionTier;
  children: React.ReactNode;
}

export function LockedFeature({ requiredTier, children }: LockedFeatureProps) {
  return (
    <div className="group relative">
      {children}
      <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-background/80 backdrop-blur-sm opacity-0 transition-opacity group-hover:opacity-100">
        <div className="text-center">
          <ProBadge tier={requiredTier} size="md" />
          <p className="mt-1 text-xs text-muted">Upgrade to {requiredTier} to unlock</p>
        </div>
      </div>
    </div>
  );
}
