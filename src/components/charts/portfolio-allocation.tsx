"use client";

export interface AllocationItem {
  name: string;
  value: number;
  color: string;
  percent: number;
}

interface PortfolioAllocationProps {
  items: AllocationItem[];
  size?: number;
}

export function PortfolioAllocation({ items, size = 200 }: PortfolioAllocationProps) {
  const total = items.reduce((sum, item) => sum + item.value, 0);
  let cumulativePercent = 0;

  const radius = size / 2 - 20;
  const innerRadius = radius * 0.6;
  const center = size / 2;

  return (
    <div className="flex items-center gap-6">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {items.map((item, i) => {
            const startAngle = cumulativePercent * 2 * Math.PI - Math.PI / 2;
            cumulativePercent += item.percent / 100;
            const endAngle = cumulativePercent * 2 * Math.PI - Math.PI / 2;

            const x1 = center + radius * Math.cos(startAngle);
            const y1 = center + radius * Math.sin(startAngle);
            const x2 = center + radius * Math.cos(endAngle);
            const y2 = center + radius * Math.sin(endAngle);
            const x1Inner = center + innerRadius * Math.cos(startAngle);
            const y1Inner = center + innerRadius * Math.sin(startAngle);
            const x2Inner = center + innerRadius * Math.cos(endAngle);
            const y2Inner = center + innerRadius * Math.sin(endAngle);

            const largeArc = item.percent > 50 ? 1 : 0;

            const path = [
              `M ${x1} ${y1}`,
              `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
              `L ${x2Inner} ${y2Inner}`,
              `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x1Inner} ${y1Inner}`,
              "Z",
            ].join(" ");

            return (
              <path
                key={i}
                d={path}
                fill={item.color}
                className="transition-all duration-200 hover:opacity-80"
                stroke="rgba(10, 14, 23, 0.8)"
                strokeWidth={1}
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[10px] text-muted">Total</span>
          <span className="font-mono text-sm font-bold">${total.toLocaleString()}</span>
        </div>
      </div>

      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.name} className="flex items-center gap-2">
            <div
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-xs text-muted">{item.name}</span>
            <span className="ml-auto font-mono text-xs font-bold">
              {item.percent.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
