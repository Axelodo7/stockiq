"use client";

import { useState } from "react";
import { UserButton } from "@clerk/nextjs";
import { Search, Command, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";
import { CommandPalette } from "./command-palette";
import { NotificationBell } from "@/components/notifications/notification-bell";

export function TopBar() {
  const { sidebarOpen, toggleSidebar } = useAppStore();
  const [cmdOpen, setCmdOpen] = useState(false);

  return (
    <>
      <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen} />

      <header
        className={cn(
          "glass sticky top-0 z-30 flex h-16 items-center border-b border-white/[0.06] px-4 backdrop-blur-xl transition-all duration-300 sm:px-6",
          sidebarOpen ? "lg:ml-64" : "lg:ml-[72px]"
        )}
      >
        <div className="flex flex-1 items-center gap-3">
          {/* Mobile hamburger */}
          <button
            onClick={toggleSidebar}
            className="rounded-lg p-2 text-muted transition-colors hover:bg-white/[0.05] hover:text-foreground lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Search / Cmd+K trigger */}
          <button
            onClick={() => setCmdOpen(true)}
            className="flex max-w-md flex-1 items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-sm text-muted transition-all hover:border-white/10 hover:bg-white/[0.05] sm:px-4 sm:py-2.5"
          >
            <Search className="h-4 w-4 shrink-0" />
            <span className="flex-1 text-left text-xs sm:text-sm">Search stocks, pages...</span>
            <kbd className="hidden items-center gap-1 rounded-md border border-white/10 bg-white/[0.03] px-1.5 py-0.5 text-[10px] text-muted/60 sm:flex">
              <Command className="h-2.5 w-2.5" />K
            </kbd>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Notification bell */}
          <NotificationBell />

          {/* User */}
          <UserButton
            appearance={{
              elements: {
                avatarBox: "h-8 w-8",
              },
            }}
          />
        </div>
      </header>
    </>
  );
}
