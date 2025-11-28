import { secondsToMilliseconds } from "date-fns";
import { getUnixTime } from "date-fns/getUnixTime";

import { durationBetween } from "../datetime";
import type { Duration, UnixTimestamp } from "../types";
import { BackgroundRevalidationScheduler } from "./background-revalidation-scheduler";

// Singleton instance of the background revalidation scheduler
const bgRevalidationScheduler = new BackgroundRevalidationScheduler();

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

  /**
   * Optional interval in seconds for automatic background revalidation.
   * If defined, the cache will be revalidated on this schedule regardless of whether
   * the data is stale or if new requests are made.
   * If undefined, revalidation only occurs lazily when a request is made after TTL expires.
   */
  revalidationInterval?: Duration;

  /**
   * Fetch immediately
   *
   * If set to `true`, will make cache to warm up right after it was created.
   * Otherwise, there will be no fetch will happen until
   * background revalidation occurred (if requested), or cache was accessed
   * for the first time.
   */
  fetchImmediately?: boolean;
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
 * - Therefore, errors occurring within the provided `fn` are handled internally within
 *   `staleWhileRevalidate` and do not propagate to the caller.
 *
 * @example
 * ```typescript
 * const fetchExpensiveData = async () => {
 *   const response = await fetch('/api/data');
 *   return response.json();
 * };
 *
 * const cachedFetch = staleWhileRevalidate({
 *   fn: fetchExpensiveData,
 *   ttl: 60, // 1 minute TTL
 *   revalidationInterval: 5 * 60 // proactive revalidation after 5 minutes from latest cache update
 * });
 *
 * // [T0: 0] First call: fetches data (slow)
 * const firstRead = await cachedFetch();
 *
 * // [T1: T0 + 59s] Within TTL: returns data cache at T0 (fast)
 * const secondRead = await cachedFetch();
 *
 * // [T2: T0 + 1m30s] After TTL: returns stale data that was cached at T0 immediately
 * // revalidates asynchronously in the background
 * const thirdRead = await cachedFetch(); // Still fast!
 *
 * // [T3: T2 + 90m] Background revalidation kicks in
 *
 * // [T4: T3 + 1m] Within TTL: returns data cache at T3 (fast)
 * const fourthRead = await cachedFetch(); // Still fast!
 *
 * // Please note how using `revalidationInterval` enabled action at T3 to happen.
 * // If no `revalidationInterval` value was set, the action at T3 would not happen.
 * // Therefore, the `fourthRead` would return stale data cached at T2.
 * ```
 *
 * @param options.fn The async function to wrap with SWR caching
 * @param options.ttl Time-to-live duration in seconds. After this duration, data is considered stale
 * @param options.revalidationInterval Time-to-revalidate duration in seconds. After this duration,
 *                                     data is refreshed in the background
 * @param options.fetchImmediately If `true` will execute fetch right after cache was created.
 * @returns a value of `ValueType` that was most recently successfully returned by `fn`
 *          or `null` if `fn` has never successfully returned and has always thrown an error.
 *
 * @link https://web.dev/stale-while-revalidate/
 * @link https://datatracker.ietf.org/doc/html/rfc5861
 */
export function staleWhileRevalidate<ValueType>(
  options: StaleWhileRevalidateOptions<ValueType>,
): () => Promise<ValueType | null> {
  const { fn, ttl, revalidationInterval, fetchImmediately = false } = options;
  let cache: SWRCache<ValueType> | null = null;
  let cacheInitializer: Promise<ValueType | null> | null = null;

  /**
   * Internal function telling if cache is stale at the moment.
   */
  const isCacheStale = (cache: SWRCache<ValueType>): boolean =>
    durationBetween(cache.updatedAt, getUnixTime(new Date())) > ttl;

  /**
   * Internal function to trigger revalidation of the cache.
   * Used by both lazy revalidation and background revalidation.
   */
  const revalidate = async (): Promise<void> => {
    if (!cache) return;

    // Revalidation already in progress
    if (cache.inProgressRevalidation) return;

    const revalidationPromise = fn()
      .then((value) => {
        // Successfully updated the `SWRCache`
        cache = { value, updatedAt: getUnixTime(new Date()) };

        // Start a new background revalidation after successful cache update
        scheduleNewBackgroundRevalidation();
      })
      .catch(() => {
        // Revalidation attempt failed with an error.
        // Swallow the error; keep serving stale data
      })
      .finally(() => {
        if (cache) {
          // Clear the `inProgressRevalidation` promise so that the next request
          // will retry revalidation.
          cache.inProgressRevalidation = undefined;
        }
      });

    cache.inProgressRevalidation = revalidationPromise;
    await revalidationPromise;
  };

  /**
   * Cancel any existing background revalidation schedule and start a new one
   * (resets the schedule to interval milliseconds from now).
   */
  const scheduleNewBackgroundRevalidation = (): void => {
    if (revalidationInterval === undefined) return;

    // Cancel any existing schedule for this revalidate function
    bgRevalidationScheduler.cancel(revalidate);

    // Schedule a new one
    bgRevalidationScheduler.schedule({
      revalidate,
      interval: secondsToMilliseconds(revalidationInterval),
    });
  };

  const readCache = async (): Promise<ValueType | null> => {
    if (!cache) {
      // No cache. Attempt to successfully initialize the cache.
      if (cacheInitializer) {
        // Initialization is already in progress. Return the existing
        // initialization attempt to enforce no concurrent invocations of `fn`.
        return cacheInitializer;
      }

      // Attempt initialization of the cache.
      cacheInitializer = fn()
        .then((value) => {
          // Successfully initialize the `SWRCache`
          cache = { value, updatedAt: getUnixTime(new Date()) };
          cacheInitializer = null;

          // Schedule new background revalidation after successful cache initialization
          scheduleNewBackgroundRevalidation();

          return value;
        })
        .catch(() => {
          // Initialization failed
          cacheInitializer = null;
          // Return null as no cached value is available
          return null;
        });

      return cacheInitializer;
    }

    // Fresh cache, return immediately
    if (!isCacheStale(cache)) return cache.value;

    // Stale cache: trigger revalidation asynchronously in the background
    // (revalidate() will noop if already in progress)
    revalidate();

    // Return stale value immediately
    return cache.value;
  };

  // Warm up cache if requested
  if (fetchImmediately) {
    // Fire-and-forget
    readCache();
  }

  return readCache;
}
