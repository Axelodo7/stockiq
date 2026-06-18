import { TrendingUp, TrendingDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface MetricCardProps {
  label: string
  value: string | number
  change?: number
  className?: string
}

export function MetricCard({ label, value, change, className }: MetricCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-panel p-4 glass",
        className
      )}
    >
      <p className="text-xs font-medium uppercase tracking-wider text-muted">
        {label}
      </p>
      <p className="mt-2 font-mono text-2xl font-bold text-foreground">{value}</p>
      {change !== undefined && (
        <div className="mt-1.5 flex items-center gap-1">
          {change >= 0 ? (
            <TrendingUp className="h-3.5 w-3.5 text-positive" />
          ) : (
            <TrendingDown className="h-3.5 w-3.5 text-negative" />
          )}
          <span
            className={cn(
              "text-xs font-medium",
              change >= 0 ? "text-positive" : "text-negative"
            )}
          >
            {change >= 0 ? "+" : ""}
            {change.toFixed(2)}%
          </span>
        </div>
      )}
    </div>
  )
}
