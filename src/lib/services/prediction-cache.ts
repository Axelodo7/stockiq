import type { FullPrediction } from "@/types";
import { isMarketOpen } from "@/lib/utils";

interface CacheEntry {
  data: FullPrediction;
  timestamp: number;
  ttl: number;
}

class PredictionCache {
  private store = new Map<string, CacheEntry>();

  get(ticker: string): FullPrediction | null {
    const key = `prediction:${ticker}`;
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.store.delete(key);
      return null;
    }
    return entry.data;
  }

  set(ticker: string, data: FullPrediction): void {
    const ttl = isMarketOpen() ? 5 * 60 * 1000 : 60 * 60 * 1000;
    this.store.set(`prediction:${ticker}`, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  invalidate(ticker: string): void {
    this.store.delete(`prediction:${ticker}`);
  }

  invalidateAll(): void {
    this.store.clear();
  }

  has(ticker: string): boolean {
    return this.get(ticker) !== null;
  }
}

export const predictionCache = new PredictionCache();
