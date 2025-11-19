import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { LruCache, staleWhileRevalidate, TtlCache } from "./cache";

describe("LruCache", () => {
  it("throws Error if capacity is not an integer", () => {
    expect(() => {
      new LruCache<string, string>(1.5);
    }).toThrow();
  });

  it("throws Error if capacity < 0", () => {
    expect(() => {
      new LruCache<string, string>(-1);
    }).toThrow();
  });

  it("enforces capacity 0", () => {
    const lru = new LruCache<string, string>(0);

    lru.set("key1", "value");

    expect(lru.size).toBe(0);
    expect(lru.capacity).toBe(0);
    expect(lru.get("key1")).toBeUndefined();
  });

  it("enforces capacity 1", () => {
    const lru = new LruCache<string, string>(1);

    lru.set("key1", "value");
    lru.set("key2", "value");

    expect(lru.size).toBe(1);
    expect(lru.capacity).toBe(1);
    expect(lru.get("key1")).toBeUndefined();
    expect(lru.get("key2")).toBeDefined();
  });

  it("enforces capacity > 1", () => {
    const lru = new LruCache<string, string>(2);

    lru.set("key1", "value");
    lru.set("key2", "value");
    lru.set("key3", "value");

    expect(lru.size).toBe(2);
    expect(lru.capacity).toBe(2);
    expect(lru.get("key1")).toBeUndefined();
    expect(lru.get("key2")).toBeDefined();
    expect(lru.get("key3")).toBeDefined();
  });

  it("remembers up to capacity most recently read keys", () => {
    const lru = new LruCache<string, string>(2);

    lru.set("key1", "value");
    lru.set("key2", "value");
    lru.get("key1");
    lru.set("key3", "value");

    expect(lru.size).toBe(2);
    expect(lru.capacity).toBe(2);
    expect(lru.get("key1")).toBeDefined();
    expect(lru.get("key2")).toBeUndefined();
    expect(lru.get("key3")).toBeDefined();
  });

  it("clears cached values", () => {
    const lru = new LruCache<string, string>(1);
    lru.set("key1", "value");
    lru.set("key2", "value");
    lru.clear();
    expect(lru.size).toBe(0);
    expect(lru.capacity).toBe(1);
    expect(lru.get("key1")).toBeUndefined();
    expect(lru.get("key2")).toBeUndefined();
  });
});

describe("TtlCache", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("stores and retrieves values within TTL", () => {
    const ttl = new TtlCache<string, string>(1); // 1 second

    ttl.set("key1", "value1");
    expect(ttl.get("key1")).toBe("value1");
    expect(ttl.size).toBe(1);
  });

  it("expires values after TTL", () => {
    const ttl = new TtlCache<string, string>(1); // 1 second

    ttl.set("key1", "value1");
    expect(ttl.get("key1")).toBe("value1");

    vi.advanceTimersByTime(1001); // Advance by 1001ms (1 second + 1ms)

    expect(ttl.get("key1")).toBeUndefined();
    expect(ttl.size).toBe(0);
  });

  it("has method returns true for existing non-expired values", () => {
    const ttl = new TtlCache<string, string>(1); // 1 second

    ttl.set("key1", "value1");
    expect(ttl.has("key1")).toBe(true);
  });

  it("has method returns false for non-existent keys", () => {
    const ttl = new TtlCache<string, string>(1); // 1 second

    expect(ttl.has("nonexistent")).toBe(false);
  });

  it("has method returns false for expired values", () => {
    const ttl = new TtlCache<string, string>(1); // 1 second

    ttl.set("key1", "value1");
    expect(ttl.has("key1")).toBe(true);

    vi.advanceTimersByTime(1001); // Advance by 1001ms (1 second + 1ms)

    expect(ttl.has("key1")).toBe(false);
    expect(ttl.size).toBe(0);
  });

  it("delete method removes values and returns true if key existed", () => {
    const ttl = new TtlCache<string, string>(1); // 1 second

    ttl.set("key1", "value1");
    expect(ttl.has("key1")).toBe(true);

    const deleted = ttl.delete("key1");
    expect(deleted).toBe(true);
    expect(ttl.has("key1")).toBe(false);
    expect(ttl.get("key1")).toBeUndefined();
    expect(ttl.size).toBe(0);
  });

  it("delete method returns false if key does not exist", () => {
    const ttl = new TtlCache<string, string>(1); // 1 second

    const deleted = ttl.delete("nonexistent");
    expect(deleted).toBe(false);
  });

  it("clears all cached values", () => {
    const ttl = new TtlCache<string, string>(1); // 1 second

    ttl.set("key1", "value1");
    ttl.set("key2", "value2");
    expect(ttl.size).toBe(2);

    ttl.clear();
    expect(ttl.size).toBe(0);
    expect(ttl.get("key1")).toBeUndefined();
    expect(ttl.get("key2")).toBeUndefined();
  });

  it("capacity returns MAX_SAFE_INTEGER", () => {
    const ttl = new TtlCache<string, string>(1); // 1 second
    expect(ttl.capacity).toBe(Number.MAX_SAFE_INTEGER);
  });

  it("automatically cleans up expired entries on size access", () => {
    const ttl = new TtlCache<string, string>(20); // 20 seconds

    ttl.set("key1", "value1");
    ttl.set("key2", "value2");
    expect(ttl.size).toBe(2);

    vi.advanceTimersByTime(10000); // Advance by 10000ms (10 seconds)
    ttl.set("key3", "value3");
    expect(ttl.size).toBe(3);

    vi.advanceTimersByTime(11000); // Advance by 11000ms (11 seconds) - total 21 seconds

    expect(ttl.size).toBe(1);
    expect(ttl.get("key1")).toBeUndefined();
    expect(ttl.get("key2")).toBeUndefined();
    expect(ttl.get("key3")).toBe("value3");
  });

  it("refreshes TTL on each set operation", () => {
    const ttl = new TtlCache<string, string>(20); // 20 seconds

    ttl.set("key1", "value1");

    vi.advanceTimersByTime(10000); // Advance by 10000ms (10 seconds)
    ttl.set("key1", "value1-updated");

    vi.advanceTimersByTime(10000); // Advance by 10000ms (10 seconds) - total 20 seconds from first set, 10 seconds from second set

    expect(ttl.get("key1")).toBe("value1-updated");
    expect(ttl.has("key1")).toBe(true);

    vi.advanceTimersByTime(11000); // Advance by 11000ms (11 seconds) - total 21 seconds from second set

    expect(ttl.get("key1")).toBeUndefined();
    expect(ttl.has("key1")).toBe(false);
  });
});

describe("staleWhileRevalidate", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("fetches data on first call", async () => {
    const fn = vi.fn(async () => "value1");
    const cached = staleWhileRevalidate(fn, 1); // 1 second

    const result = await cached();

    expect(result).toBe("value1");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("returns cached data within TTL without refetching", async () => {
    const fn = vi.fn(async () => "value1");
    const cached = staleWhileRevalidate(fn, 2); // 2 seconds

    await cached();
    vi.advanceTimersByTime(1000); // Advance by 1000ms (1 second)
    const result = await cached();

    expect(result).toBe("value1");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("returns stale data immediately after TTL expires", async () => {
    const fn = vi.fn(async () => "value1");
    const cached = staleWhileRevalidate(fn, 2); // 2 seconds

    await cached();
    vi.advanceTimersByTime(3000); // Advance by 3000ms (3 seconds) - stale after >2 seconds
    const result = await cached();

    expect(result).toBe("value1");
  });

  it("triggers background revalidation after TTL expires", async () => {
    let value = "value1";
    const fn = vi.fn(async () => value);
    const cached = staleWhileRevalidate(fn, 2); // 2 seconds

    await cached();
    expect(fn).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(3000); // Advance by 3000ms (3 seconds) - stale after >2 seconds
    value = "value2";

    // This should return stale data but trigger revalidation
    const result1 = await cached();
    expect(result1).toBe("value1");
    expect(fn).toHaveBeenCalledTimes(2);

    // Wait for revalidation to complete
    await vi.runAllTimersAsync();

    // Next call should have fresh data
    const result2 = await cached();
    expect(result2).toBe("value2");
  });

  it("does not trigger multiple revalidations concurrently", async () => {
    let resolveRevalidation: () => void;
    const revalidationPromise = new Promise<string>((resolve) => {
      resolveRevalidation = () => resolve("value2");
    });

    let callCount = 0;
    const fn = vi.fn(async () => {
      callCount++;
      if (callCount === 1) return "value1";
      return revalidationPromise;
    });

    const cached = staleWhileRevalidate(fn, 2); // 2 seconds

    await cached();
    vi.advanceTimersByTime(3000); // Advance by 3000ms (3 seconds) - stale after >2 seconds

    // Multiple calls after stale should not trigger multiple revalidations
    const promise1 = cached();
    const promise2 = cached();
    const promise3 = cached();

    const results = await Promise.all([promise1, promise2, promise3]);

    // All should return stale value
    expect(results).toEqual(["value1", "value1", "value1"]);

    // Should only call fn twice: once for initial, once for revalidation
    expect(fn).toHaveBeenCalledTimes(2);

    // Complete revalidation
    resolveRevalidation!();
    await vi.runAllTimersAsync();
  });

  it("serves stale data while revalidation is in progress", async () => {
    let resolveRevalidation: (value: string) => void;
    const revalidationPromise = new Promise<string>((resolve) => {
      resolveRevalidation = resolve;
    });

    let callCount = 0;
    const fn = vi.fn(async () => {
      callCount++;
      if (callCount === 1) return "value1";
      return revalidationPromise;
    });

    const cached = staleWhileRevalidate(fn, 2); // 2 seconds

    await cached();
    vi.advanceTimersByTime(3000); // Advance by 3000ms (3 seconds) - stale after >2 seconds

    // First call after TTL triggers revalidation
    const result1 = await cached();
    expect(result1).toBe("value1");

    // Additional calls while revalidating should still return stale
    const result2 = await cached();
    const result3 = await cached();

    expect(result2).toBe("value1");
    expect(result3).toBe("value1");
    expect(fn).toHaveBeenCalledTimes(2);

    // Complete revalidation
    resolveRevalidation!("value2");
    await vi.runAllTimersAsync();

    // Now should have fresh data
    const result4 = await cached();
    expect(result4).toBe("value2");
  });

  it("handles revalidation errors gracefully by keeping stale data", async () => {
    let shouldError = false;
    const fn = vi.fn(async () => {
      if (shouldError) {
        throw new Error("Revalidation failed");
      }
      return "value1";
    });

    const cached = staleWhileRevalidate(fn, 2); // 2 seconds

    await cached();
    vi.advanceTimersByTime(3000); // Advance by 3000ms (3 seconds) - stale after >2 seconds

    shouldError = true;

    // Should return stale data even though revalidation will fail
    const result1 = await cached();
    expect(result1).toBe("value1");

    // Wait for failed revalidation
    await vi.runAllTimersAsync();

    // Should still serve stale data
    const result2 = await cached();
    expect(result2).toBe("value1");

    // Should have attempted revalidation twice (once for each call after stale)
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("allows retry after failed revalidation", async () => {
    let shouldError = true;
    const fn = vi.fn(async () => {
      if (shouldError) {
        throw new Error("Revalidation failed");
      }
      return "value2";
    });

    const cached = staleWhileRevalidate(fn, 2); // 2 seconds

    // Initial fetch
    shouldError = false;
    await cached();

    vi.advanceTimersByTime(3000); // Advance by 3000ms (3 seconds) - stale after >2 seconds
    shouldError = true;

    // First revalidation attempt fails
    await cached();
    await vi.runAllTimersAsync();

    // Subsequent call should retry revalidation
    shouldError = false;
    await cached();
    await vi.runAllTimersAsync();

    // Should now have fresh data
    const result = await cached();
    expect(result).toBe("value2");
  });

  it("returns null when initial fetch fails with no cache", async () => {
    const fn = vi.fn(async () => {
      throw new Error("Initial fetch failed");
    });

    const cached = staleWhileRevalidate(fn, 1); // 1 second

    // Initial fetch should fail and return null
    const result = await cached();
    expect(result).toBeNull();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("succeeds on retry after initial fetch failure", async () => {
    let shouldError = true;
    const fn = vi.fn(async () => {
      if (shouldError) {
        throw new Error("Initial fetch failed");
      }
      return "value1";
    });

    const cached = staleWhileRevalidate(fn, 1); // 1 second

    // Initial fetch fails and returns null
    const result1 = await cached();
    expect(result1).toBeNull();
    expect(fn).toHaveBeenCalledTimes(1);

    // Retry should succeed
    shouldError = false;
    const result2 = await cached();
    expect(result2).toBe("value1");
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
