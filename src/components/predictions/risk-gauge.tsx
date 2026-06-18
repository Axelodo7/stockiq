"use client";

import type { RiskAnalysis } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield } from "lucide-react";

interface RiskGaugeProps {
  risk: RiskAnalysis;
}

export function RiskGauge({ risk }: RiskGaugeProps) {
  const bullishPercent = Math.round(risk.bullishProbability * 100);
  const bearishPercent = Math.round(risk.bearishProbability * 100);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Shield className="h-5 w-5 text-accent" />
          Risk Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-positive">Bullish</span>
            <span className="text-negative">Bearish</span>
          </div>
          <div className="mt-1.5 h-3 overflow-hidden rounded-full bg-panel-elevated">
            <div className="flex h-full">
              <div
                className="bg-positive transition-all duration-500"
                style={{ width: `${bullishPercent}%` }}
              />
              <div
                className="bg-negative transition-all duration-500"
                style={{ width: `${bearishPercent}%` }}
              />
            </div>
          </div>
          <div className="mt-1.5 flex items-center justify-between text-xs text-muted">
            <span>{bullishPercent}%</span>
            <span>{bearishPercent}%</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-border p-3">
            <p className="text-[10px] font-medium uppercase text-muted">Volatility Forecast</p>
            <p className="mt-1 font-mono text-sm font-semibold">
              {(risk.volatilityForecast * 100).toFixed(2)}%
            </p>
          </div>
          <div className="rounded-lg border border-border p-3">
            <p className="text-[10px] font-medium uppercase text-muted">Risk Rating</p>
            <p
              className={`mt-1 text-sm font-bold ${
                risk.riskRating === "LOW"
                  ? "text-positive"
                  : risk.riskRating === "MEDIUM"
                    ? "text-accent"
                    : risk.riskRating === "HIGH"
                      ? "text-warning"
                      : "text-negative"
              }`}
            >
              {risk.riskRating}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
