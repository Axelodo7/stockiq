import { cn } from "@/lib/utils";

interface GradientButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "brand" | "success" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

const variantStyles = {
  brand: "bg-accent text-accent-fg hover:bg-accent/90",
  success: "bg-positive text-white hover:bg-positive/90",
  danger: "bg-negative text-white hover:bg-negative/90",
  ghost: "bg-transparent border border-border text-muted hover:bg-panel-elevated hover:text-foreground",
};

const sizeStyles = {
  sm: "h-8 px-3 text-xs rounded-lg",
  md: "h-10 px-5 text-sm rounded-lg",
  lg: "h-12 px-8 text-base rounded-lg",
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
        "inline-flex items-center justify-center gap-2 font-semibold transition-colors duration-150",
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
