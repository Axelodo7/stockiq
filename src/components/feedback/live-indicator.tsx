"use client";

import { Radio, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LiveIndicatorProps {
  connected: boolean;
  lastUpdate?: Date | null;
  className?: string;
  showLabel?: boolean;
}

export function LiveIndicator({ connected, lastUpdate, className, showLabel = true }: LiveIndicatorProps) {
  return (
    <div className={cn("inline-flex items-center gap-1.5", className)}>
      {connected ? (
        <>
          <span className="relative flex h-2 w-2">
            <span className="absolute inset-0 animate-ping rounded-full bg-emerald-500 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          {showLabel && (
            <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
              <Radio className="h-2.5 w-2.5" />
              Live
            </span>
          )}
        </>
      ) : (
        <>
          <Loader2 className="h-2.5 w-2.5 animate-spin text-muted" />
          {showLabel && (
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
              Connecting
            </span>
          )}
        </>
      )}
    </div>
  );
}
