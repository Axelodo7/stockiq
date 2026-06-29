import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
  onClick?: () => void;
}

const paddingMap = {
  none: "",
  sm: "p-3",
  md: "p-4",
  lg: "p-6",
};

export function GlassCard({
  children,
  className,
  hover = false,
  padding = "md",
  onClick,
}: GlassCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-xl border border-border bg-panel",
        paddingMap[padding],
        hover && "cursor-pointer transition-colors duration-150 hover:border-accent/30",
        onClick && "cursor-pointer",
        className
      )}
    >
      <div className="relative">{children}</div>
    </div>
  );
}
