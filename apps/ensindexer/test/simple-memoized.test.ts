import { describe, expect, it, vi } from "vitest";
import { simpleMemoized } from "../src/lib/simple-memoized";

describe("simpleMemoized", () => {
  it("returns cached value immediately within ttlMs window", async () => {
    const fn = vi.fn().mockResolvedValue(42);
    const ttlMs = 50;
    const memoized = simpleMemoized(fn, ttlMs);

    // First call - should return default value immediately
    const v1 = memoized();
    expect(v1).toBeUndefined(); // No default value provided

    // Wait for promise to resolve
    await new Promise((r) => setTimeout(r, 10));

    // Second call - should return cached value immediately
    const v2 = memoized();
    expect(v2).toBe(42);

    // Underlying function should only be called once
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("returns default value on first call and cached value on subsequent calls", () => {
    const fn = vi.fn().mockResolvedValue(42);
    const ttlMs = 50;
    const defaultValue = { status: "loading" };
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

  it("refreshes cache after ttlMs window expires", async () => {
    const fn = vi.fn().mockResolvedValueOnce(1).mockResolvedValueOnce(2);
    const ttlMs = 30;
    const memoized = simpleMemoized(fn, ttlMs);

    // First call
    const v1 = memoized();
    expect(v1).toBeUndefined();

    // Wait for first promise to resolve
    await new Promise((r) => setTimeout(r, 10));
    const v2 = memoized();
    expect(v2).toBe(1);

    // Wait less than ttlMs, should still be cached
    await new Promise((r) => setTimeout(r, ttlMs - 10));
    const v3 = memoized();
    expect(v3).toBe(1);

    // Wait past ttlMs, should trigger new request
    await new Promise((r) => setTimeout(r, 15));
    const v4 = memoized();
    expect(v4).toBe(1); // Still returns old value immediately

    // Wait for new promise to resolve
    await new Promise((r) => setTimeout(r, 10));
    const v5 = memoized();
    expect(v5).toBe(2);

    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("handles background refresh without blocking", async () => {
    const fn = vi.fn().mockResolvedValue(42);
    const ttlMs = 100;
    const defaultValue = { status: "loading" };
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
});
