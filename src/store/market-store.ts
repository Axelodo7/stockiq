import { create } from "zustand";
import type { MarketQuote, OHLCV } from "@/types";

interface MarketState {
  quotes: Map<string, MarketQuote>;
  historicalData: Map<string, OHLCV[]>;
  loading: boolean;
  errors: Map<string, string>;
  setQuote: (ticker: string, quote: MarketQuote) => void;
  setHistoricalData: (ticker: string, data: OHLCV[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (ticker: string, error: string) => void;
  clearError: (ticker: string) => void;
}

export const useMarketStore = create<MarketState>((set) => ({
  quotes: new Map(),
  historicalData: new Map(),
  loading: false,
  errors: new Map(),
  setQuote: (ticker, quote) =>
    set((state) => {
      const quotes = new Map(state.quotes);
      quotes.set(ticker, quote);
      return { quotes };
    }),
  setHistoricalData: (ticker, data) =>
    set((state) => {
      const historicalData = new Map(state.historicalData);
      historicalData.set(ticker, data);
      return { historicalData };
    }),
  setLoading: (loading) => set({ loading }),
  setError: (ticker, error) =>
    set((state) => {
      const errors = new Map(state.errors);
      errors.set(ticker, error);
      return { errors };
    }),
  clearError: (ticker) =>
    set((state) => {
      const errors = new Map(state.errors);
      errors.delete(ticker);
      return { errors };
    }),
}));
