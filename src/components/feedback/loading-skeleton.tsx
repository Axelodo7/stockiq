import { cn } from "@/lib/utils"

interface LoadingSkeletonProps {
  className?: string
}

export function LoadingSkeleton({ className }: LoadingSkeletonProps) {
  return (
    <div className={cn("animate-shimmer space-y-6 p-6", className)}>
      <div className="h-8 w-48 rounded-lg bg-panel-elevated" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-xl bg-panel-elevated" />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="col-span-2 h-80 rounded-xl bg-panel-elevated" />
        <div className="h-80 rounded-xl bg-panel-elevated" />
      </div>

      <div className="h-64 rounded-xl bg-panel-elevated" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-40 rounded-xl bg-panel-elevated" />
        ))}
      </div>
    </div>
  )
}
