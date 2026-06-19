"use client";

import { useEffect, useRef, useMemo } from "react";
import { createChart, ColorType, type IChartApi, type ISeriesApi } from "lightweight-charts";

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
  const chartRef = useRef<IChartApi | null>(null);
  const equitySeriesRef = useRef<ISeriesApi<"Area"> | null>(null);
  const benchmarkSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);

  const equityData = useMemo(
    () => data.map((d) => ({ time: d.date, value: d.equity })),
    [data]
  );

  const benchmarkData = useMemo(
    () => benchmark?.map((d) => ({ time: d.date, value: d.value })) || [],
    [benchmark]
  );

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

    chartRef.current = chart;

    const equitySeries = chart.addAreaSeries({
      lineColor: "#00d4ff",
      topColor: "rgba(0, 212, 255, 0.15)",
      bottomColor: "rgba(0, 212, 255, 0.01)",
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: false,
    });
    equitySeriesRef.current = equitySeries;
    equitySeries.setData(equityData as import("lightweight-charts").LineData[]);

    if (benchmarkData.length > 0) {
      const benchmarkSeries = chart.addLineSeries({
        color: "rgba(139, 146, 165, 0.4)",
        lineWidth: 1,
        lineStyle: 2,
        priceLineVisible: false,
        lastValueVisible: false,
      });
      benchmarkSeriesRef.current = benchmarkSeries;
      benchmarkSeries.setData(benchmarkData as import("lightweight-charts").LineData[]);
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
      chartRef.current = null;
      equitySeriesRef.current = null;
      benchmarkSeriesRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (equitySeriesRef.current) {
      equitySeriesRef.current.setData(equityData as import("lightweight-charts").LineData[]);
    }
    if (benchmarkSeriesRef.current && benchmarkData.length > 0) {
      benchmarkSeriesRef.current.setData(benchmarkData as import("lightweight-charts").LineData[]);
    }
    chartRef.current?.timeScale().fitContent();
  }, [equityData, benchmarkData]);

  return <div ref={containerRef} className="w-full" />;
}
