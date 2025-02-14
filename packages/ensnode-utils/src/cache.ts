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
   * @param capacity The maximum number of items in the cache.
   * @throws Error if capacity is not an integer or is negative.
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
