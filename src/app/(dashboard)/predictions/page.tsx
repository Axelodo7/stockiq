"use client";

import { useState } from "react";
import Link from "next/link";
import { Brain, Search, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DisclaimerBanner } from "@/components/predictions/disclaimer-banner";

const POPULAR_TICKERS = ["AAPL", "GOOGL", "MSFT", "AMZN", "TSLA", "NVDA", "META", "JPM", "V", "JNJ"];

export default function PredictionsPage() {
  const [searchTicker, setSearchTicker] = useState("");

  const handleSearch = () => {
    if (searchTicker.trim()) {
      window.location.href = `/stock/${searchTicker.toUpperCase()}`;
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">
          AI Predictions
        </h1>
        <p className="mt-1 text-sm text-muted">
          Machine learning-powered stock price forecasts and risk analysis.
        </p>
      </div>

      <DisclaimerBanner />

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                type="text"
                placeholder="Enter ticker symbol (e.g., AAPL)"
                value={searchTicker}
                onChange={(e) => setSearchTicker(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="w-full rounded-lg border border-border bg-panel py-2.5 pl-10 pr-4 text-sm font-mono placeholder:text-muted focus:border-accent focus:outline-none"
              />
            </div>
            <button
              onClick={handleSearch}
              className="rounded-lg bg-accent px-6 py-2.5 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent/90"
            >
              Predict
            </button>
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-4 font-display text-lg font-semibold">Quick Access</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {POPULAR_TICKERS.map((ticker) => (
            <Link key={ticker} href={`/stock/${ticker}`}>
              <Card className="transition-colors hover:border-accent/30 hover:bg-panel-elevated/50">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10">
                    <Brain className="h-4 w-4 text-accent" />
                  </div>
                  <span className="font-mono text-sm font-bold">{ticker}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-4 font-display text-lg font-semibold">Model Performance</h2>
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted">
                      Model
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted">
                      Accuracy
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted">
                      Win Rate
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted">
                      Sharpe
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: "XGBoost Gradient Booster", type: "XGBOOST", accuracy: 0.68, winRate: 0.62, sharpe: 1.45, status: "active" },
                    { name: "Random Forest Ensemble", type: "RANDOM_FOREST", accuracy: 0.65, winRate: 0.58, sharpe: 1.22, status: "active" },
                    { name: "LSTM Neural Network", type: "LSTM", accuracy: 0.63, winRate: 0.56, sharpe: 1.15, status: "active" },
                    { name: "Transformer Time-Series", type: "TRANSFORMER", accuracy: 0.61, winRate: 0.54, sharpe: 1.08, status: "active" },
                    { name: "Meta Ensemble", type: "ENSEMBLE", accuracy: 0.71, winRate: 0.65, sharpe: 1.58, status: "active" },
                  ].map((model) => (
                    <tr key={model.type} className="border-b border-border/50 last:border-0">
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium">{model.name}</span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary" className="font-mono text-[10px]">
                          {model.type}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 rounded-full bg-panel-elevated">
                            <div
                              className="h-1.5 rounded-full bg-accent"
                              style={{ width: `${model.accuracy * 100}%` }}
                            />
                          </div>
                          <span className="font-mono text-xs">{Math.round(model.accuracy * 100)}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs">{Math.round(model.winRate * 100)}%</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs">{model.sharpe.toFixed(2)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="default" className="text-[10px]">
                          {model.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-yellow-500/20 bg-yellow-500/5">
        <CardContent className="flex items-start gap-3 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-yellow-500" />
          <div>
            <p className="text-sm font-semibold text-yellow-500">Important Notice</p>
            <p className="mt-1 text-xs text-yellow-500/80">
              All predictions are generated by machine learning models and should be used for
              analytical purposes only. They do not constitute investment advice. Model performance
              metrics are based on historical data and may not reflect future performance.
              Always conduct your own research and consult with a qualified financial advisor
              before making investment decisions.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
