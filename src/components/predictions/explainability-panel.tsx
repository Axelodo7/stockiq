"use client";

import type { Explainability } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb, TrendingUp, TrendingDown } from "lucide-react";

interface ExplainabilityPanelProps {
  explainability: Explainability;
}

export function ExplainabilityPanel({ explainability }: ExplainabilityPanelProps) {
  const hasFeatureImportances =
    explainability.featureImportances &&
    Object.keys(explainability.featureImportances).length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Lightbulb className="h-5 w-5 text-accent" />
          Why This Prediction?
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm leading-relaxed text-muted">{explainability.summary}</p>

        <div className="h-px bg-border" />

        <div>
          <p className="mb-2 text-xs font-medium uppercase text-muted">
            Top Contributing Factors
          </p>
          <div className="space-y-2">
            {explainability.topFactors.map((factor) => {
              const percent = Math.round(factor.contribution * 100);
              const label = factor.label || factor.indicator;
              return (
                <div key={factor.indicator} className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    {factor.direction === "bullish" ? (
                      <TrendingUp className="h-3 w-3 text-positive" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-negative" />
                    )}
                    <span className="w-36 text-xs text-muted">{label}</span>
                  </div>
                  <div className="h-1.5 flex-1 rounded-full bg-panel-elevated">
                    <div
                      className={`h-1.5 rounded-full ${
                        factor.direction === "bullish" ? "bg-positive" : "bg-negative"
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-[10px] font-medium text-muted">
                    {percent}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {hasFeatureImportances && (
          <>
            <div className="h-px bg-border" />
            <div>
              <p className="mb-2 text-xs font-medium uppercase text-muted">
                Feature Importance (Permutation-Based)
              </p>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(explainability.featureImportances!)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 10)
                  .map(([name, importance]) => (
                    <div key={name} className="flex items-center justify-between">
                      <span className="text-[10px] text-muted truncate max-w-[120px]">
                        {name}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="h-1 w-12 rounded-full bg-panel-elevated">
                          <div
                            className="h-1 rounded-full bg-accent"
                            style={{ width: `${Math.round(importance * 100)}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-mono text-muted">
                          {Math.round(importance * 100)}%
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
