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
   *
   * On success:
   * - This function returns a value of type `ValueType` to store in the `SWRCache`.
   *
   * On error:
   * - This function throws an error and no changes will be made to the `SWRCache`.
   */
  fn: () => Promise<ValueType>;

  /**
   * Time-to-live duration in seconds. After this duration, data in the `SWRCache` is
   * considered stale but is still retained in the cache until successfully replaced with a new value.
   */
  ttl: Duration;

  /**
   * Optional time-to-proactively-revalidate duration in seconds. After this duration, automated attempts
   * to asynchronously revalidate the cached value will be made in the background.
   *
   * If defined:
   * - Proactive asynchronous revalidation attempts will be automatically triggered in the background
   *   on this interval.
   *
   * If undefined:
   * - Revalidation only occurs lazily when an explicit request for the cached value is
   *   made after the `ttl` duration of the latest successfully cached value expires.
   */
  revalidationInterval?: Duration;

  /**
   * Proactively initialize
   *
   * Optional. Defaults to `false`.
   *
   * If `true`:
   * - The SWR cache will proactively work to initialize itself, even before any explicit request to
   *    access the cached value is made.
   *
   * If `false`:
   * - The SWR cache will lazily wait to initialize itself only when one of the following occurs:
   *    - Background revalidation occurred (if requested); or
   *    - An explicit attempt to access the cached value is made.
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
 * - Automatic background updates (triggered lazily when new requests
 *   are made for the cached data or when the `revalidationInterval` is reached)
 *
 * @example
 * ```typescript
 * const fetchExpensiveData = async () => {
 *   const response = await fetch('/api/data');
 *   return response.json();
 * };
 *
 * const cache = new SWRCache({
 *   fn: fetchExpensiveData,
 *   ttl: 60, // 1 minute TTL
 *   revalidationInterval: 5 * 60 // proactive revalidation after 5 minutes from latest cache update
 * });
 *
 * // [T0: 0] First call: fetches data (slow)
 * const firstRead = await cache.readCache();
 *
 * // [T1: T0 + 59s] Within TTL: returns data cache at T0 (fast)
 * const secondRead = await cache.readCache();
 *
 * // [T2: T0 + 1m30s] After TTL: returns stale data that was cached at T0 immediately
 * // revalidates asynchronously in the background
 * const thirdRead = await cache.readCache(); // Still fast!
 *
 * // [T3: T2 + 90m] Background revalidation kicks in
 *
 * // [T4: T3 + 1m] Within TTL: returns data cache at T3 (fast)
 * const fourthRead = await cache.readCache(); // Still fast!
 *
 * // Please note how using `SWRCache` enabled action at T3 to happen.
 * // If no `revalidationInterval` value was set, the action at T3 would not happen.
 * // Therefore, the `fourthRead` would return stale data cached at T2.
 *
 * @link https://web.dev/stale-while-revalidate/
 * @link https://datatracker.ietf.org/doc/html/rfc5861
 */
export class SWRCache<ValueType> {
  private cache: CachedValue<ValueType> | null = null;

  /**
   * Optional promise of the current in-progress attempt to revalidate the `cache`.
   *
   * If null, no revalidation attempt is currently in progress.
   * If not null, identifies the revalidation attempt that is currently in progress.
   *
   * Used to enforce no concurrent revalidation attempts.
   */
  private inProgressRevalidate: Promise<CachedValue<ValueType> | null> | null = null;

  /**
   * Background revalidation ID
   *
   * If null, no background revalidation is scheduled.
   * If not null, identifies the scheduled for background revalidation.
   *
   * Used to enforce no concurrent background revalidation attempts.
   */
  private backgroundRevalidationId: ReturnType<typeof setTimeout> | null = null;

  /**
   * The callback function being managed by `BackgroundRevalidationScheduler`.
   *
   * If null, no background revalidation is scheduled.
   * If not null, identifies the background revalidation that is currently scheduled.
   *
   * Used to enforce no concurrent background revalidation attempts.
   */
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
   * Constructor optionally
   * - Schedules background revalidation.
   * - Proactively initializes cache.
   */
  public constructor(private readonly options: SWRCacheOptions<ValueType>) {
    if (options.revalidationInterval) {
      this.backgroundRevalidationId = setInterval(
        () => this.revalidate(),
        secondsToMilliseconds(options.revalidationInterval),
      );
    }

    if (options.proactivelyInitialize) this.revalidate();
  }

  /**
   * Read the most recently cached `CachedValue` from the `SWRCache`.
   *
   * @returns a `CachedValue` holding a `value` of `ValueType` that was most recently successfully returned by `fn`
   *          or `null` if `fn` has never successfully returned and has always thrown an error,
   */
  public readCache = async (): Promise<CachedValue<ValueType> | null> => {
    // if no cache, provide caller the in-flight revalidation
    if (!this.cache) return await this.revalidate();

    // if expired, revalidate in background
    if (durationBetween(this.cache.updatedAt, getUnixTime(new Date())) > this.options.ttl) {
      this.revalidate();
    }

    return this.cache;
  };

  /**
   * Clean up background resources. Call this when the cache is no longer needed
   * to prevent memory leaks.
   */
  public destroy(): void {
    if (this.backgroundRevalidationId) {
      clearInterval(this.backgroundRevalidationId);
      this.backgroundRevalidationId = null;
    }
  }
}
