/**
 * Server-side in-memory cache with TTL for API routes.
 * Avoids Redis dependency — suitable for single-instance deployments.
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class ServerCache {
  private store = new Map<string, CacheEntry<unknown>>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes

  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.data as T;
  }

  set<T>(key: string, data: T, ttlMs?: number): void {
    this.store.set(key, {
      data,
      expiresAt: Date.now() + (ttlMs ?? this.defaultTTL),
    });
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  /** Remove all entries matching a prefix */
  clearPrefix(prefix: string): void {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
      }
    }
  }

  /** Get cache stats */
  stats() {
    let valid = 0;
    let expired = 0;
    const now = Date.now();
    for (const entry of this.store.values()) {
      if (now > entry.expiresAt) expired++;
      else valid++;
    }
    return { total: this.store.size, valid, expired };
  }

  /** Cleanup expired entries periodically */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
      }
    }
  }
}

export const cache = new ServerCache();

// Cleanup every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => cache.cleanup(), 5 * 60 * 1000);
}

/**
 * Cache wrapper for async functions.
 * Returns cached result if available, otherwise calls the function and caches the result.
 */
export async function cached<T>(
  key: string,
  fn: () => Promise<T>,
  ttlMs?: number
): Promise<T> {
  const cached = cache.get<T>(key);
  if (cached !== null) return cached;

  const data = await fn();
  cache.set(key, data, ttlMs);
  return data;
}

/** Cache TTL presets */
export const TTL = {
  SHORT: 60 * 1000,           // 1 minute
  MEDIUM: 5 * 60 * 1000,      // 5 minutes
  LONG: 15 * 60 * 1000,       // 15 minutes
  HOUR: 60 * 60 * 1000,       // 1 hour
  DAY: 24 * 60 * 60 * 1000,   // 24 hours
} as const;
