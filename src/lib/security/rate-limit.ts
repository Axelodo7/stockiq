interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const store = new Map<string, RateLimitEntry>();

function cleanup() {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (now > entry.resetTime) {
      store.delete(key);
    }
  }
}

setInterval(cleanup, 60_000);

export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetTime) {
    store.set(key, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, resetTime: now + windowMs };
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetTime: entry.resetTime };
  }

  entry.count++;
  return { allowed: true, remaining: maxRequests - entry.count, resetTime: entry.resetTime };
}

export function perUserLimit(
  userId: string,
  maxRequests = 100,
  windowMs = 60_000
) {
  return checkRateLimit(`user:${userId}`, maxRequests, windowMs);
}

export function perIPLimit(
  ip: string,
  maxRequests = 50,
  windowMs = 60_000
) {
  return checkRateLimit(`ip:${ip}`, maxRequests, windowMs);
}

/** Stricter limits for expensive AI routes — 10 requests/min per user, 5/min per IP. */
export function aiUserLimit(userId: string) {
  return checkRateLimit(`ai:user:${userId}`, 10, 60_000);
}

export function aiIPLimit(ip: string) {
  return checkRateLimit(`ai:ip:${ip}`, 5, 60_000);
}
