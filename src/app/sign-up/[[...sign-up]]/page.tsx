"use client";

import { SignUp } from "@clerk/nextjs";
import Link from "next/link";
import { TrendingUp } from "lucide-react";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="mb-8 flex items-center gap-2">
        <TrendingUp className="h-8 w-8 text-accent" />
        <span className="font-display text-2xl font-bold text-foreground">
          StockIQ
        </span>
      </div>
      <SignUp forceRedirectUrl="/dashboard" />
      <p className="mt-6 text-sm text-muted">
        Already have an account?{" "}
        <Link href="/sign-in" className="text-accent hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
