/** StockIQ Design System Tokens */

export const colors = {
  // Base backgrounds
  void: "#050810",
  primary: "#0a0e17",
  panel: "#0f1420",
  elevated: "#161c2e",
  hover: "#1c2440",

  // Glass
  glassBg: "rgba(15, 20, 32, 0.7)",
  glassBorder: "rgba(255, 255, 255, 0.06)",
  glassBlur: "16px",

  // Accent
  cyan: "#00d4ff",
  cyanMuted: "rgba(0, 212, 255, 0.15)",
  green: "#00e676",
  greenMuted: "rgba(0, 230, 118, 0.15)",
  red: "#ff1744",
  redMuted: "rgba(255, 23, 68, 0.15)",
  amber: "#ffab00",
  amberMuted: "rgba(255, 171, 0, 0.15)",
  purple: "#b388ff",
  purpleMuted: "rgba(179, 136, 255, 0.15)",

  // Text
  textPrimary: "#e8eaed",
  textSecondary: "#8b92a5",
  textMuted: "#4a5068",
} as const;

export const gradients = {
  brand: "linear-gradient(135deg, #00d4ff 0%, #b388ff 100%)",
  success: "linear-gradient(135deg, #00e676 0%, #00d4ff 100%)",
  danger: "linear-gradient(135deg, #ff1744 0%, #ff6d00 100%)",
  amber: "linear-gradient(135deg, #ffab00 0%, #ff6d00 100%)",
  mesh: `radial-gradient(at 20% 80%, rgba(0,212,255,0.08) 0%, transparent 50%),
         radial-gradient(at 80% 20%, rgba(179,136,255,0.06) 0%, transparent 50%)`,
  meshActive: `radial-gradient(at 20% 80%, rgba(0,212,255,0.15) 0%, transparent 50%),
               radial-gradient(at 80% 20%, rgba(179,136,255,0.12) 0%, transparent 50%)`,
} as const;

export const animation = {
  micro: "150ms ease-out",
  standard: "250ms ease-out",
  large: "400ms ease-out",
  spring: "spring(1, 80, 10)",
} as const;

export const glass = {
  background: "rgba(15, 20, 32, 0.7)",
  backdropFilter: "blur(16px)",
  border: "1px solid rgba(255, 255, 255, 0.06)",
  borderRadius: "12px",
} as const;

export const typography = {
  display: { fontFamily: "var(--font-sora)", weight: 700, size: "2rem", lineHeight: "1.1" },
  h1: { fontFamily: "var(--font-sora)", weight: 600, size: "1.5rem", lineHeight: "1.2" },
  h2: { fontFamily: "var(--font-sora)", weight: 600, size: "1.125rem", lineHeight: "1.3" },
  body: { fontFamily: "var(--font-dm-sans)", weight: 400, size: "0.875rem", lineHeight: "1.5" },
  bodySmall: { fontFamily: "var(--font-dm-sans)", weight: 400, size: "0.75rem", lineHeight: "1.4" },
  caption: { fontFamily: "var(--font-dm-sans)", weight: 500, size: "0.625rem", lineHeight: "1.3" },
  mono: { fontFamily: "var(--font-jetbrains-mono)", weight: 500, size: "0.875rem", lineHeight: "1.5" },
} as const;
