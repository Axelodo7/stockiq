"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/utils";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { sidebarOpen } = useAppStore();

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <TopBar />
      <main
        className={cn(
          "pt-16 transition-all duration-300",
          sidebarOpen ? "ml-64" : "ml-[72px]"
        )}
      >
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
