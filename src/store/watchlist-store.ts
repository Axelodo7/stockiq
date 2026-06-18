import { create } from "zustand";
import type { Watchlist, WatchlistItem } from "@/types";

interface WatchlistState {
  watchlists: Watchlist[];
  activeWatchlist: Watchlist | null;
  items: WatchlistItem[];
  loading: boolean;
  setWatchlists: (watchlists: Watchlist[]) => void;
  setActiveWatchlist: (watchlist: Watchlist | null) => void;
  setItems: (items: WatchlistItem[]) => void;
  setLoading: (loading: boolean) => void;
}

export const useWatchlistStore = create<WatchlistState>((set) => ({
  watchlists: [],
  activeWatchlist: null,
  items: [],
  loading: false,
  setWatchlists: (watchlists) => set({ watchlists }),
  setActiveWatchlist: (watchlist) => set({ activeWatchlist: watchlist }),
  setItems: (items) => set({ items }),
  setLoading: (loading) => set({ loading }),
}));
