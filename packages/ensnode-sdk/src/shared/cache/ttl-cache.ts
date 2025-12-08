import { getUnixTime } from "date-fns/getUnixTime";

import { addDuration } from "../datetime";
import type { Duration, UnixTimestamp } from "../types";
import type { Cache } from "./cache";

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
