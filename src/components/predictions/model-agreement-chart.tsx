"use client";

import type { FullPrediction } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface ModelAgreementChartProps {
  prediction: FullPrediction;
}

const MOCK_MODELS = [
  { name: "LSTM", weight: 0.25 },
  { name: "Transformer", weight: 0.25 },
  { name: "XGBoost", weight: 0.3 },
  { name: "Random Forest", weight: 0.2 },
];

export function ModelAgreementChart({ prediction }: ModelAgreementChartProps) {
  const mainWindow = prediction.windows.find((w) => w.days === 7) || prediction.windows[0];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <BarChart3 className="h-5 w-5 text-accent" />
          Model Agreement
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted">Ensemble Prediction</span>
          <span className="font-mono text-sm font-bold">
            {formatCurrency(mainWindow.price)}
          </span>
        </div>

        <div className="h-px bg-border" />

        {MOCK_MODELS.map((model) => {
          const variance = (Math.random() - 0.5) * mainWindow.price * 0.04;
          const modelPrice = mainWindow.price + variance;
          const diff = ((modelPrice - prediction.currentPrice) / prediction.currentPrice) * 100;
          const isPositive = diff >= 0;

          return (
            <div key={model.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted">{model.name}</span>
                <span className="text-[10px] text-muted/50">
                  ({Math.round(model.weight * 100)}%)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-medium">
                  {formatCurrency(modelPrice)}
                </span>
                <span
                  className={`text-[10px] font-medium ${
                    isPositive ? "text-positive" : "text-negative"
                  }`}
                >
                  {isPositive ? "+" : ""}
                  {diff.toFixed(1)}%
                </span>
              </div>
            </div>
          );
        })}

        <div className="mt-2 rounded-lg bg-panel-elevated p-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted">Model Agreement</span>
            <span className="font-mono font-semibold text-accent">
              {Math.round(prediction.modelAgreement * 100)}%
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
