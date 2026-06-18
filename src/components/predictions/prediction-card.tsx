"use client";

import type { PredictionWindow } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, TrendingUp, TrendingDown } from "lucide-react";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { ConfidenceBadge } from "./confidence-badge";

interface PredictionCardProps {
  windows: PredictionWindow[];
}

export function PredictionCard({ windows }: PredictionCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Brain className="h-5 w-5 text-accent" />
          AI Price Forecasts
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {windows.map((w) => {
            const isPositive = w.changePercent >= 0;
            return (
              <div
                key={w.label}
                className="rounded-lg border border-border p-3 transition-colors hover:border-accent/30"
              >
                <p className="text-[10px] font-medium uppercase text-muted">{w.label}</p>
                <p className="mt-1.5 font-mono text-lg font-bold">{formatCurrency(w.price)}</p>
                <div className="mt-1 flex items-center gap-1">
                  {isPositive ? (
                    <TrendingUp className="h-3 w-3 text-positive" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-negative" />
                  )}
                  <span
                    className={`text-xs font-medium ${
                      isPositive ? "text-positive" : "text-negative"
                    }`}
                  >
                    {formatPercent(w.changePercent)}
                  </span>
                </div>
                <div className="mt-2">
                  <ConfidenceBadge confidence={w.confidence} />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
