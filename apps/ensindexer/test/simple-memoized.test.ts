import { describe, expect, it, vi } from "vitest";
import { simpleMemoized } from "../src/lib/simple-memoized";

describe("simpleMemoized", () => {
  it("resolves the promise only once within ttlMs window", async () => {
    const fn = vi.fn().mockResolvedValue(42);
    const ttlMs = 50;
    const memoized = simpleMemoized(fn, ttlMs);

    // Call twice in quick succession
    const p1 = memoized();
    const p2 = memoized();

    // Both should resolve to the same value
    expect(await p1).toBe(42);
    expect(await p2).toBe(42);

    // Underlying function should only be called once
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("resolves the promise twice if requests occur outside ttlMs window", async () => {
    const fn = vi.fn().mockResolvedValueOnce(1).mockResolvedValueOnce(2);
    const ttlMs = 30;
    const memoized = simpleMemoized(fn, ttlMs);

    // First call
    const v1 = await memoized();
    expect(v1).toBe(1);

    // Wait less than ttlMs, should still be cached
    await new Promise((r) => setTimeout(r, ttlMs - 10));
    const v2 = await memoized();
    expect(v2).toBe(1);

    // Wait past ttlMs, should call again
    await new Promise((r) => setTimeout(r, 15));
    const v3 = await memoized();
    expect(v3).toBe(2);

    expect(fn).toHaveBeenCalledTimes(2);
  });
});
