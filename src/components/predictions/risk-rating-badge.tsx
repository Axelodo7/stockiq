"use client";

import type { RiskRating } from "@/types";

interface RiskRatingBadgeProps {
  rating: RiskRating;
}

export function RiskRatingBadge({ rating }: RiskRatingBadgeProps) {
  const colors: Record<RiskRating, string> = {
    LOW: "bg-positive/10 text-positive border-positive/20",
    MEDIUM: "bg-accent/10 text-accent border-accent/20",
    HIGH: "bg-warning/10 text-warning border-warning/20",
    EXTREME: "bg-negative/10 text-negative border-negative/20",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${colors[rating]}`}
    >
      {rating}
    </span>
  );
}
