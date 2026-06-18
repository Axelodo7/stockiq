"use client"

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts"

interface BarChartComponentProps {
  data: Record<string, unknown>[]
  barKey: string
  xKey: string
  height?: number
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; fill: string }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-panel-elevated px-3 py-2 shadow-xl">
      <p className="mb-1 text-xs font-medium text-muted">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2 text-sm">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: entry.fill }}
          />
          <span className="text-muted">{entry.name}:</span>
          <span className="font-mono font-medium text-foreground">
            {entry.value?.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  )
}

export function StockBarChart({
  data,
  barKey,
  xKey,
  height = 300,
}: BarChartComponentProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
        <XAxis
          dataKey={xKey}
          tick={{ fontSize: 11, fill: "var(--muted)" }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "var(--muted)" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: number) => v.toLocaleString()}
          width={60}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "color-mix(in srgb, var(--accent) 5%, transparent)" }} />
        <Bar
          dataKey={barKey}
          radius={[4, 4, 0, 0]}
          fill="var(--accent)"
        />
      </BarChart>
    </ResponsiveContainer>
  )
}
