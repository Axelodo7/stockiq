import { cn } from "@/lib/utils";

interface GlowBadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "danger" | "warning" | "info" | "purple";
  glow?: boolean;
  className?: string;
}

const variantStyles = {
  default: "bg-panel-elevated text-muted border-border",
  success: "bg-green/10 text-green border-green/20",
  danger: "bg-red/10 text-red border-red/20",
  warning: "bg-amber/10 text-amber border-amber/20",
  info: "bg-cyan/10 text-cyan border-cyan/20",
  purple: "bg-purple/10 text-purple border-purple/20",
};

const glowStyles = {
  default: "",
  success: "shadow-[0_0_12px_-3px_rgba(0,230,118,0.4)]",
  danger: "shadow-[0_0_12px_-3px_rgba(255,23,68,0.4)]",
  warning: "shadow-[0_0_12px_-3px_rgba(255,171,0,0.4)]",
  info: "shadow-[0_0_12px_-3px_rgba(0,212,255,0.4)]",
  purple: "shadow-[0_0_12px_-3px_rgba(179,136,255,0.4)]",
};

export function GlowBadge({
  children,
  variant = "default",
  glow = false,
  className,
}: GlowBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
        variantStyles[variant],
        glow && glowStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
