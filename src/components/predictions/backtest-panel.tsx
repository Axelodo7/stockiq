"use client";

import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, BarChart3 } from "lucide-react";
import type { BacktestResult } from "@/types";

interface BacktestPanelProps {
  result: BacktestResult | null;
  isLoading: boolean;
  ticker?: string;
  onRunBacktest: (modelType: string) => void;
}

export function BacktestPanel({ result, isLoading, onRunBacktest }: BacktestPanelProps) {
  const [selectedModel, setSelectedModel] = useState("ENSEMBLE");

  const modelOptions = ["XGBOOST", "RANDOM_FOREST", "LSTM", "TRANSFORMER", "ENSEMBLE"];

  return (
    <div className="space-y-4">
      {/* Model selector + run button */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex flex-wrap gap-2">
              {modelOptions.map((m) => (
                <button
                  key={m}
                  onClick={() => setSelectedModel(m)}
                  className={`rounded-lg px-3 py-1.5 font-mono text-[10px] font-bold transition-colors ${
                    selectedModel === m
                      ? "bg-accent text-accent-foreground"
                      : "bg-panel-elevated text-muted hover:bg-panel-elevated/80"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
            <button
              onClick={() => onRunBacktest(selectedModel)}
              disabled={isLoading}
              className="flex items-center gap-2 rounded-lg bg-accent px-4 py-1.5 text-xs font-semibold text-accent-foreground transition-colors hover:bg-accent/90 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Activity className="h-3 w-3 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <BarChart3 className="h-3 w-3" />
                  Run Backtest
                </>
              )}
            </button>
          </div>
        </CardContent>
      </Card>

      {result && (
        <>
          {/* Metrics grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MetricCard
              label="Total Return"
              value={`${result.total_return > 0 ? "+" : ""}${result.total_return.toFixed(2)}%`}
              positive={result.total_return > 0}
            />
            <MetricCard
              label="Sharpe Ratio"
              value={result.sharpe_ratio?.toFixed(2) ?? "N/A"}
              positive={result.sharpe_ratio !== null && result.sharpe_ratio > 1}
            />
            <MetricCard
              label="Max Drawdown"
              value={`-${result.max_drawdown.toFixed(2)}%`}
              positive={false}
            />
            <MetricCard
              label="Win Rate"
              value={`${result.win_rate.toFixed(1)}%`}
              positive={result.win_rate > 50}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <MetricCard
              label="Total Trades"
              value={result.total_trades.toString()}
              neutral
            />
            <MetricCard
              label="Profit Factor"
              value={result.profit_factor?.toFixed(2) ?? "N/A"}
              positive={result.profit_factor !== null && result.profit_factor > 1}
            />
            <MetricCard
              label="Final Capital"
              value={`$${result.final_capital.toLocaleString()}`}
              positive={result.final_capital > result.initial_capital}
            />
          </div>

          {/* Equity curve */}
          {result.equity_curve.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Equity Curve</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={result.equity_curve.filter(
                        (_, i) => i % Math.max(1, Math.floor(result.equity_curve.length / 200)) === 0
                      )}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 10, fill: "hsl(var(--muted))" }}
                        tickFormatter={(v) => {
                          const d = new Date(v);
                          return `${d.getMonth() + 1}/${d.getDate()}`;
                        }}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: "hsl(var(--muted))" }}
                        tickFormatter={(v) => `$${(v / 1000).toFixed(1)}k`}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "hsl(var(--panel))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                          fontSize: "11px",
                        }}
                        formatter={(value) => [`$${Number(value).toLocaleString()}`, "Equity"]}
                      />
                      <Line
                        type="monotone"
                        dataKey="equity"
                        stroke="#00d4ff"
                        strokeWidth={1.5}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Trades table */}
          {result.trades.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">
                  Trades ({result.trades.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-80 overflow-y-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="px-2 py-1.5 text-left text-[10px] font-medium uppercase text-muted">
                          Entry
                        </th>
                        <th className="px-2 py-1.5 text-left text-[10px] font-medium uppercase text-muted">
                          Exit
                        </th>
                        <th className="px-2 py-1.5 text-right text-[10px] font-medium uppercase text-muted">
                          Entry $
                        </th>
                        <th className="px-2 py-1.5 text-right text-[10px] font-medium uppercase text-muted">
                          Exit $
                        </th>
                        <th className="px-2 py-1.5 text-right text-[10px] font-medium uppercase text-muted">
                          P&L
                        </th>
                        <th className="px-2 py-1.5 text-left text-[10px] font-medium uppercase text-muted">
                          Reason
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.trades.map((trade, i) => (
                        <tr
                          key={i}
                          className="border-b border-border/30 last:border-0"
                        >
                          <td className="px-2 py-1.5 text-[10px] text-muted">
                            {trade.entry_date}
                          </td>
                          <td className="px-2 py-1.5 text-[10px] text-muted">
                            {trade.exit_date}
                          </td>
                          <td className="px-2 py-1.5 text-right font-mono text-[10px]">
                            ${trade.entry_price.toFixed(2)}
                          </td>
                          <td className="px-2 py-1.5 text-right font-mono text-[10px]">
                            ${trade.exit_price.toFixed(2)}
                          </td>
                          <td
                            className={`px-2 py-1.5 text-right font-mono text-[10px] font-bold ${
                              trade.pnl > 0 ? "text-positive" : "text-negative"
                            }`}
                          >
                            {trade.pnl > 0 ? "+" : ""}${trade.pnl.toFixed(2)} (
                            {trade.pnl_pct > 0 ? "+" : ""}
                            {trade.pnl_pct.toFixed(1)}%)
                          </td>
                          <td className="px-2 py-1.5">
                            <Badge
                              variant={
                                trade.reason === "take_profit"
                                  ? "default"
                                  : trade.reason === "stop_loss"
                                  ? "destructive"
                                  : "secondary"
                              }
                              className="text-[9px]"
                            >
                              {trade.reason.replace("_", " ")}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

function MetricCard({
  label,
  value,
  positive,
  neutral,
}: {
  label: string;
  value: string;
  positive?: boolean;
  neutral?: boolean;
}) {
  return (
    <Card className="p-3">
      <p className="text-[10px] uppercase text-muted">{label}</p>
      <p
        className={`mt-1 font-mono text-lg font-bold ${
          neutral
            ? "text-foreground"
            : positive
            ? "text-positive"
            : "text-negative"
        }`}
      >
        {value}
      </p>
    </Card>
  );
}
