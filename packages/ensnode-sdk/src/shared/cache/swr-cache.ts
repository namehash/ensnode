import { secondsToMilliseconds } from "date-fns";
import { getUnixTime } from "date-fns/getUnixTime";

import { durationBetween } from "../datetime";
import type { Duration, UnixTimestamp } from "../types";

export interface CachedValue<ValueType> {
  value: ValueType;
  updatedAt: UnixTimestamp;
}

export interface SWRCacheOptions<ValueType> {
  fn: () => Promise<ValueType>;
  ttl: Duration;
  revalidationInterval?: Duration;
  proactivelyInitialize?: boolean;
}

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

  public async readCache(): Promise<CachedValue<ValueType> | null> {
    // if no cache, provide caller the in-flight revalidation
    if (!this.cache) return await this.revalidate();

    // if expired, revalidate in background
    if (durationBetween(this.cache.updatedAt, getUnixTime(new Date())) > this.options.ttl) {
      this.revalidate();
    }

    return this.cache;
  }

  public destroy(): void {
    if (this.backgroundInterval) {
      clearInterval(this.backgroundInterval);
      this.backgroundInterval = null;
    }
  }
}
