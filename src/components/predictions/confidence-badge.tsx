"use client";

interface ConfidenceBadgeProps {
  confidence: number;
}

export function ConfidenceBadge({ confidence }: ConfidenceBadgeProps) {
  const percent = Math.round(confidence * 100);
  let color = "bg-negative";
  if (percent >= 70) color = "bg-positive";
  else if (percent >= 50) color = "bg-accent";
  else if (percent >= 30) color = "bg-warning";

  return (
    <div className="flex items-center gap-1.5">
      <div className="h-1.5 flex-1 rounded-full bg-panel-elevated">
        <div
          className={`h-1.5 rounded-full ${color}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="text-[10px] font-medium text-muted">{percent}%</span>
    </div>
  );
}
