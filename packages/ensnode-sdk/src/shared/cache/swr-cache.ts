import { secondsToMilliseconds } from "date-fns";
import { getUnixTime } from "date-fns/getUnixTime";

import { durationBetween } from "../datetime";
import type { Duration, UnixTimestamp } from "../types";

/**
 * Data structure for a single cached result.
 */
interface CachedResult<ValueType> {
  /**
   * The cached result of the fn, either its ValueType or Error.
   */
  result: ValueType | Error;

  /**
   * Unix timestamp indicating when the cached `result` was generated.
   */
  updatedAt: UnixTimestamp;
}

export interface SWRCacheOptions<ValueType> {
  /**
   * The async function generating a value of `ValueType` to wrap with SWR caching. It may throw an
   * Error type.
   */
  fn: () => Promise<ValueType>;

  /**
   * Time-to-live duration of a cached result in seconds. After this duration:
   * - the currently cached result is considered "stale" but is still retained in the cache
   *   until successfully replaced.
   * - Each time the cache is read, if the cached result is "stale" and no background
   *   revalidation attempt is already in progress, a new background revalidation
   *   attempt will be made.
   */
  ttl: Duration;

  /**
   * Optional time-to-proactively-revalidate duration in seconds. After a cached result is
   * initialized, and this duration has passed, attempts to asynchronously revalidate
   * the cached result will be proactively made in the background on this interval.
   */
  proactiveRevalidationInterval?: Duration;

  /**
   * Optional proactive initialization. Defaults to `false`.
   *
   * If `true`: The SWR cache will proactively initialize itself.
   * If `false`: The SWR cache will lazily wait to initialize itself until the first read.
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
 *   proactiveRevalidationInterval: 300 // proactively revalidate every 5 minutes
 * });
 *
 * // Returns cached data or waits for initial fetch
 * const data = await cache.read();
 *
 * if (data instanceof Error) { ... }
 * ```
 *
 * @link https://web.dev/stale-while-revalidate/
 * @link https://datatracker.ietf.org/doc/html/rfc5861
 */
export class SWRCache<ValueType> {
  private cache: CachedResult<ValueType> | null = null;
  private inProgressRevalidate: Promise<void> | null = null;
  private backgroundInterval: ReturnType<typeof setInterval> | null = null;

  constructor(private readonly options: SWRCacheOptions<ValueType>) {
    if (options.proactiveRevalidationInterval) {
      this.backgroundInterval = setInterval(
        () => this.revalidate(),
        secondsToMilliseconds(options.proactiveRevalidationInterval),
      );
    }

    if (options.proactivelyInitialize) this.revalidate();
  }

  private async revalidate() {
    // ensure that there is exactly one in progress revalidation promise
    if (!this.inProgressRevalidate) {
      this.inProgressRevalidate = this.options
        .fn()
        .then((result) => {
          // on success, always update the cache with the latest revalidation
          this.cache = {
            result,
            updatedAt: getUnixTime(new Date()),
          };
        })
        .catch((error) => {
          // on error, only update the cache if this is the first revalidation
          if (!this.cache) {
            this.cache = {
              // ensure thrown value is always an Error instance
              result: error instanceof Error ? error : new Error(String(error)),
              updatedAt: getUnixTime(new Date()),
            };
          }
        })
        .finally(() => {
          this.inProgressRevalidate = null;
        });
    }

    // provide it to the caller so that it may be awaited
    return this.inProgressRevalidate;
  }

  /**
   * Read the most recently cached result from the `SWRCache`.
   *
   * @returns a `ValueType` that was most recently successfully returned by `fn` or `Error` if `fn`
   * has never successfully returned.
   */
  public async read(): Promise<ValueType | Error> {
    // if no cache, populate the cache by awaiting revalidation
    if (!this.cache) await this.revalidate();

    // after any revalidation, this.cache is always set
    // NOTE: not documenting read() as throwable because this is just for typechecking
    if (!this.cache) throw new Error("never");

    // if ttl expired, revalidate in background
    if (durationBetween(this.cache.updatedAt, getUnixTime(new Date())) > this.options.ttl) {
      this.revalidate();
    }

    return this.cache.result;
  }

  /**
   * Destroys the background revalidation interval, if exists.
   */
  public destroy(): void {
    if (this.backgroundInterval) {
      clearInterval(this.backgroundInterval);
      this.backgroundInterval = null;
    }
  }
}
