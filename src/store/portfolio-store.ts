import { create } from "zustand";
import type { Portfolio, PortfolioPosition, Transaction } from "@/types";

interface PortfolioState {
  portfolios: Portfolio[];
  activePortfolio: Portfolio | null;
  positions: PortfolioPosition[];
  transactions: Transaction[];
  loading: boolean;
  setPortfolios: (portfolios: Portfolio[]) => void;
  setActivePortfolio: (portfolio: Portfolio | null) => void;
  setPositions: (positions: PortfolioPosition[]) => void;
  setTransactions: (transactions: Transaction[]) => void;
  setLoading: (loading: boolean) => void;
}

export const usePortfolioStore = create<PortfolioState>((set) => ({
  portfolios: [],
  activePortfolio: null,
  positions: [],
  transactions: [],
  loading: false,
  setPortfolios: (portfolios) => set({ portfolios }),
  setActivePortfolio: (portfolio) => set({ activePortfolio: portfolio }),
  setPositions: (positions) => set({ positions }),
  setTransactions: (transactions) => set({ transactions }),
  setLoading: (loading) => set({ loading }),
}));
