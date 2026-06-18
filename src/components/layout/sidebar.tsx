"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth, useUser } from "@clerk/nextjs";
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

const ADMIN_EMAILS = ["ayyan.zeeshan@gmail.com"];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar } = useAppStore();
  const { user } = useUser();
  const email = user?.emailAddresses?.[0]?.emailAddress?.toLowerCase() || "";
  const isAdmin = ADMIN_EMAILS.includes(email);
  const tierLabel = isAdmin ? "Enterprise Plan" : "Free Plan";
  const watchlistLimit = isAdmin ? "Unlimited" : "3/3";

  return (
    <aside
      className={cn(
        "glass-strong fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-white/[0.06] transition-all duration-300",
        sidebarOpen ? "w-64" : "w-[72px]"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-4">
        {sidebarOpen ? (
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan to-purple">
              <TrendingUp className="h-4 w-4 text-foreground" />
            </div>
            <span className="font-display text-lg font-bold gradient-text">StockIQ</span>
          </Link>
        ) : (
          <Link
            href="/dashboard"
            className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan to-purple"
          >
            <TrendingUp className="h-4 w-4 text-foreground" />
          </Link>
        )}
        <button
          onClick={toggleSidebar}
          className="hidden rounded-lg p-1.5 text-muted transition-colors hover:bg-white/[0.05] hover:text-foreground lg:flex"
        >
          <ChevronLeft
            className={cn("h-4 w-4 transition-transform", !sidebarOpen && "rotate-180")}
          />
        </button>
      </div>

      {/* Navigation */}
      <nav className="mt-2 flex-1 overflow-y-auto px-3">
        {navSections.map((section) => (
          <div key={section.label} className="mb-4">
            {sidebarOpen && (
              <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted/60">
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
                    className={cn(
                      "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
                      isActive
                        ? "bg-accent/10 text-accent glow-border"
                        : "text-muted hover:bg-white/[0.04] hover:text-foreground"
                    )}
                    title={!sidebarOpen ? item.label : undefined}
                  >
                    <item.icon
                      className={cn(
                        "h-4.5 w-4.5 shrink-0 transition-colors",
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
        <div className="border-t border-white/[0.06] p-3">
          <div className="flex items-center gap-3 rounded-lg px-3 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-cyan/20 to-purple/20 text-xs font-bold text-accent">
              A
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-xs font-medium">{tierLabel}</p>
              <p className="truncate text-[10px] text-muted">{watchlistLimit} watchlists</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
