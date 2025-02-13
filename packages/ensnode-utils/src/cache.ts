export interface Cache<Key extends string, Value> {
  /**
   * Store a value in the cache with the given key.
   *
   * @param key Cache key
   * @param value Value to store
   */
  set(key: Key, value: Value): void;

  /**
   * Retrieve a value from the cache with the given key.
   *
   * @param key Cache key
   * @returns The cached value if it exists, otherwise undefined
   */
  get(key: Key): Value | undefined;

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
export class LruCache<ValueType> implements Cache<string, ValueType> {
  private readonly _cache = new Map<string, ValueType>();
  private readonly _capacity: number;

  public constructor(capacity: number) {
    if (capacity < 0)
      throw new Error(
        `LruCache requires capacity greater than 0 but capacity of ${capacity} requested.`,
      );

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
