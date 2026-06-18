"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

interface AnimatedNumberProps {
  value: number
  duration?: number
  prefix?: string
  suffix?: string
  decimals?: number
  className?: string
}

export function AnimatedNumber({
  value,
  duration = 600,
  prefix = "",
  suffix = "",
  decimals = 2,
  className,
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(value)
  const prevValue = useRef(value)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    const from = prevValue.current
    const to = value
    prevValue.current = value

    if (from === to) return

    const start = performance.now()

    function tick(now: number) {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = from + (to - from) * eased

      setDisplayValue(current)

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick)
      }
    }

    rafRef.current = requestAnimationFrame(tick)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [value, duration])

  const formatted = displayValue.toFixed(decimals)
  const [intPart, decPart] = formatted.split(".")

  return (
    <span className={cn("font-mono tabular-nums", className)}>
      {prefix}
      {intPart}
      {decPart !== undefined && <span className="text-muted">.{decPart}</span>}
      {suffix}
    </span>
  )
}
