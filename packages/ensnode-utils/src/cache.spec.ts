import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { type ICache, MemoryCache, ExpiryQueue } from "./cache";

describe("MemoryCache", () => {
  let cache: ICache<string, string>;

  beforeEach(() => {
    vi.useFakeTimers();
    cache = new MemoryCache(1000); // 1 second TTL for testing
  });

  afterEach(() => {
    vi.restoreAllMocks();
    cache.dispose();
  });

  it("should store and retrieve values", () => {
    cache.set("key1", "value1");
    expect(cache.get("key1")).toBe("value1");
  });

  it("should return undefined for non-existent keys", () => {
    expect(cache.get("nonexistent")).toBeUndefined();
  });

  it("should expire items after TTL", () => {
    cache.set("key1", "value1");
    expect(cache.get("key1")).toBe("value1");

    // Advance time past TTL
    vi.advanceTimersByTime(1100);
    expect(cache.get("key1")).toBeUndefined();
  });

  it("should not expire items before TTL", () => {
    cache.set("key1", "value1");

    // Advance time just before TTL
    vi.advanceTimersByTime(900);
    expect(cache.get("key1")).toBe("value1");
  });

  it("should clean up expired items during cleanup interval", () => {
    cache.set("key1", "value1");
    cache.set("key2", "value2");

    // Advance time past TTL
    vi.advanceTimersByTime(1100);

    // Trigger cleanup interval
    vi.advanceTimersByTime(60000);

    // Both items should be cleaned up
    expect(cache.get("key1")).toBeUndefined();
    expect(cache.get("key2")).toBeUndefined();
  });

  it("should handle multiple sets of the same key", () => {
    cache.set("key1", "value1");
    cache.set("key1", "value2");
    expect(cache.get("key1")).toBe("value2");
  });

  it("should handle cleanup of mixed expired and non-expired items", () => {
    cache.set("key1", "value1");

    // Advance time halfway
    vi.advanceTimersByTime(500);

    cache.set("key2", "value2");

    // Advance time to expire only key1
    vi.advanceTimersByTime(600);

    expect(cache.get("key1")).toBeUndefined();
    expect(cache.get("key2")).toBe("value2");
  });

  describe("disposal", () => {
    it("should clear timer and cache on dispose", () => {
      const clearIntervalSpy = vi.spyOn(global, "clearInterval");

      cache.set("key1", "value1");
      cache.dispose();

      expect(clearIntervalSpy).toHaveBeenCalled();
      expect(cache.get("key1")).toBeUndefined();
    });
  });

  describe("performance", () => {
    it("should handle large number of items efficiently", () => {
      const items = 20000;
      const operations: number[] = [];

      // Measure set operations
      for (let i = 0; i < items; i++) {
        const start = performance.now();
        cache.set(`key${i}`, `value${i}`);
        operations.push(performance.now() - start);
      }

      // Advance time to expire first half
      vi.advanceTimersByTime(1100);

      // Measure cleanup impact on get operations
      for (let i = 0; i < items; i++) {
        const start = performance.now();
        cache.get(`key${i}`);
        operations.push(performance.now() - start);
      }

      // Calculate average operation time
      const avgOperationTime =
        operations.reduce((a, b) => a + b, 0) / operations.length;
      expect(avgOperationTime).toBeLessThan(1); // Each operation should take less than 1ms

      // Verify heap operations are O(log n)
      const maxOperationTime = Math.max(...operations);
      expect(maxOperationTime).toBeLessThan(Math.log2(items)); // Should be logarithmic
    });
  });
});

describe("ExpiryQueue", () => {
  let queue: ExpiryQueue<number, string>;

  beforeEach(() => {
    queue = new ExpiryQueue();
  });

  it("should push and pop items", () => {
    queue.push(1000, "key1");
    queue.push(2000, "key2");

    expect(queue.pop()).toEqual([1000, "key1"]);
    expect(queue.pop()).toEqual([2000, "key2"]);
  });

  it("should peek at the next item", () => {
    queue.push(1000, "key1");
    queue.push(2000, "key2");

    expect(queue.peek()).toEqual([1000, "key1"]);
    expect(queue.peek()).toEqual([1000, "key1"]);
  });

  it("should return undefined when empty", () => {
    expect(queue.pop()).toBeUndefined();
    expect(queue.peek()).toBeUndefined();
  });

  it("should handle multiple items", () => {
    queue.push(1000, "key1");
    queue.push(2000, "key2");
    queue.push(500, "key3");

    expect(queue.pop()).toEqual([500, "key3"]);
    expect(queue.pop()).toEqual([1000, "key1"]);
    expect(queue.pop()).toEqual([2000, "key2"]);
  });
});
