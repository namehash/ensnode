import { describe, expect, it } from "vitest";
import { LruCache } from "./cache";

describe("LruCache", () => {
  it("throws Error if capacity is not an integer", () => {
    expect(() => {
      new LruCache<string>(1.5);
    }).toThrow();
  });

  it("throws Error if capacity < 0", () => {
    expect(() => {
      new LruCache<string>(-1);
    }).toThrow();
  });

  it("enforces capacity 0", () => {
    const lru = new LruCache<string>(0);

    lru.set("key1", "value");

    expect(lru.size).toBe(0);
    expect(lru.capacity).toBe(0);
    expect(lru.get("key1")).toBeUndefined();
  });

  it("enforces capacity 1", () => {
    const lru = new LruCache<string>(1);

    lru.set("key1", "value");
    lru.set("key2", "value");

    expect(lru.size).toBe(1);
    expect(lru.capacity).toBe(1);
    expect(lru.get("key1")).toBeUndefined();
    expect(lru.get("key2")).toBeDefined();
  });

  it("enforces capacity > 1", () => {
    const lru = new LruCache<string>(2);

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
    const lru = new LruCache<string>(2);

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
    const lru = new LruCache<string>(1);
    lru.set("key1", "value");
    lru.set("key2", "value");
    lru.clear();
    expect(lru.size).toBe(0);
    expect(lru.capacity).toBe(1);
    expect(lru.get("key1")).toBeUndefined();
    expect(lru.get("key2")).toBeUndefined();
  });
});
