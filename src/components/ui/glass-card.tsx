import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  gradient?: "brand" | "success" | "danger" | "amber" | null;
  padding?: "none" | "sm" | "md" | "lg";
  onClick?: () => void;
}

const paddingMap = {
  none: "",
  sm: "p-3",
  md: "p-4",
  lg: "p-6",
};

const gradientMap = {
  brand: "before:from-cyan/20 before:to-purple/20",
  success: "before:from-green/20 before:to-cyan/20",
  danger: "before:from-red/20 before:to-amber/20",
  amber: "before:from-amber/20 before:to-red/20",
};

export function GlassCard({
  children,
  className,
  hover = false,
  gradient = null,
  padding = "md",
  onClick,
}: GlassCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "glass relative overflow-hidden",
        paddingMap[padding],
        hover && "cursor-pointer transition-all duration-200 hover:border-white/10 hover:bg-white/[0.03]",
        gradient && "gradient-border",
        onClick && "cursor-pointer",
        className
      )}
    >
      {gradient && (
        <div
          className={cn(
            "pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300",
            "bg-gradient-to-br",
            gradientMap[gradient],
            "group-hover:opacity-100"
          )}
        />
      )}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
