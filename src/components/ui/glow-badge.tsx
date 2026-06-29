import { cn } from "@/lib/utils";

interface GlowBadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "danger" | "warning" | "info" | "purple";
  className?: string;
}

const variantStyles = {
  default: "bg-panel-elevated text-muted border-border",
  success: "bg-positive/10 text-positive border-positive/20",
  danger: "bg-negative/10 text-negative border-negative/20",
  warning: "bg-amber/10 text-amber border-amber/20",
  info: "bg-accent/10 text-accent border-accent/20",
  purple: "bg-purple/10 text-purple border-purple/20",
};

export function GlowBadge({
  children,
  variant = "default",
  className,
}: GlowBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
