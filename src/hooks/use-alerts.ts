/**
 * Hook that wraps the StockIQ API for alerts CRUD.
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { apiClient, ApiError } from "@/lib/api-client";
import type { Alert } from "@/types/portfolio";

export function useAlerts() {
  const { isLoaded, isSignedIn } = useUser();
  const [alerts, setAlerts] = useState<Alert[]>([]);
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
      const data = await apiClient.get<Alert[]>("/api/alerts");
      setAlerts(data);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setAlerts([]);
      } else {
        setError(err instanceof Error ? err.message : "Failed to load alerts");
      }
    } finally {
      setLoading(false);
    }
  }, [isLoaded, isSignedIn]);

  useEffect(() => {
    load();
  }, [load]);

  const createAlert = useCallback(
    async (data: {
      stockTicker: string;
      type: "PRICE" | "VOLUME" | "PERCENT_CHANGE";
      condition: "ABOVE" | "BELOW" | "PCT_UP" | "PCT_DOWN";
      targetValue: number;
    }) => {
      // Ensure stock exists before creating alert
      await apiClient.post<{ id: string }>("/api/stocks/ensure", {
        stockTicker: data.stockTicker,
      });
      const alert = await apiClient.post<Alert>("/api/alerts", data);
      await load();
      return alert;
    },
    [load]
  );

  const toggleAlert = useCallback(
    async (alertId: string, isActive: boolean) => {
      const updated = await apiClient.put<Alert>(`/api/alerts/${alertId}`, { isActive });
      setAlerts((prev) => prev.map((a) => (a.id === alertId ? updated : a)));
      return updated;
    },
    []
  );

  const updateAlert = useCallback(
    async (alertId: string, data: { targetValue?: number; isActive?: boolean }) => {
      const updated = await apiClient.put<Alert>(`/api/alerts/${alertId}`, data);
      await load();
      return updated;
    },
    [load]
  );

  const removeAlert = useCallback(
    async (alertId: string) => {
      await apiClient.delete(`/api/alerts/${alertId}`);
      setAlerts((prev) => prev.filter((a) => a.id !== alertId));
    },
    []
  );

  return {
    alerts,
    loading,
    error,
    refresh: load,
    createAlert,
    toggleAlert,
    updateAlert,
    removeAlert,
    isSignedIn,
  };
}

export type { Alert };
