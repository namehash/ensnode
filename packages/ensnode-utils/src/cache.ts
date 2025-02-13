import { PriorityQueue } from "./queue";

export interface ICache<Key extends string, Value> {
  /**
   * Store a value in the cache with the given key
   * @param key Cache key
   * @param value Value to store
   */
  set(key: Key, value: Value): void;

  /**
   * Retrieve a value from the cache
   * @param key Cache key
   * @returns The stored value if exists and not expired, undefined otherwise
   */
  get(key: Key): Value | undefined;

  /**
   * Clean up resources and clear the cache
   */
  dispose(): void;
}

type Timestamp = number;

export class MemoryCache<Key extends string, Value> implements ICache<Key, Value> {
  private cache = new Map<Key, { value: Value; timestamp: Timestamp }>();
  private expiryQueue = new ExpiryQueue<Timestamp, Key>();
  private cleanupTimer: number;

  constructor(
    private readonly ttl: number = 1 * 1000,
    cleanupInterval: number = 5 * 1000,
  ) {
    this.cleanupTimer = setInterval(() => this.cleanup(), cleanupInterval) as unknown as number;
  }

  set(key: Key, value: Value): void {
    const timestamp = Date.now() as Timestamp;
    this.cache.set(key, { value, timestamp });
    this.expiryQueue.push(timestamp, key);
  }

  get(key: Key): Value | undefined {
    if (!this.cache.has(key)) {
      return undefined;
    }

    const entry = this.cache.get(key)!;

    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return undefined;
    }

    return entry.value;
  }

  private cleanup(): void {
    const now = Date.now();
    while (true) {
      const oldest = this.expiryQueue.peek();
      if (!oldest || now - oldest[0] <= this.ttl) break;

      this.expiryQueue.pop();
      // Only delete if the key in cache still has the same timestamp
      const entry = this.cache.get(oldest[1]);
      if (entry && entry.timestamp === oldest[0]) {
        this.cache.delete(oldest[1]);
      }
    }
  }

  dispose(): void {
    clearInterval(this.cleanupTimer);
    this.cache.clear();
  }
}

export class ExpiryQueue<Timestamp extends number, Key> {
  private queue: PriorityQueue<Timestamp, Key>;

  constructor() {
    // Sort by timestamp in ascending order
    this.queue = new PriorityQueue((a, b) => a[0] - b[0]);
  }

  push(timestamp: Timestamp, key: Key): void {
    this.queue.push([timestamp, key]);
  }

  peek(): [Timestamp, Key] | undefined {
    return this.queue.peek();
  }

  pop(): [Timestamp, Key] | undefined {
    return this.queue.pop();
  }
}
