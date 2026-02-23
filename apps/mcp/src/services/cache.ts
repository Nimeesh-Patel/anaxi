// Simple in-memory cache for API responses (paper metadata, etc.)
// TTL in seconds. For production, consider Redis.

const cache = new Map<string, { value: unknown; expires: number }>();

export function get<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    cache.delete(key);
    return null;
  }
  return entry.value as T;
}

export function set(key: string, value: unknown, ttlSeconds = 300): void {
  cache.set(key, {
    value,
    expires: Date.now() + ttlSeconds * 1000,
  });
}

export function del(key: string): void {
  cache.delete(key);
}
