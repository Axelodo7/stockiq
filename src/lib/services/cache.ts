import type { CacheEntry } from "@/types";
import { CACHE_TTL } from "@/lib/constants";
import { isMarketOpen } from "@/lib/utils";

class MemoryCache {
  private store = new Map<string, CacheEntry<unknown>>();
  private cleanupInterval: ReturnType<typeof setInterval>;

  constructor() {
    this.cleanupInterval = setInterval(() => this.cleanup(), 30_000);
  }

  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.store.delete(key);
      return null;
    }
    return entry.data as T;
  }

  set<T>(key: string, data: T, ttl: number): void {
    this.store.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  deletePattern(pattern: string): void {
    const regex = new RegExp(pattern.replace("*", ".*"));
    for (const key of this.store.keys()) {
      if (regex.test(key)) {
        this.store.delete(key);
      }
    }
  }

  clear(): void {
    this.store.clear();
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.store.delete(key);
      }
    }
  }

  destroy() {
    clearInterval(this.cleanupInterval);
    this.store.clear();
  }
}

export const cache = new MemoryCache();

export function buildCacheKey(...parts: (string | number | undefined)[]): string {
  return parts.filter(Boolean).join(":");
}

export function getCacheTtl(type: keyof typeof CACHE_TTL): number {
  const baseTtl = CACHE_TTL[type];
  if (type === "QUOTE" || type === "HISTORICAL") {
    return isMarketOpen() ? baseTtl : baseTtl * 20;
  }
  return baseTtl;
}
