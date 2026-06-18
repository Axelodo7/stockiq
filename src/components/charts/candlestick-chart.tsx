"use client";

import { useEffect, useRef } from "react";
import { createChart, ColorType, CrosshairMode } from "lightweight-charts";

export interface OHLCVBar {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface CandlestickChartProps {
  data: OHLCVBar[];
  height?: number;
  showVolume?: boolean;
  onCrosshairMove?: (data: { date: string; price: number } | null) => void;
}

export function CandlestickChart({
  data,
  height = 400,
  showVolume = true,
  onCrosshairMove,
}: CandlestickChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<ReturnType<typeof createChart> | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

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
        mode: CrosshairMode.Normal,
        vertLine: { color: "rgba(0, 212, 255, 0.3)", width: 1, style: 2 },
        horzLine: { color: "rgba(0, 212, 255, 0.3)", width: 1, style: 2 },
      },
      rightPriceScale: {
        borderColor: "rgba(255, 255, 255, 0.06)",
      },
      timeScale: {
        borderColor: "rgba(255, 255, 255, 0.06)",
        timeVisible: true,
      },
    });

    chartRef.current = chart;

    // Candlestick series
    const candlestickSeries = chart.addCandlestickSeries({
      upColor: "#00e676",
      downColor: "#ff1744",
      borderDownColor: "#ff1744",
      borderUpColor: "#00e676",
      wickDownColor: "#ff1744",
      wickUpColor: "#00e676",
    });

    const candleData = data.map((d) => ({
      time: d.date as string,
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
    }));

    candlestickSeries.setData(candleData as import("lightweight-charts").CandlestickData[]);

    // Volume series
    if (showVolume) {
      const volumeSeries = chart.addHistogramSeries({
        priceFormat: { type: "volume" },
        priceScaleId: "volume",
      });

      chart.priceScale("volume").applyOptions({
        scaleMargins: { top: 0.8, bottom: 0 },
      });

      const volumeData = data.map((d) => ({
        time: d.date as string,
        value: d.volume,
        color: d.close >= d.open ? "rgba(0, 230, 118, 0.2)" : "rgba(255, 23, 68, 0.2)",
      }));

      volumeSeries.setData(volumeData as import("lightweight-charts").HistogramData[]);
    }

    // Crosshair callback
    if (onCrosshairMove) {
      chart.subscribeCrosshairMove((param) => {
        if (!param.time || !param.seriesData) {
          onCrosshairMove(null);
          return;
        }
        const crosshairCandle = param.seriesData.get(candlestickSeries) as import("lightweight-charts").CandlestickData | undefined;
        if (crosshairCandle) {
          onCrosshairMove({
            date: param.time as string,
            price: crosshairCandle.close,
          });
        }
      });
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
    };
  }, [data, height, showVolume, onCrosshairMove]);

  return <div ref={containerRef} className="w-full" />;
}
