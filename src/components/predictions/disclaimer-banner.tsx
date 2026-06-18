"use client";

import { Info } from "lucide-react";

export function DisclaimerBanner() {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-yellow-500/20 bg-yellow-500/5 px-4 py-3">
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-yellow-500" />
      <p className="text-xs text-yellow-500/80">
        <span className="font-semibold">Disclaimer:</span> All predictions are estimates for analytical purposes only.
        This is not investment advice. Past performance does not guarantee future results.
        Always conduct your own research before making investment decisions.
      </p>
    </div>
  );
}
