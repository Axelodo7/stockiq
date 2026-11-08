"use client";

import Link from "next/link";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";

export default function StockError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="space-y-6">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      <GlassCard>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <AlertTriangle className="mb-4 h-12 w-12 text-amber-400" />
          <h2 className="font-display text-xl font-bold mb-2">Unable to Load Stock Data</h2>
          <p className="text-sm text-muted mb-1 max-w-md">
            We couldn&apos;t fetch the latest data for this stock. This might be a temporary issue.
          </p>
          {error.digest && (
            <p className="text-xs text-muted mb-4 font-mono">Error ID: {error.digest}</p>
          )}
          <button
            onClick={reset}
            className="mt-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-fg hover:bg-accent/90 transition-colors"
          >
            Try Again
          </button>
        </div>
      </GlassCard>
    </div>
  );
}
