import Link from "next/link";
import { FileQuestion, ArrowLeft, Search } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientButton } from "@/components/ui/gradient-button";

export default function NotFound() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4 sm:p-6">
      <GlassCard className="w-full max-w-md">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-accent/10">
            <FileQuestion className="h-10 w-10 text-accent" />
          </div>
          <h1 className="mb-2 font-display text-3xl font-bold tracking-tight">404</h1>
          <h2 className="mb-2 font-display text-lg font-semibold">Page not found</h2>
          <p className="mb-6 max-w-sm text-sm text-muted">
            The page you&apos;re looking for doesn&apos;t exist or has been moved. Let&apos;s get you back on track.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link href="/dashboard">
              <GradientButton variant="brand" size="md">
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </GradientButton>
            </Link>
            <Link href="/market">
              <GradientButton variant="ghost" size="md">
                <Search className="h-4 w-4" />
                Browse Markets
              </GradientButton>
            </Link>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
