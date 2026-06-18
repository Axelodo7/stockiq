"use client";

import { useEffect, useRef } from "react";
import { createChart, ColorType } from "lightweight-charts";

interface EquityCurveChartProps {
  data: Array<{ date: string; equity: number }>;
  height?: number;
  benchmark?: Array<{ date: string; value: number }>;
}

export function EquityCurveChart({
  data,
  height = 300,
  benchmark,
}: EquityCurveChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || data.length < 2) return;

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#8b92a5",
        fontFamily: "JetBrains Mono",
        fontSize: 10,
      },
      grid: {
        vertLines: { color: "rgba(255, 255, 255, 0.03)" },
        horzLines: { color: "rgba(255, 255, 255, 0.03)" },
      },
      crosshair: {
        vertLine: { color: "rgba(0, 212, 255, 0.3)", width: 1, style: 2 },
        horzLine: { color: "rgba(0, 212, 255, 0.3)", width: 1, style: 2 },
      },
      rightPriceScale: {
        borderColor: "rgba(255, 255, 255, 0.06)",
      },
      timeScale: {
        borderColor: "rgba(255, 255, 255, 0.06)",
      },
    });

    // Equity line
    const equitySeries = chart.addAreaSeries({
      lineColor: "#00d4ff",
      topColor: "rgba(0, 212, 255, 0.15)",
      bottomColor: "rgba(0, 212, 255, 0.01)",
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: false,
    });

    equitySeries.setData(
      data.map((d) => ({ time: d.date, value: d.equity })) as import("lightweight-charts").LineData[]
    );

    // Benchmark line (optional)
    if (benchmark && benchmark.length > 0) {
      const benchmarkSeries = chart.addLineSeries({
        color: "rgba(139, 146, 165, 0.4)",
        lineWidth: 1,
        lineStyle: 2,
        priceLineVisible: false,
        lastValueVisible: false,
      });

      benchmarkSeries.setData(
        benchmark.map((d) => ({ time: d.date, value: d.value })) as import("lightweight-charts").LineData[]
      );
    }

    chart.timeScale().fitContent();

    const handleResize = () => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
    };
  }, [data, height, benchmark]);

  return <div ref={containerRef} className="w-full" />;
}
