/**
 * Cache that maps from string -> ValueType.
 */
export interface Cache<KeyType extends string, ValueType> {
  /**
   * Store a value in the cache with the given key.
   *
   * @param key Cache key
   * @param value Value to store
   */
  set(key: KeyType, value: ValueType): void;

  /**
   * Retrieve a value from the cache with the given key.
   *
   * @param key Cache key
   * @returns The cached value if it exists, otherwise undefined
   */
  get(key: KeyType): ValueType | undefined;

  /**
   * Clear the cache.
   */
  clear(): void;

  /**
   * The current number of items in the cache. Always a non-negative integer.
   */
  get size(): number;

  /**
   * The maximum number of items in the cache. Always a non-negative integer that is >= size().
   */
  get capacity(): number;
}

/**
 * Cache that maps from string -> ValueType with a LRU (least recently used) eviction policy.
 *
 * `get` and `set` are O(1) operations.
 *
 * @link https://en.wikipedia.org/wiki/Cache_replacement_policies#LRU
 */
export class LruCache<KeyType extends string, ValueType> implements Cache<KeyType, ValueType> {
  private readonly _cache = new Map<string, ValueType>();
  private readonly _capacity: number;

  /**
   * Create a new LRU cache with the given capacity.
   *
   * @param capacity The maximum number of items in the cache. If set to 0, the cache is effectively disabled.
   * @throws Error if capacity is not a non-negative integer.
   */
  public constructor(capacity: number) {
    if (!Number.isInteger(capacity)) {
      throw new Error(
        `LruCache requires capacity to be an integer but a capacity of ${capacity} was requested.`,
      );
    }

    if (capacity < 0) {
      throw new Error(
        `LruCache requires a non-negative capacity but a capacity of ${capacity} was requested.`,
      );
    }

    this._capacity = capacity;
  }

  public set(key: string, value: ValueType) {
    this._cache.set(key, value);

    if (this._cache.size > this._capacity) {
      // oldestKey is guaranteed to be defined
      const oldestKey = this._cache.keys().next().value as string;
      this._cache.delete(oldestKey);
    }
  }

  public get(key: string) {
    const value = this._cache.get(key);
    if (value) {
      // The key is already in the cache, move it to the end (most recent)
      this._cache.delete(key);
      this._cache.set(key, value);
    }
    return value;
  }

  public clear() {
    this._cache.clear();
  }

  public get size() {
    return this._cache.size;
  }

  public get capacity() {
    return this._capacity;
  }
}

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

/**
 * Cache that maps from string -> ValueType with TTL (time-to-live) expiration.
 *
 * Items are automatically removed when they expire.
 */
export class TtlCache<KeyType extends string, ValueType> implements Cache<KeyType, ValueType> {
  private readonly _cache = new Map<string, CacheEntry<ValueType>>();
  private readonly _ttlMs: number;

  /**
   * Create a new TTL cache with the given TTL.
   *
   * @param ttlMs Time-to-live in milliseconds. Items expire after this duration.
   * @throws Error if ttlMs is not positive.
   */
  public constructor(ttlMs: number) {
    if (!Number.isInteger(ttlMs) || ttlMs <= 0) {
      throw new Error(
        `TtlCache requires ttlMs to be a positive integer but a ttlMs of ${ttlMs} was requested.`,
      );
    }

    this._ttlMs = ttlMs;
  }

  private _cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this._cache.entries()) {
      if (entry.expiresAt <= now) {
        this._cache.delete(key);
      }
    }
  }

  public set(key: string, value: ValueType): void {
    this._cleanup();

    const expiresAt = Date.now() + this._ttlMs;
    this._cache.set(key, { value, expiresAt });
  }

  public get(key: string): ValueType | undefined {
    this._cleanup();

    const entry = this._cache.get(key);
    if (!entry) {
      return undefined;
    }

    if (entry.expiresAt <= Date.now()) {
      this._cache.delete(key);
      return undefined;
    }

    return entry.value;
  }

  public clear(): void {
    this._cache.clear();
  }

  public get size(): number {
    this._cleanup();
    return this._cache.size;
  }

  public get capacity(): number {
    return Number.MAX_SAFE_INTEGER;
  }

  public has(key: string): boolean {
    this._cleanup();

    const entry = this._cache.get(key);
    if (!entry) {
      return false;
    }

    if (entry.expiresAt <= Date.now()) {
      this._cache.delete(key);
      return false;
    }

    return true;
  }

  public delete(key: string): boolean {
    return this._cache.delete(key);
  }
}

interface SWRCache<T> {
  value: T;
  timestamp: number;
  revalidating?: Promise<T>;
}

/**
 * Stale-While-Revalidate (SWR) cache wrapper for async functions.
 *
 * This caching strategy serves cached data immediately (even if stale) while
 * asynchronously revalidating the cache in the background. This provides:
 * - Sub-millisecond response times (after first fetch)
 * - Always available data (serves stale data during revalidation)
 * - Automatic background updates
 *
 * @example
 * ```typescript
 * const fetchExpensiveData = async () => {
 *   const response = await fetch('/api/data');
 *   return response.json();
 * };
 *
 * const cachedFetch = staleWhileRevalidate(fetchExpensiveData, 60000); // 1 minute TTL
 *
 * // First call: fetches data (slow)
 * const data1 = await cachedFetch();
 *
 * // Within TTL: returns cached data (fast)
 * const data2 = await cachedFetch();
 *
 * // After TTL: returns stale data immediately, revalidates in background
 * const data3 = await cachedFetch(); // Still fast!
 * ```
 *
 * @param fn The async function to wrap with SWR caching
 * @param ttl Time-to-live in milliseconds. After this duration, data is considered stale
 * @returns A cached version of the function with SWR semantics
 *
 * @link https://web.dev/stale-while-revalidate/
 * @link https://datatracker.ietf.org/doc/html/rfc5861
 */
export function staleWhileRevalidate<T>(fn: () => Promise<T>, ttl: number): () => Promise<T> {
  if (!Number.isInteger(ttl) || ttl <= 0) {
    throw new Error(
      `staleWhileRevalidate requires ttl to be a positive integer but a ttl of ${ttl} was provided.`,
    );
  }

  let cache: SWRCache<T> | null = null;

  return async (): Promise<T> => {
    const now = Date.now();

    // No cache, fetch for the first time
    if (!cache) {
      const value = await fn();
      cache = { value, timestamp: now };
      return value;
    }

    const isStale = now - cache.timestamp > ttl;

    // Fresh cache, return immediately
    if (!isStale) return cache.value;

    // Stale cache, but revalidation already in progress
    if (cache.revalidating) return cache.value;

    // Stale cache, kick off revalidation in background
    const revalidationPromise = fn()
      .then((value) => {
        cache = { value, timestamp: Date.now() };
        return value;
      })
      .catch(() => {
        // On error, clear revalidating flag so next request can retry
        // Keep serving stale data, swallow error (background revalidation)
        if (cache) {
          cache.revalidating = undefined;
        }
        // Don't re-throw - this is background revalidation
        // Caller can add their own error handling in the wrapped function
        return cache?.value as T;
      });

    cache.revalidating = revalidationPromise;

    // Return stale value immediately
    return cache.value;
  };
}
