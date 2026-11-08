"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientButton } from "@/components/ui/gradient-button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to console for now; in production, ship to Sentry/etc
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <GlassCard className="w-full max-w-lg">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10">
            <AlertTriangle className="h-8 w-8 text-red-400" />
          </div>
          <h2 className="mb-2 font-display text-xl font-bold">Something went wrong</h2>
          <p className="mb-1 max-w-sm text-sm text-muted">
            We hit an unexpected error while loading this page. Our team has been notified.
          </p>
          {error.digest && (
            <p className="mb-6 font-mono text-[10px] text-muted/60">Error ID: {error.digest}</p>
          )}
          <div className="flex flex-col gap-2 sm:flex-row">
            <GradientButton variant="brand" size="md" onClick={reset}>
              <RefreshCw className="h-4 w-4" />
              Try Again
            </GradientButton>
            <Link href="/dashboard">
              <GradientButton variant="ghost" size="md">
                <Home className="h-4 w-4" />
                Dashboard
              </GradientButton>
            </Link>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
