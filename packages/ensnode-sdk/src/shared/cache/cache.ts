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
