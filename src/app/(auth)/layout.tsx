import { TrendingUp } from "lucide-react";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/4 h-[500px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/5 blur-[100px]" />
      </div>
      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Link href="/" className="flex items-center gap-2">
            <TrendingUp className="h-8 w-8 text-accent" />
            <span className="font-display text-2xl font-bold text-foreground">
              StockIQ
            </span>
          </Link>
        </div>
        {children}
      </div>
    </div>
  );
}
