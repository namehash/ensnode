import { secondsToMilliseconds } from "date-fns";
import { getUnixTime } from "date-fns/getUnixTime";

import { durationBetween } from "../datetime";
import type { Duration, UnixTimestamp } from "../types";
import { BackgroundRevalidationScheduler } from "./background-revalidation-scheduler";

// Singleton instance of the background revalidation scheduler
const bgRevalidationScheduler = new BackgroundRevalidationScheduler();

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
 * const cache = await SWRCache.create({
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
  public readonly options: SWRCacheOptions<ValueType>;
  private cache: CachedValue<ValueType> | null;

  /**
   * Optional promise of the current in-progress attempt to revalidate the `cache`.
   *
   * If null, no revalidation attempt is currently in progress.
   * If not null, identifies the revalidation attempt that is currently in progress.
   *
   * Used to enforce no concurrent revalidation attempts.
   */
  private inProgressRevalidate: Promise<CachedValue<ValueType> | null> | null;

  /**
   * The callback function being managed by `BackgroundRevalidationScheduler`.
   *
   * If null, no background revalidation is scheduled.
   * If not null, identifies the background revalidation that is currently scheduled.
   *
   * Used to enforce no concurrent background revalidation attempts.
   */
  private scheduledBackgroundRevalidate: (() => Promise<void>) | null;

  private constructor(options: SWRCacheOptions<ValueType>) {
    this.cache = null;
    this.inProgressRevalidate = null;
    this.scheduledBackgroundRevalidate = null;
    this.options = options;
  }

  /**
   * Asynchronously create a new `SWRCache` instance.
   *
   * @param options - The {@link SWRCacheOptions} for the SWR cache.
   * @returns a new `SWRCache` instance.
   */
  public static async create<ValueType>(
    options: SWRCacheOptions<ValueType>,
  ): Promise<SWRCache<ValueType>> {
    const cache = new SWRCache<ValueType>(options);
    if (cache.options.proactivelyInitialize) {
      // fire and forget
      cache.readCache();
    }
    return cache;
  }

  private revalidate = async (): Promise<CachedValue<ValueType> | null> => {
    if (this.inProgressRevalidate) {
      // An in-progress revalidation attempt is already in progress.
      // Enforce no concurrent invocations of `fn` by a `SWRCacheManager` instance.
      // Return the in-progress revalidation attempt.
      return this.inProgressRevalidate;
    }

    return this.options
      .fn() // Invoke the function attempting to generate a new value
      .then((value) => {
        // `fn` successfully returned `value`.

        // Update `this.cache` with the new `CachedValue`
        this.cache = {
          value,
          updatedAt: getUnixTime(new Date()),
        };

        return this.cache;
      })
      .catch(() => {
        // `fn` threw an error.
        // Swallow the error.
        // Make no changes to `this.cache`.
        // return null to indicate that no new value was generated.
        return null;
      })
      .finally(() => {
        // Clear `this.inProgressRevalidation` so that a new revalidate attempt may be started.
        this.inProgressRevalidate = null;

        if (this.options.revalidationInterval === undefined) {
          // No revalidation interval means no background revalidation, so work is done.
          return;
        }

        if (this.scheduledBackgroundRevalidate) {
          // Cancel the existing background revalidation scheduled task
          bgRevalidationScheduler.cancel(this.scheduledBackgroundRevalidate);
        }

        const backgroundRevalidate = async (): Promise<void> => {
          this.revalidate();
          // return void
        };

        this.scheduledBackgroundRevalidate = bgRevalidationScheduler.schedule({
          revalidate: backgroundRevalidate,
          interval: secondsToMilliseconds(this.options.revalidationInterval),
        });
      });
  };

  /**
   * Read the most recently cached `CachedValue` from the `SWRCache`.
   *
   * @returns a `CachedValue` holding a `value` of `ValueType` that was most recently successfully returned by `fn`
   *          or `null` if `fn` has never successfully returned and has always thrown an error,
   */
  public readCache = async (): Promise<CachedValue<ValueType> | null> => {
    if (!this.cache) {
      // No cache.
      // Attempt initialization of the cache.
      this.inProgressRevalidate = this.revalidate();
      return this.inProgressRevalidate;
    }

    if (durationBetween(this.cache.updatedAt, getUnixTime(new Date())) <= this.options.ttl) {
      // fresh cache, return immediately
      return this.cache;
    }

    // stale cache
    if (!this.inProgressRevalidate) {
      // no in progress revalidation, trigger revalidation asynchronously in the background
      this.inProgressRevalidate = this.revalidate();
    }

    // return stale cached value immediately
    return this.cache;
  };
}
