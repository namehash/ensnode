import { getUnixTime } from "date-fns/getUnixTime";

import { durationBetween } from "../datetime";
import type { Duration, UnixTimestamp } from "../types";

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
