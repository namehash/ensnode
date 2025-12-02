import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SWRCache } from "./swr-cache";

describe("staleWhileRevalidate", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("fetches data without waiting for the first call when warmup was requested", async () => {
    const fn = vi.fn(async () => "value1");
    const cache = await SWRCache.create({
      fn,
      ttl: 1, // 1 second
      proactivelyInitialize: true,
    });

    // Fetch happened immediately
    expect(fn).toHaveBeenCalledTimes(1);

    const result = await cache.readCache();

    expect(result?.value).toBe("value1");
    expect(fn).toHaveBeenCalledTimes(1); // No extra fetch required for the first read
  });

  it("fetches data on first call", async () => {
    const fn = vi.fn(async () => "value1");
    const cache = await SWRCache.create({
      fn,
      ttl: 1,
    }); // 1 second

    const result = await cache.readCache();

    expect(result?.value).toBe("value1");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("returns cached data within TTL without refetching", async () => {
    const fn = vi.fn(async () => "value1");
    const cache = await SWRCache.create({
      fn,
      ttl: 2,
    }); // 2 seconds

    await cache.readCache();
    vi.advanceTimersByTime(1000); // Advance by 1000ms (1 second)
    const result = await cache.readCache();

    expect(result?.value).toBe("value1");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("returns stale data immediately after TTL expires", async () => {
    const fn = vi.fn(async () => "value1");
    const cache = await SWRCache.create({
      fn,
      ttl: 2,
    }); // 2 seconds

    await cache.readCache();
    vi.advanceTimersByTime(3000); // Advance by 3000ms (3 seconds) - stale after >2 seconds
    const result = await cache.readCache();

    expect(result?.value).toBe("value1");
  });

  it("triggers background revalidation after TTL expires", async () => {
    let value = "value1";
    const fn = vi.fn(async () => value);
    const cache = await SWRCache.create({
      fn,
      ttl: 2,
    }); // 2 seconds

    await cache.readCache();
    expect(fn).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(3000); // Advance by 3000ms (3 seconds) - stale after >2 seconds
    value = "value2";

    // This should return stale data but trigger revalidation
    const result1 = await cache.readCache();
    expect(result1?.value).toBe("value1");
    expect(fn).toHaveBeenCalledTimes(2);

    // Wait for revalidation to complete
    await vi.runAllTimersAsync();

    // Next call should have fresh data
    const result2 = await cache.readCache();
    expect(result2?.value).toBe("value2");
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

    const cache = await SWRCache.create({
      fn,
      ttl: 2,
    }); // 2 seconds

    await cache.readCache();
    vi.advanceTimersByTime(3000); // Advance by 3000ms (3 seconds) - stale after >2 seconds

    // Multiple calls after stale should not trigger multiple revalidations
    const promise1 = cache.readCache();
    const promise2 = cache.readCache();
    const promise3 = cache.readCache();

    const results = await Promise.all([promise1, promise2, promise3]).then((results) =>
      results.map((result) => result?.value),
    );

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

    const cache = await SWRCache.create({
      fn,
      ttl: 2,
    }); // 2 seconds

    await cache.readCache();
    vi.advanceTimersByTime(3000); // Advance by 3000ms (3 seconds) - stale after >2 seconds

    // First call after TTL triggers revalidation
    const result1 = await cache.readCache();
    expect(result1?.value).toBe("value1");

    // Additional calls while revalidating should still return stale
    const result2 = await cache.readCache();
    const result3 = await cache.readCache();

    expect(result2?.value).toBe("value1");
    expect(result3?.value).toBe("value1");
    expect(fn).toHaveBeenCalledTimes(2);

    // Complete revalidation
    resolveRevalidation!("value2");
    await vi.runAllTimersAsync();

    // Now should have fresh data
    const result4 = await cache.readCache();
    expect(result4?.value).toBe("value2");
  });

  it("handles revalidation errors gracefully by keeping stale data", async () => {
    let shouldError = false;
    const fn = vi.fn(async () => {
      if (shouldError) {
        throw new Error("Revalidation failed");
      }
      return "value1";
    });

    const cache = await SWRCache.create({
      fn,
      ttl: 2,
    }); // 2 seconds

    await cache.readCache();
    vi.advanceTimersByTime(3000); // Advance by 3000ms (3 seconds) - stale after >2 seconds

    shouldError = true;

    // Should return stale data even though revalidation will fail
    const result1 = await cache.readCache();
    expect(result1?.value).toBe("value1");

    // Wait for failed revalidation
    await vi.runAllTimersAsync();

    // Should still serve stale data
    const result2 = await cache.readCache();
    expect(result2?.value).toBe("value1");

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

    const cache = await SWRCache.create({ fn, ttl: 2 }); // 2 seconds

    // Initial fetch
    shouldError = false;
    await cache.readCache();

    vi.advanceTimersByTime(3000); // Advance by 3000ms (3 seconds) - stale after >2 seconds
    shouldError = true;

    // First revalidation attempt fails
    await cache.readCache();
    await vi.runAllTimersAsync();

    // Subsequent call should retry revalidation
    shouldError = false;
    await cache.readCache();
    await vi.runAllTimersAsync();

    // Should now have fresh data
    const result = await cache.readCache();
    expect(result?.value).toBe("value2");
  });

  describe("on fetched callbacks", () => {
    it("returns null when initial fetch fails with no cache", async () => {
      const fn = vi.fn(async () => {
        throw new Error("Initial fetch failed");
      });

      const cache = await SWRCache.create({ fn, ttl: 1 }); // 1 second

      // Initial fetch should fail and return null
      const result = await cache.readCache();
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

      const cache = await SWRCache.create({ fn, ttl: 1 }); // 1 second

      // Initial fetch fails and returns null
      const result1 = await cache.readCache();
      expect(result1).toBeNull();
      expect(fn).toHaveBeenCalledTimes(1);

      // Retry should succeed
      shouldError = false;
      const result2 = await cache.readCache();
      expect(result2?.value).toBe("value1");
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  describe("proactively initialize", () => {
    it("initializes the cache proactively", async () => {
      const fn = vi.fn(async () => "value1");
      await SWRCache.create({ fn, ttl: 1, proactivelyInitialize: true }); // 1 second

      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("does not initialize the cache proactively", async () => {
      const fn = vi.fn(async () => "value1");
      const cache = await SWRCache.create({ fn, ttl: 1, proactivelyInitialize: false }); // 1 second

      expect(fn).toHaveBeenCalledTimes(0);

      await cache.readCache();
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });
});
