/**
 * Shared types for portfolio, watchlist, and alert data.
 * Mirrors Prisma model shapes used by the API.
 */

export type AlertType = "PRICE" | "VOLUME" | "PERCENT_CHANGE";
export type AlertCondition = "ABOVE" | "BELOW" | "PCT_UP" | "PCT_DOWN";
export type TransactionType = "BUY" | "SELL" | "DIVIDEND";

export interface StockLite {
  id: string;
  ticker: string;
  companyName: string;
  sector?: string | null;
  marketCap?: number | null;
  exchange?: string | null;
}

export interface Position {
  id: string;
  portfolioId: string;
  stockId: string;
  shares: number;
  avgCost: number;
  createdAt: string;
  updatedAt: string;
  stock: StockLite;
}

export interface Transaction {
  id: string;
  portfolioId: string;
  stockId: string;
  type: TransactionType;
  shares: number;
  price: number;
  fees: number;
  totalAmount: number;
  executedAt: string;
  stock?: StockLite;
}

export interface Portfolio {
  id: string;
  userId: string;
  name: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
  positions: Position[];
  transactions?: Transaction[];
}

export interface WatchlistItem {
  id: string;
  watchlistId: string;
  stockId: string;
  addedAt: string;
  sortOrder: number;
  stock: StockLite;
}

export interface Watchlist {
  id: string;
  userId: string;
  name: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
  items: WatchlistItem[];
}

export interface Alert {
  id: string;
  userId: string;
  stockId: string;
  type: AlertType;
  condition: AlertCondition;
  targetValue: number;
  isActive: boolean;
  lastTriggered?: string | null;
  createdAt: string;
  updatedAt: string;
  stock: StockLite;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
}
