import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { LruCache, SWRCache, TtlCache } from "./cache";

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
    vi.useFakeTimers({ shouldAdvanceTime: true, now: new Date(2024, 0, 1) });
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
