import { cn } from "@/lib/utils";

interface GradientButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "brand" | "success" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

const variantStyles = {
  brand: "bg-gradient-to-r from-cyan to-purple text-foreground hover:shadow-[0_0_20px_-5px_rgba(0,212,255,0.4)]",
  success: "bg-gradient-to-r from-green to-cyan text-foreground hover:shadow-[0_0_20px_-5px_rgba(0,230,118,0.4)]",
  danger: "bg-gradient-to-r from-red to-amber text-foreground hover:shadow-[0_0_20px_-5px_rgba(255,23,68,0.4)]",
  ghost: "bg-transparent border border-border text-muted hover:bg-panel-elevated hover:text-foreground",
};

const sizeStyles = {
  sm: "h-8 px-3 text-xs rounded-lg",
  md: "h-10 px-5 text-sm rounded-xl",
  lg: "h-12 px-8 text-base rounded-xl",
};

export function GradientButton({
  variant = "brand",
  size = "md",
  className,
  children,
  ...props
}: GradientButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200",
        "active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
