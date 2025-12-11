import { secondsToMilliseconds } from "date-fns";
import { getUnixTime } from "date-fns/getUnixTime";

import { durationBetween } from "../datetime";
import type { Duration, UnixTimestamp } from "../types";

/**
 * Data structure for a single cached value.
 */
export interface CachedValue<ValueType> {
  /**
   * The cached value of type ValueType.
   */
  value: ValueType;

  /**
   * Unix timestamp indicating when the cached `value` was generated.
   */
  updatedAt: UnixTimestamp;
}

export interface SWRCacheOptions<ValueType> {
  /**
   * The async function generating a value of `ValueType` to wrap with SWR caching.
   */
  fn: () => Promise<ValueType>;

  /**
   * Time-to-live duration in seconds. After this duration, data in the `SWRCache` is
   * considered stale but is still retained in the cache until successfully replaced.
   */
  ttl: Duration;

  /**
   * Optional time-to-proactively-revalidate duration in seconds. After this duration,
   * automated attempts to asynchronously revalidate the cached value will be made
   * in the background on this interval.
   */
  revalidationInterval?: Duration;

  /**
   * Optional proactive initialization. Defaults to `false`.
   *
   * If `true`: The SWR cache will proactively initialize itself.
   * If `false`: The SWR cache will lazily wait to initialize.
   */
  proactivelyInitialize?: boolean;
}

/**
 * Stale-While-Revalidate (SWR) cache for async functions.
 *
 * This caching strategy serves cached data immediately (even if stale) while
 * asynchronously revalidating the cache in the background. This provides:
 * - Sub-millisecond response times (after first fetch)
 * - Always available data (serves stale data during revalidation)
 * - Automatic background updates via configurable intervals
 *
 * @example
 * ```typescript
 * const cache = new SWRCache({
 *   fn: async () => fetch('/api/data').then(r => r.json()),
 *   ttl: 60, // 1 minute TTL
 *   revalidationInterval: 300 // revalidate every 5 minutes
 * });
 *
 * // Returns cached data or waits for initial fetch
 * const data = await cache.readCache();
 * ```
 *
 * @link https://web.dev/stale-while-revalidate/
 * @link https://datatracker.ietf.org/doc/html/rfc5861
 */
export class SWRCache<ValueType> {
  private cache: CachedValue<ValueType> | null = null;
  private inProgressRevalidate: Promise<CachedValue<ValueType> | null> | null = null;
  private backgroundInterval: NodeJS.Timeout | null = null;

  constructor(private readonly options: SWRCacheOptions<ValueType>) {
    if (options.revalidationInterval) {
      this.backgroundInterval = setInterval(
        () => this.revalidate(),
        secondsToMilliseconds(options.revalidationInterval),
      );
    }

    if (options.proactivelyInitialize) this.revalidate();
  }

  private async revalidate(): Promise<CachedValue<ValueType> | null> {
    if (!this.inProgressRevalidate) {
      this.inProgressRevalidate = this.options
        .fn()
        .then((value) => {
          this.cache = {
            value,
            updatedAt: getUnixTime(new Date()),
          };
          return this.cache;
        })
        .catch(() => null)
        .finally(() => {
          this.inProgressRevalidate = null;
        });
    }

    return this.inProgressRevalidate;
  }

  /**
   * Read the most recently cached `CachedValue` from the `SWRCache`.
   *
   * @returns a `CachedValue` holding a `value` of `ValueType` that was most recently
   *          successfully returned by `fn` or `null` if `fn` has never successfully returned.
   */
  public async readCache(): Promise<CachedValue<ValueType> | null> {
    // if no cache, provide caller the in-flight revalidation
    if (!this.cache) return await this.revalidate();

    // if expired, revalidate in background
    if (durationBetween(this.cache.updatedAt, getUnixTime(new Date())) > this.options.ttl) {
      this.revalidate();
    }

    return this.cache;
  }

  /**
   * Clean up background resources. Call this when the cache is no longer needed
   * to prevent memory leaks.
   */
  public destroy(): void {
    if (this.backgroundInterval) {
      clearInterval(this.backgroundInterval);
      this.backgroundInterval = null;
    }
  }
}
