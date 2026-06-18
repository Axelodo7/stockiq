import { TrendingUp, TrendingDown } from "lucide-react"
import { cn, formatCurrency, formatChange, formatPercent } from "@/lib/utils"

interface PriceDisplayProps {
  price: number
  change: number
  changePercent: number
  className?: string
}

export function PriceDisplay({ price, change, changePercent, className }: PriceDisplayProps) {
  const isPositive = change >= 0

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <span className="font-mono text-3xl font-bold tracking-tight text-foreground">
        {formatCurrency(price)}
      </span>
      <div className="flex items-center gap-2">
        <div
          className={cn(
            "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-sm font-medium",
            isPositive ? "bg-positive/10 text-positive" : "bg-negative/10 text-negative"
          )}
        >
          {isPositive ? (
            <TrendingUp className="h-3.5 w-3.5" />
          ) : (
            <TrendingDown className="h-3.5 w-3.5" />
          )}
          {formatChange(change)}
        </div>
        <span
          className={cn(
            "text-sm font-medium",
            isPositive ? "text-positive" : "text-negative"
          )}
        >
          {formatPercent(changePercent)}
        </span>
      </div>
    </div>
  )
}
