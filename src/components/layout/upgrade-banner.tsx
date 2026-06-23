"use client";

import { X, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SubscriptionTier } from "@/lib/feature-gating";
import { getTierInfo } from "@/lib/feature-gating";

interface UpgradeBannerProps {
  message: string;
  requiredTier: SubscriptionTier;
  onDismiss?: () => void;
  onUpgrade?: () => void;
  className?: string;
}

export function UpgradeBanner({
  message,
  requiredTier,
  onDismiss,
  onUpgrade,
  className,
}: UpgradeBannerProps) {
  const tierInfo = getTierInfo(requiredTier);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-border bg-panel p-4",
        className
      )}
    >
      {/* Accent line */}
      <div className="absolute left-0 top-0 h-full w-1 bg-accent" />

      <div className="flex items-start gap-3 pl-2">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className={cn("text-sm font-semibold", tierInfo.color)}>
              {tierInfo.label}
            </span>
            <span className="text-xs text-muted">Plan Required</span>
          </div>
          <p className="mt-1 text-sm text-muted">{message}</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onUpgrade}
            className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-accent-fg transition-colors hover:bg-accent/90"
          >
            Upgrade
            <ArrowRight className="h-3 w-3" />
          </button>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="rounded-lg p-1.5 text-muted transition-colors hover:bg-panel-elevated hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
