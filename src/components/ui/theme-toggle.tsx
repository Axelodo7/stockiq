"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";

type Theme = "light" | "dark" | "system";

const themes: { value: Theme; icon: typeof Sun; label: string }[] = [
  { value: "light", icon: Sun, label: "Light" },
  { value: "dark", icon: Moon, label: "Dark" },
  { value: "system", icon: Monitor, label: "System" },
];

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-theme-toggle]")) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  if (!mounted) {
    // Prevent hydration mismatch — render a placeholder with same dimensions
    return (
      <button
        className="rounded-lg p-2 text-muted hover:bg-panel-elevated hover:text-foreground"
        aria-label="Toggle theme"
        disabled
      >
        <Sun className="h-4 w-4" />
      </button>
    );
  }

  const current = (theme || "dark") as Theme;
  const currentIcon = themes.find((t) => t.value === current)?.icon || Sun;

  const Icon = currentIcon;
  const isDark = resolvedTheme === "dark";

  return (
    <div className="relative" data-theme-toggle>
      <button
        onClick={() => setOpen(!open)}
        className="rounded-lg p-2 text-muted transition-colors hover:bg-panel-elevated hover:text-foreground"
        aria-label="Toggle theme"
        title={`Theme: ${current}`}
      >
        <Icon className="h-4 w-4" />
      </button>

      {open && (
        <>
          {/* Backdrop for mobile */}
          <div
            className="fixed inset-0 z-40 lg:hidden"
            onClick={() => setOpen(false)}
          />
          <div
            className={cn(
              "absolute right-0 top-full z-50 mt-2 w-44 rounded-lg border border-border shadow-lg",
              "animate-fade-in-up",
              isDark ? "bg-panel" : "bg-white"
            )}
          >
            <div className="p-1">
              {themes.map(({ value, icon: IconComp, label }) => (
                <button
                  key={value}
                  onClick={() => {
                    setTheme(value);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                    current === value
                      ? "bg-accent/10 text-accent"
                      : "text-muted hover:bg-panel-elevated hover:text-foreground"
                  )}
                >
                  <IconComp className="h-3.5 w-3.5" />
                  <span>{label}</span>
                  {current === value && (
                    <span className="ml-auto text-xs">✓</span>
                  )}
                </button>
              ))}
            </div>
            <div className="border-t border-border px-3 py-2">
              <p className="text-[10px] text-muted">
                {current === "system"
                  ? "Matches your device"
                  : `Always ${current}`}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
