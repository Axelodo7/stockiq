"use client";

import { useState, useEffect } from "react";
import { Bell, Check, Trash2 } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { GlowBadge } from "@/components/ui/glow-badge";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  type: "alert" | "prediction" | "portfolio" | "system" | "earnings";
  title: string;
  message: string;
  ticker?: string;
  read: boolean;
  createdAt: string;
}

const typeColors: Record<string, string> = {
  alert: "text-amber",
  prediction: "text-cyan",
  portfolio: "text-purple",
  system: "text-muted",
  earnings: "text-green",
};

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications");
      const json = await res.json();
      if (json.success) {
        setNotifications(json.data);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, read: true }),
    });
  };

  const markAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    for (const n of notifications.filter((n) => !n.read)) {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: n.id, read: true }),
      });
    }
  };

  const dismiss = async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    await fetch(`/api/notifications?id=${id}`, { method: "DELETE" });
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative rounded-lg p-2 text-muted transition-colors hover:bg-white/[0.05] hover:text-foreground"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[9px] font-bold text-black">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-2 w-80">
            <GlassCard padding="none" className="max-h-[400px] overflow-hidden">
              <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-accent" />
                  <h3 className="font-display text-sm font-semibold">Notifications</h3>
                  {unreadCount > 0 && (
                    <GlowBadge variant="info">{unreadCount} new</GlowBadge>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-[10px] text-muted hover:text-foreground"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="divide-y divide-white/[0.04] overflow-y-auto max-h-[320px]">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-xs text-muted">
                    No notifications
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={cn(
                        "flex items-start gap-3 px-4 py-3 transition-colors hover:bg-white/[0.02]",
                        !n.read && "bg-accent/5"
                      )}
                    >
                      <div className={cn("mt-0.5", typeColors[n.type])}>
                        <Bell className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-medium truncate">{n.title}</p>
                          {!n.read && <div className="h-1.5 w-1.5 rounded-full bg-accent shrink-0" />}
                        </div>
                        <p className="text-[10px] text-muted truncate">{n.message}</p>
                        <p className="mt-0.5 text-[9px] text-muted">{timeAgo(n.createdAt)}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {!n.read && (
                          <button
                            onClick={() => markRead(n.id)}
                            className="rounded p-1 text-muted hover:bg-white/[0.05] hover:text-foreground"
                          >
                            <Check className="h-3 w-3" />
                          </button>
                        )}
                        <button
                          onClick={() => dismiss(n.id)}
                          className="rounded p-1 text-muted hover:bg-white/[0.05] hover:text-negative"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </GlassCard>
          </div>
        </>
      )}
    </div>
  );
}
