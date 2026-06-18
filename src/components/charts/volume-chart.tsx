"use client";

import { useEffect, useRef, useMemo } from "react";
import { createChart, ColorType, type IChartApi, type ISeriesApi } from "lightweight-charts";

interface VolumeBar {
  date: string;
  volume: number;
  close: number;
  prevClose: number;
}

interface VolumeChartProps {
  data: VolumeBar[];
  height?: number;
}

export function VolumeChart({ data, height = 150 }: VolumeChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);

  const chartData = useMemo(
    () =>
      data.map((d) => ({
        time: d.date,
        value: d.volume,
        color: d.close >= d.prevClose ? "rgba(0, 230, 118, 0.35)" : "rgba(255, 23, 68, 0.35)",
      })),
    [data]
  );

  // Create chart once
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
      rightPriceScale: {
        borderColor: "rgba(255, 255, 255, 0.06)",
      },
      timeScale: {
        borderColor: "rgba(255, 255, 255, 0.06)",
      },
      crosshair: {
        vertLine: { color: "rgba(0, 212, 255, 0.3)", width: 1, style: 2 },
        horzLine: { color: "rgba(0, 212, 255, 0.3)", width: 1, style: 2 },
      },
    });

    chartRef.current = chart;

    const volumeSeries = chart.addHistogramSeries({
      priceFormat: { type: "volume" },
      priceLineVisible: false,
      lastValueVisible: false,
    });
    seriesRef.current = volumeSeries;
    volumeSeries.setData(chartData as import("lightweight-charts").HistogramData[]);

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
      seriesRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update data without recreating chart
  useEffect(() => {
    if (seriesRef.current) {
      seriesRef.current.setData(chartData as import("lightweight-charts").HistogramData[]);
    }
  }, [chartData]);

  return <div ref={containerRef} className="w-full" />;
}
