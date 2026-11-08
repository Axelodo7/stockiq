"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Search,
  Briefcase,
  Star,
  Bell,
  Settings,
  TrendingUp,
  ChevronLeft,
  Brain,
  Cpu,
  BarChart3,
  Shield,
  Calendar,
  X,
  Sparkles,
  ScanLine,
  Trophy,
} from "lucide-react";
import { useAppStore } from "@/store/app-store";

const navSections = [
  {
    label: "Overview",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/market", label: "Markets", icon: BarChart3 },
    ],
  },
  {
    label: "Analysis",
    items: [
      { href: "/ai-advisor", label: "AI Advisor", icon: Sparkles },
      { href: "/rankings", label: "Rankings", icon: Trophy },
      { href: "/chart-analyzer", label: "Chart Analyzer", icon: ScanLine },
      { href: "/stock/AAPL", label: "Stocks", icon: Search },
      { href: "/predictions", label: "Predictions", icon: Brain },
      { href: "/models", label: "Models", icon: Cpu },
      { href: "/earnings", label: "Earnings", icon: Calendar },
    ],
  },
  {
    label: "Portfolio",
    items: [
      { href: "/portfolio", label: "Portfolio", icon: Briefcase },
      { href: "/watchlist", label: "Watchlist", icon: Star },
      { href: "/risk", label: "Risk", icon: Shield },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/alerts", label: "Alerts", icon: Bell },
      { href: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

const ADMIN_EMAILS = ["ayyan.zeeshan@gmail.com", "arhraja0@gmail.com"];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar } = useAppStore();
  const { user } = useUser();
  const email = user?.emailAddresses?.[0]?.emailAddress?.toLowerCase() || "";
  const isAdmin = ADMIN_EMAILS.includes(email);
  const tierLabel = isAdmin ? "Enterprise Plan" : "Free Plan";
  const watchlistLimit = isAdmin ? "Unlimited" : "3/3";

  const navContent = (
    <>
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-border">
        {sidebarOpen ? (
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
              <TrendingUp className="h-4 w-4 text-accent-fg" />
            </div>
            <span className="font-display text-lg font-bold text-foreground">StockIQ</span>
          </Link>
        ) : (
          <Link
            href="/dashboard"
            className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-accent"
          >
            <TrendingUp className="h-4 w-4 text-accent-fg" />
          </Link>
        )}
        {/* Desktop collapse toggle */}
        <button
          onClick={toggleSidebar}
          className="hidden rounded-lg p-1.5 text-muted transition-colors hover:bg-panel-elevated hover:text-foreground lg:flex"
        >
          <ChevronLeft
            className={cn("h-4 w-4 transition-transform", !sidebarOpen && "rotate-180")}
          />
        </button>
        {/* Mobile close button */}
        <button
          onClick={toggleSidebar}
          className="rounded-lg p-1.5 text-muted transition-colors hover:bg-panel-elevated hover:text-foreground lg:hidden"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="mt-2 flex-1 overflow-y-auto px-3">
        {navSections.map((section) => (
          <div key={section.label} className="mb-4">
            {sidebarOpen && (
              <p className="mb-1.5 px-3 text-xs font-medium text-muted">
                {section.label}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => {
                      if (window.innerWidth < 1024 && sidebarOpen) {
                        toggleSidebar();
                      }
                    }}
                    className={cn(
                      "group flex min-h-[44px] items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150 lg:min-h-0 lg:py-2",
                      isActive
                        ? "bg-accent/10 text-accent"
                        : "text-muted hover:bg-panel-elevated hover:text-foreground"
                    )}
                    title={!sidebarOpen ? item.label : undefined}
                  >
                    <item.icon
                      className={cn(
                        "h-4 w-4 shrink-0 transition-colors",
                        isActive ? "text-accent" : "text-muted group-hover:text-foreground"
                      )}
                    />
                    {sidebarOpen && <span>{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User section at bottom */}
      {sidebarOpen && (
        <div className="border-t border-border p-3">
          <div className="flex items-center gap-3 rounded-lg px-3 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-panel-elevated text-xs font-bold text-accent">
              {user?.firstName?.[0] || user?.username?.[0] || "U"}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-xs font-medium text-foreground">{tierLabel}</p>
              <p className="truncate text-xs text-muted">{watchlistLimit} watchlists</p>
            </div>
          </div>
        </div>
      )}
    </>
  );

  return (
    <>
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Desktop sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 hidden h-screen flex-col border-r border-border bg-panel transition-all duration-200 lg:flex",
          sidebarOpen ? "w-64" : "w-[72px]"
        )}
      >
        {navContent}
      </aside>

      {/* Mobile sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-border bg-panel transition-transform duration-200 lg:hidden",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {navContent}
      </aside>
    </>
  );
}
