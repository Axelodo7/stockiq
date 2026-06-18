"use client";

import { useEffect } from "react";
import DashboardShell from "./dashboard-shell";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    fetch("/api/user/promote", { method: "POST" }).catch(() => {});
  }, []);

  return <DashboardShell>{children}</DashboardShell>;
}
