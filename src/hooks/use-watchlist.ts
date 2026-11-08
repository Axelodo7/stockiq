/**
 * Hook that wraps the StockIQ API for watchlist CRUD.
 * Auto-creates a default watchlist on first access.
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { apiClient, ApiError } from "@/lib/api-client";
import type { Watchlist, WatchlistItem } from "@/types/portfolio";

const DEFAULT_WATCHLIST_NAME = "My Watchlist";

export function useWatchlist() {
  const { isLoaded, isSignedIn } = useUser();
  const [watchlist, setWatchlist] = useState<Watchlist | null>(null);
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
      const watchlists = await apiClient.get<Watchlist[]>("/api/watchlist");
      let active = watchlists[0];

      if (!active) {
        active = await apiClient.post<Watchlist>("/api/watchlist", {
          name: DEFAULT_WATCHLIST_NAME,
          description: "Stocks I'm tracking",
        });
      }

      active = await apiClient.get<Watchlist>(`/api/watchlist/${active.id}`);
      setWatchlist(active);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setWatchlist(null);
      } else {
        setError(err instanceof Error ? err.message : "Failed to load watchlist");
      }
    } finally {
      setLoading(false);
    }
  }, [isLoaded, isSignedIn]);

  useEffect(() => {
    load();
  }, [load]);

  const addItem = useCallback(
    async (stockTicker: string) => {
      if (!watchlist) throw new Error("No watchlist loaded");
      // Ensure stock exists before adding to watchlist
      await apiClient.post<{ id: string }>("/api/stocks/ensure", {
        stockTicker,
      });
      const item = await apiClient.post<WatchlistItem>(
        `/api/watchlist/${watchlist.id}/items`,
        { stockTicker }
      );
      await load();
      return item;
    },
    [watchlist, load]
  );

  const removeItem = useCallback(
    async (itemId: string) => {
      if (!watchlist) throw new Error("No watchlist loaded");
      await apiClient.delete(`/api/watchlist/${watchlist.id}/items/${itemId}`);
      await load();
    },
    [watchlist, load]
  );

  return {
    watchlist,
    items: watchlist?.items ?? [],
    loading,
    error,
    refresh: load,
    addItem,
    removeItem,
    isSignedIn,
  };
}

export type { Watchlist, WatchlistItem };
