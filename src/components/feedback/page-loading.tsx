import { cn } from "@/lib/utils";

interface PageLoadingProps {
  variant?: "dashboard" | "stock" | "page" | "list";
}

export default function PageLoading({ variant = "page" }: PageLoadingProps) {
  return (
    <div className="space-y-6 p-4 sm:p-6">
      {variant === "dashboard" && <DashboardSkeleton />}
      {variant === "stock" && <StockSkeleton />}
      {variant === "list" && <ListSkeleton />}
      {variant === "page" && <PageSkeleton />}
    </div>
  );
}

function SkeletonBox({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-panel-elevated", className)} />;
}

function DashboardSkeleton() {
  return (
    <>
      <div className="space-y-2">
        <SkeletonBox className="h-7 w-32" />
        <SkeletonBox className="h-4 w-64" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonBox key={i} className="h-20" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <SkeletonBox className="h-80 lg:col-span-2" />
        <SkeletonBox className="h-80" />
      </div>
    </>
  );
}

function StockSkeleton() {
  return (
    <>
      <div className="flex items-center gap-4">
        <SkeletonBox className="h-10 w-10" />
        <div className="space-y-2 flex-1">
          <SkeletonBox className="h-7 w-32" />
          <SkeletonBox className="h-4 w-48" />
        </div>
        <SkeletonBox className="h-10 w-40" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonBox key={i} className="h-20" />
        ))}
      </div>
      <SkeletonBox className="h-12 w-full" />
      <SkeletonBox className="h-96 w-full" />
    </>
  );
}

function ListSkeleton() {
  return (
    <>
      <SkeletonBox className="h-7 w-48" />
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonBox key={i} className="h-16" />
        ))}
      </div>
    </>
  );
}

function PageSkeleton() {
  return (
    <>
      <SkeletonBox className="h-8 w-48" />
      <SkeletonBox className="h-64 w-full" />
    </>
  );
}
