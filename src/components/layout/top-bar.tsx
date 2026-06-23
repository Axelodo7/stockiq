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
          "sticky top-0 z-30 flex h-16 items-center border-b border-border bg-background/95 backdrop-blur-sm px-4 transition-all duration-200 sm:px-6",
          sidebarOpen ? "lg:ml-64" : "lg:ml-[72px]"
        )}
      >
        <div className="flex flex-1 items-center gap-3">
          {/* Mobile hamburger */}
          <button
            onClick={toggleSidebar}
            className="rounded-lg p-2 text-muted transition-colors hover:bg-panel-elevated hover:text-foreground lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Search / Cmd+K trigger */}
          <button
            onClick={() => setCmdOpen(true)}
            className="flex max-w-md flex-1 items-center gap-3 rounded-lg border border-border bg-panel px-3 py-2 text-sm text-muted transition-colors hover:border-accent/30 hover:text-foreground sm:px-4 sm:py-2.5"
          >
            <Search className="h-4 w-4 shrink-0" />
            <span className="flex-1 text-left text-xs sm:text-sm">Search stocks, pages...</span>
            <kbd className="hidden items-center gap-1 rounded border border-border bg-panel-elevated px-1.5 py-0.5 text-xs text-muted sm:flex">
              <Command className="h-2.5 w-2.5" />K
            </kbd>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <NotificationBell />
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
