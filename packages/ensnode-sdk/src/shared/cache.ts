import { getUnixTime } from "date-fns";

import { addDuration, durationBetween } from "./datetime";
import type { Duration, UnixTimestamp } from "./types";

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

interface CacheEntry<ValueType> {
  value: ValueType;
  expiresAt: UnixTimestamp;
}

/**
 * Cache that maps from string -> ValueType with TTL (time-to-live) expiration.
 *
 * Items are automatically removed when they expire.
 */
export class TtlCache<KeyType extends string, ValueType> implements Cache<KeyType, ValueType> {
  private readonly _cache = new Map<string, CacheEntry<ValueType>>();
  private readonly _ttl: Duration;

  /**
   * Create a new TTL cache with the given TTL.
   *
   * @param ttl Time-to-live duration in seconds. Items expire after this duration.
   */
  public constructor(ttl: Duration) {
    this._ttl = ttl;
  }

  private _cleanup(): void {
    const now = getUnixTime(new Date());
    for (const [key, entry] of this._cache.entries()) {
      if (entry.expiresAt <= now) {
        this._cache.delete(key);
      }
    }
  }

  public set(key: string, value: ValueType): void {
    this._cleanup();

    const expiresAt = addDuration(getUnixTime(new Date()), this._ttl);
    this._cache.set(key, { value, expiresAt });
  }

  public get(key: string): ValueType | undefined {
    this._cleanup();

    const entry = this._cache.get(key);
    if (!entry) {
      return undefined;
    }

    if (entry.expiresAt <= getUnixTime(new Date())) {
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

    if (entry.expiresAt <= getUnixTime(new Date())) {
      this._cache.delete(key);
      return false;
    }

    return true;
  }

  public delete(key: string): boolean {
    return this._cache.delete(key);
  }
}

/**
 * Internal cache entry structure for the Stale-While-Revalidate (SWR) caching strategy.
 *
 * This interface represents a single cache entry that stores the cached value,
 * metadata about when it was last updated, and tracks any in-progress revalidation.
 *
 * @internal
 */
interface SWRCache<ValueType> {
  /**
   * The cached value of type ValueType.
   */
  value: ValueType;

  /**
   * Unix timestamp indicating when the cached `value` was last successfully updated.
   */
  updatedAt: UnixTimestamp;

  /**
   * Optional promise of the current in-progress attempt to revalidate the cached `value`.
   *
   * If undefined, no revalidation attempt is currently in progress.
   * If defined, a revalidation attempt is currently in progress.
   *
   * Helps to enforce no concurrent revalidation attempts.
   */
  inProgressRevalidation?: Promise<void>;
}

interface StaleWhileRevalidateOptions<ValueType> {
  /**
   * The async function to wrap with SWR caching.
   * On success this function returns a value of type `ValueType` to store in the `SWRCache`.
   * On error, this function throws an error and no changes will be made to the `SWRCache`.
   */
  fn: () => Promise<ValueType>;

  /**
   * Time-to-live duration in seconds. After this duration, data in the `SWRCache` is
   * considered stale but is still retained in the cache until replaced with a new value.
   */
  ttl: Duration;
}

/**
 * Stale-While-Revalidate (SWR) cache wrapper for async functions.
 *
 * This caching strategy serves cached data immediately (even if stale) while
 * asynchronously revalidating the cache in the background. This provides:
 * - Sub-millisecond response times (after first fetch)
 * - Always available data (serves stale data during revalidation)
 * - Automatic background updates (currently only triggered lazily when new requests
 *   are made for the cached data after it becomes stale)
 *
 * Error Handling:
 * - If a new invocation of the provided `fn` throws an error and a cached value exists
 *   from a previous successfully invocation of the provided `fn`, the stale cached value is returned.
 * - If a new invocation of the provided `fn` throws an error and NO cached value exists,
 *   from any prior invocations of the provided `fn`, such that the provided `fn` has never
 *   successfully returned a value for the lifetime of the `SWRCache`, then `null` is returned.
 * - Therefore, errors occuring within the provided `fn` are handled internally within
 *   `staleWhileRevalidate` and do not propagate to the caller.
 *
 * @example
 * ```typescript
 * const fetchExpensiveData = async () => {
 *   const response = await fetch('/api/data');
 *   return response.json();
 * };
 *
 * const cachedFetch = staleWhileRevalidate(fetchExpensiveData, 60); // 60 second TTL
 *
 * // First call: fetches data (slow)
 * const data1 = await cachedFetch();
 *
 * // Within TTL: returns cached data (fast)
 * const data2 = await cachedFetch();
 *
 * // After TTL: returns stale data immediately, revalidates asynchronously in the background
 * const data3 = await cachedFetch(); // Still fast!
 * ```
 *
 * @param fn The async function to wrap with SWR caching
 * @param ttl Time-to-live duration in seconds. After this duration, data is considered stale
 * @returns a value of `ValueType` that was most recently successfully returned by `fn`
 *          or `null` if `fn` has never successfully returned and has always thrown an error.
 *
 * @link https://web.dev/stale-while-revalidate/
 * @link https://datatracker.ietf.org/doc/html/rfc5861
 */
export function staleWhileRevalidate<ValueType>(
  options: StaleWhileRevalidateOptions<ValueType>,
): () => Promise<ValueType | null> {
  const { fn, ttl } = options;
  let cache: SWRCache<ValueType> | null = null;
  let cacheInitializer: Promise<ValueType | null> | null = null;

  return async (): Promise<ValueType | null> => {
    if (!cache) {
      // No cache. Attempt to successfully initialize the cache.
      // Note that any number of attempts to initiailze the cache may
      // have been attempted and failed previously.
      if (cacheInitializer) {
        // Initialization is already in progress. Therefore, return the existing
        // intialization attempt to enforce no concurrent invocations of `fn` by the
        // `staleWhileRevalidate` wrapper.
        return cacheInitializer;
      }

      // Attempt initialization of the cache.
      cacheInitializer = fn()
        .then((value) => {
          // successfully initialize the `SWRCache`
          cache = { value, updatedAt: getUnixTime(new Date()) };
          cacheInitializer = null;
          return value;
        })
        .catch(() => {
          // initialization failed
          cacheInitializer = null;
          // all attempts at cache intialization have failed and therefore
          // no cached value is available to return, so return null.
          return null;
        });

      return cacheInitializer;
    }

    const isStale = durationBetween(cache.updatedAt, getUnixTime(new Date())) > ttl;

    // Fresh cache, return immediately
    if (!isStale) return cache.value;

    // Stale cache, but revalidation already in progress
    if (cache.inProgressRevalidation) return cache.value;

    // Stale cache, kick off revalidation asynchronously in the background.
    const revalidationPromise = fn()
      .then((value) => {
        // successfully updated the `SWRCache`
        cache = { value, updatedAt: getUnixTime(new Date()) };
      })
      .catch(() => {
        // this attempt to update the cached value failed with an error.
        if (cache) {
          // Clear the `revalidating` promise so that the next request to read from
          // the `staleWhileRevalidate` wrapper will retry.
          cache.inProgressRevalidation = undefined;
        }

        // swallow the error
      });

    cache.inProgressRevalidation = revalidationPromise;

    // Return stale value immediately
    return cache.value;
  };
}
