"use client";

import Link from "next/link";
import { useState } from "react";
import { TrendingUp, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const navLinks = [
  { label: "Features", href: "/#features" },
  { label: "Pricing", href: "/pricing" },
  { label: "About", href: "/#about" },
];

const footerSections = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "/#features" },
      { label: "Pricing", href: "/pricing" },
      { label: "Dashboard", href: "/dashboard" },
      { label: "API", href: "#" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/#about" },
      { label: "Blog", href: "#" },
      { label: "Careers", href: "#" },
      { label: "Contact", href: "#" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "#" },
      { label: "Terms", href: "#" },
      { label: "Security", href: "#" },
    ],
  },
];

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="fixed inset-x-0 top-0 z-50 glass border-b border-border">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-accent" />
            <span className="font-display text-lg font-bold text-foreground">
              StockIQ
            </span>
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-sm text-muted transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Log in</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/register">Get Started</Link>
            </Button>
          </div>

          <button
            className="flex items-center justify-center text-muted md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </nav>

        {mobileOpen && (
          <div className="glass border-t border-border md:hidden">
            <div className="flex flex-col gap-1 px-4 py-4">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="rounded-md px-3 py-2 text-sm text-muted transition-colors hover:bg-panel-elevated hover:text-foreground"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <div className="my-2 border-t border-border" />
              <Button variant="ghost" size="sm" asChild className="justify-start">
                <Link href="/login" onClick={() => setMobileOpen(false)}>
                  Log in
                </Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/register" onClick={() => setMobileOpen(false)}>
                  Get Started
                </Link>
              </Button>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 pt-16">{children}</main>

      <footer className="border-t border-border bg-panel">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            <div>
              <Link href="/" className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-accent" />
                <span className="font-display text-base font-bold text-foreground">
                  StockIQ
                </span>
              </Link>
              <p className="mt-3 text-sm text-muted">
                AI-powered stock intelligence for modern investors.
              </p>
            </div>
            {footerSections.map((section) => (
              <div key={section.title}>
                <h3 className="text-sm font-semibold text-foreground">
                  {section.title}
                </h3>
                <ul className="mt-3 space-y-2">
                  {section.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-sm text-muted transition-colors hover:text-foreground"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-10 border-t border-border pt-6 text-center text-xs text-muted">
            &copy; {new Date().getFullYear()} StockIQ. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
