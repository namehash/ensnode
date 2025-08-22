import { describe, expect, it, vi } from "vitest";
import { simpleMemoized } from "../src/lib/simple-memoized";

describe("simpleMemoized", () => {
  it("returns default value immediately on first call", () => {
    const fn = vi.fn().mockResolvedValue(42);
    const ttlMs = 50;
    const defaultValue = 0;
    const memoized = simpleMemoized(fn, ttlMs, defaultValue);

    // First call - should return default value immediately
    const v1 = memoized();
    expect(v1).toBe(defaultValue);

    // Second call - should still return default value (promise hasn't resolved yet)
    const v2 = memoized();
    expect(v2).toBe(defaultValue);

    // Underlying function should only be called once
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("returns cached value after promise resolves", async () => {
    const fn = vi.fn().mockResolvedValue(42);
    const ttlMs = 50;
    const defaultValue = 0;
    const memoized = simpleMemoized(fn, ttlMs, defaultValue);

    // First call returns default immediately
    const v1 = memoized();
    expect(v1).toBe(defaultValue);

    // Wait for background promise to resolve
    await new Promise((r) => setTimeout(r, 10));

    // Now returns actual cached value
    const v2 = memoized();
    expect(v2).toBe(42);

    // Subsequent calls return cached value immediately
    const v3 = memoized();
    expect(v3).toBe(42);

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("refreshes cache after ttlMs window expires", async () => {
    let resolveFirst: (value: number) => void;
    let resolveSecond: (value: number) => void;

    const firstPromise = new Promise<number>((resolve) => {
      resolveFirst = resolve;
    });
    const secondPromise = new Promise<number>((resolve) => {
      resolveSecond = resolve;
    });

    const fn = vi.fn().mockReturnValueOnce(firstPromise).mockReturnValueOnce(secondPromise);

    const ttlMs = 60;
    const defaultValue = 0;
    const memoized = simpleMemoized(fn, ttlMs, defaultValue);

    // First call - returns default value
    const v1 = memoized();
    expect(v1).toBe(defaultValue);
    expect(fn).toHaveBeenCalledTimes(1);

    // Resolve first promise
    resolveFirst!(1);
    await firstPromise;

    // Now returns cached value
    const v2 = memoized();
    expect(v2).toBe(1);
    expect(fn).toHaveBeenCalledTimes(1);

    // Wait exactly ttlMs to expire the cache
    await new Promise((r) => setTimeout(r, ttlMs + 1));

    // Should still return old value but trigger background refresh
    const v3 = memoized();
    expect(v3).toBe(1);
    expect(fn).toHaveBeenCalledTimes(2);

    // Resolve second promise
    resolveSecond!(2);
    await secondPromise;

    // Now returns new cached value
    const v4 = memoized();
    expect(v4).toBe(2);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("handles background refresh without blocking", async () => {
    const fn = vi.fn().mockResolvedValue(42);
    const ttlMs = 100;
    const defaultValue = 0;
    const memoized = simpleMemoized(fn, ttlMs, defaultValue);

    // First call returns default immediately
    const v1 = memoized();
    expect(v1).toBe(defaultValue);

    // Wait for background promise to resolve
    await new Promise((r) => setTimeout(r, 10));

    // Now returns actual value
    const v2 = memoized();
    expect(v2).toBe(42);

    // Subsequent calls return cached value immediately
    const v3 = memoized();
    expect(v3).toBe(42);
  });

  it("prevents duplicate requests during refresh", async () => {
    const fn = vi.fn().mockResolvedValue(42);
    const ttlMs = 30;
    const defaultValue = 0;
    const memoized = simpleMemoized(fn, ttlMs, defaultValue);

    // First call
    const v1 = memoized();
    expect(v1).toBe(defaultValue);

    // Wait for first promise to resolve
    await new Promise((r) => setTimeout(r, 10));
    const v2 = memoized();
    expect(v2).toBe(42);

    // Wait past ttlMs and call multiple times quickly
    await new Promise((r) => setTimeout(r, 35));
    const v3 = memoized();
    const v4 = memoized();
    const v5 = memoized();

    // All should return the same value
    expect(v3).toBe(42);
    expect(v4).toBe(42);
    expect(v5).toBe(42);

    // Should only have called the function twice (initial + one refresh)
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
