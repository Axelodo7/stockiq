"use client";

import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import { TrendingUp } from "lucide-react";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="mb-8 flex items-center gap-2">
        <TrendingUp className="h-8 w-8 text-accent" />
        <span className="font-display text-2xl font-bold text-foreground">
          StockIQ
        </span>
      </div>
      <SignIn />
      <p className="mt-6 text-sm text-muted">
        Don&apos;t have an account?{" "}
        <Link href="/sign-up" className="text-accent hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
