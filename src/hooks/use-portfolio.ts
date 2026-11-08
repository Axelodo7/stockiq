/**
 * Hook that wraps the StockIQ API for portfolio CRUD.
 * Auto-creates a default portfolio on first access.
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { apiClient, ApiError } from "@/lib/api-client";
import type { Portfolio, Position, Transaction } from "@/types/portfolio";

const DEFAULT_PORTFOLIO_NAME = "Main Portfolio";

export function usePortfolio() {
  const { isLoaded, isSignedIn } = useUser();
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!isLoaded || !isSignedIn) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const portfolios = await apiClient.get<Portfolio[]>("/api/portfolio");
      let active = portfolios[0];

      // Auto-create default portfolio if none exists
      if (!active) {
        active = await apiClient.post<Portfolio>("/api/portfolio", {
          name: DEFAULT_PORTFOLIO_NAME,
          description: "Default portfolio",
        });
      }

      // Fetch full portfolio with positions
      active = await apiClient.get<Portfolio>(`/api/portfolio/${active.id}`);
      setPortfolio(active);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        // Not signed in — silent
        setPortfolio(null);
      } else {
        setError(err instanceof Error ? err.message : "Failed to load portfolio");
      }
    } finally {
      setLoading(false);
    }
  }, [isLoaded, isSignedIn]);

  useEffect(() => {
    load();
  }, [load]);

  const addPosition = useCallback(
    async (data: { stockTicker: string; shares: number; avgCost: number }) => {
      if (!portfolio) throw new Error("No portfolio loaded");
      // Ensure stock exists before creating position
      await apiClient.post<{ id: string }>("/api/stocks/ensure", {
        stockTicker: data.stockTicker,
      });
      const position = await apiClient.post<Position>(
        `/api/portfolio/${portfolio.id}/positions`,
        data
      );
      await load();
      return position;
    },
    [portfolio, load]
  );

  const updatePosition = useCallback(
    async (positionId: string, data: { shares?: number; avgCost?: number }) => {
      if (!portfolio) throw new Error("No portfolio loaded");
      const updated = await apiClient.put<Position>(
        `/api/portfolio/${portfolio.id}/positions/${positionId}`,
        data
      );
      await load();
      return updated;
    },
    [portfolio, load]
  );

  const removePosition = useCallback(
    async (positionId: string) => {
      if (!portfolio) throw new Error("No portfolio loaded");
      await apiClient.delete(`/api/portfolio/${portfolio.id}/positions/${positionId}`);
      await load();
    },
    [portfolio, load]
  );

  return {
    portfolio,
    positions: portfolio?.positions ?? [],
    transactions: portfolio?.transactions ?? [],
    loading,
    error,
    refresh: load,
    addPosition,
    updatePosition,
    removePosition,
    isSignedIn,
  };
}

export type { Portfolio, Position, Transaction };
