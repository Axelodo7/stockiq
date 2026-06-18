"use client";

import { useEffect, useRef } from "react";
import { createChart, ColorType } from "lightweight-charts";

interface MiniSparklineProps {
  data: number[];
  color?: string;
  height?: number;
  width?: number;
  positive?: boolean;
}

export function MiniSparkline({
  data,
  color,
  height = 32,
  width = 80,
  positive,
}: MiniSparklineProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || data.length < 2) return;

    const lineColor = color || (positive !== undefined ? (positive ? "#00e676" : "#ff1744") : "#00d4ff");

    const chart = createChart(containerRef.current, {
      width,
      height,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "transparent",
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { visible: false },
      },
      rightPriceScale: { visible: false },
      timeScale: { visible: false },
      crosshair: { mode: 0 },
      handleScroll: false,
      handleScale: false,
    });

    const series = chart.addLineSeries({
      color: lineColor,
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: false,
    });

    const baseDate = new Date(2024, 0, 1);
    const chartData: { time: import("lightweight-charts").Time; value: number }[] = data.map((value, i) => {
      const d = new Date(baseDate);
      d.setDate(d.getDate() + i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return {
        time: `${yyyy}-${mm}-${dd}` as import("lightweight-charts").Time,
        value,
      };
    });

    series.setData(chartData as import("lightweight-charts").LineData[]);
    chart.timeScale().fitContent();

    return () => {
      chart.remove();
    };
  }, [data, color, height, width, positive]);

  return <div ref={containerRef} className="inline-block" />;
}
