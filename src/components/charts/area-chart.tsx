"use client"

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts"

interface AreaConfig {
  key: string
  color?: string
}

interface AreaChartComponentProps {
  data: Record<string, unknown>[]
  areas: AreaConfig[]
  xKey: string
  height?: number
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-panel-elevated px-3 py-2 shadow-xl">
      <p className="mb-1 text-xs font-medium text-muted">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2 text-sm">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: entry.color }}
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

export function StockAreaChart({ data, areas, xKey, height = 300 }: AreaChartComponentProps) {
  const accentColor = "#00d4ff"

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
        <defs>
          {areas.map((area) => {
            const id = `gradient-${area.key}`
            const color = area.color ?? accentColor
            return (
              <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            )
          })}
        </defs>
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
        <Tooltip content={<CustomTooltip />} />
        {areas.map((area) => {
          const color = area.color ?? accentColor
          return (
            <Area
              key={area.key}
              type="monotone"
              dataKey={area.key}
              stroke={color}
              strokeWidth={2}
              fill={`url(#gradient-${area.key})`}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
          )
        })}
      </AreaChart>
    </ResponsiveContainer>
  )
}
