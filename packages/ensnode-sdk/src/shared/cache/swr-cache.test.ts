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
    const cache = new SWRCache({
      fn,
      ttl: 1, // 1 second
      proactivelyInitialize: true,
    });

    // Fetch happened immediately
    expect(fn).toHaveBeenCalledTimes(1);

    const result = await cache.read();

    expect(result).toBe("value1");
    expect(fn).toHaveBeenCalledTimes(1); // No extra fetch required for the first read
  });

  it("fetches data on first call", async () => {
    const fn = vi.fn(async () => "value1");
    const cache = new SWRCache({
      fn,
      ttl: 1,
    }); // 1 second

    const result = await cache.read();

    expect(result).toBe("value1");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("returns cached data within TTL without refetching", async () => {
    const fn = vi.fn(async () => "value1");
    const cache = new SWRCache({
      fn,
      ttl: 2,
    }); // 2 seconds

    await cache.read();
    vi.advanceTimersByTime(1000); // Advance by 1000ms (1 second)
    const result = await cache.read();

    expect(result).toBe("value1");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("returns stale data immediately after TTL expires", async () => {
    const fn = vi.fn(async () => "value1");
    const cache = new SWRCache({
      fn,
      ttl: 2,
    }); // 2 seconds

    await cache.read();
    vi.advanceTimersByTime(3000); // Advance by 3000ms (3 seconds) - stale after >2 seconds
    const result = await cache.read();

    expect(result).toBe("value1");
  });

  it("triggers background revalidation after TTL expires", async () => {
    let value = "value1";
    const fn = vi.fn(async () => value);
    const cache = new SWRCache({
      fn,
      ttl: 2,
    }); // 2 seconds

    await cache.read();
    expect(fn).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(3000); // Advance by 3000ms (3 seconds) - stale after >2 seconds
    value = "value2";

    // This should return stale data but trigger revalidation
    const result1 = await cache.read();
    expect(result1).toBe("value1");
    expect(fn).toHaveBeenCalledTimes(2);

    // Wait for revalidation to complete
    await vi.runAllTimersAsync();

    // Next call should have fresh data
    const result2 = await cache.read();
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

    const cache = new SWRCache({
      fn,
      ttl: 2,
    }); // 2 seconds

    await cache.read();
    vi.advanceTimersByTime(3000); // Advance by 3000ms (3 seconds) - stale after >2 seconds

    // Multiple calls after stale should not trigger multiple revalidations
    const promise1 = cache.read();
    const promise2 = cache.read();
    const promise3 = cache.read();

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

    const cache = new SWRCache({
      fn,
      ttl: 2,
    }); // 2 seconds

    await cache.read();
    vi.advanceTimersByTime(3000); // Advance by 3000ms (3 seconds) - stale after >2 seconds

    // First call after TTL triggers revalidation
    const result1 = await cache.read();
    expect(result1).toBe("value1");

    // Additional calls while revalidating should still return stale
    const result2 = await cache.read();
    const result3 = await cache.read();

    expect(result2).toBe("value1");
    expect(result3).toBe("value1");
    expect(fn).toHaveBeenCalledTimes(2);

    // Complete revalidation
    resolveRevalidation!("value2");
    await vi.runAllTimersAsync();

    // Now should have fresh data
    const result4 = await cache.read();
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

    const cache = new SWRCache({
      fn,
      ttl: 2,
    }); // 2 seconds

    await cache.read();
    vi.advanceTimersByTime(3000); // Advance by 3000ms (3 seconds) - stale after >2 seconds

    shouldError = true;

    // Should return stale data even though revalidation will fail
    const result1 = await cache.read();
    expect(result1).toBe("value1");

    // Wait for failed revalidation
    await vi.runAllTimersAsync();

    // Should still serve stale data
    const result2 = await cache.read();
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

    const cache = new SWRCache({ fn, ttl: 2 }); // 2 seconds

    // Initial fetch
    shouldError = false;
    await cache.read();

    vi.advanceTimersByTime(3000); // Advance by 3000ms (3 seconds) - stale after >2 seconds
    shouldError = true;

    // First revalidation attempt fails
    await cache.read();
    await vi.runAllTimersAsync();

    // Subsequent call should retry revalidation
    shouldError = false;
    await cache.read();
    await vi.runAllTimersAsync();

    // Should now have fresh data
    const result = await cache.read();
    expect(result).toBe("value2");
  });

  describe("on fetched callbacks", () => {
    it("returns null when initial fetch fails with no cache", async () => {
      const fn = vi.fn(async () => {
        throw new Error("Initial fetch failed");
      });

      const cache = new SWRCache({ fn, ttl: 1 }); // 1 second

      // Initial fetch should fail and return Error
      const result = await cache.read();
      expect(result).toBeInstanceOf(Error);
      expect((result as Error).message).toBe("Initial fetch failed");
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

      const cache = new SWRCache({ fn, ttl: 1 }); // 1 second

      // Initial fetch fails and returns Error
      const result1 = await cache.read();
      expect(result1).toBeInstanceOf(Error);
      expect((result1 as Error).message).toBe("Initial fetch failed");
      expect(fn).toHaveBeenCalledTimes(1);

      // Advance time past TTL to make cached error expire
      vi.advanceTimersByTime(3000); // 3 seconds > 1 second TTL

      // Retry should succeed
      shouldError = false;

      // First call after expiry returns stale error but triggers revalidation
      const result2 = await cache.read();
      expect(result2).toBeInstanceOf(Error); // Still returns cached error
      expect(fn).toHaveBeenCalledTimes(2);

      // Wait for revalidation to complete
      await vi.runAllTimersAsync();

      // Now subsequent read should return the fresh value
      const result3 = await cache.read();
      expect(result3).toBe("value1");
      expect(fn).toHaveBeenCalledTimes(2); // No additional call needed
    });

    it("converts non-Error thrown values to Error instances", async () => {
      const fn = vi.fn(async () => {
        throw "string error"; // Throw a string instead of Error
      });

      const cache = new SWRCache({ fn, ttl: 1 });

      const result = await cache.read();
      expect(result).toBeInstanceOf(Error);
      expect((result as Error).message).toBe("string error");
    });

    it("converts null/undefined thrown values to Error instances", async () => {
      const fn = vi.fn(async () => {
        throw null; // Throw null
      });

      const cache = new SWRCache({ fn, ttl: 1 });

      const result = await cache.read();
      expect(result).toBeInstanceOf(Error);
      expect((result as Error).message).toBe("null");
    });

    it("converts object thrown values to Error instances", async () => {
      const thrownObject = { code: 500, message: "Server error" };
      const fn = vi.fn(async () => {
        throw thrownObject;
      });

      const cache = new SWRCache({ fn, ttl: 1 });

      const result = await cache.read();
      expect(result).toBeInstanceOf(Error);
      expect((result as Error).message).toBe("[object Object]");
    });

    it("returns the same Error instance across multiple reads", async () => {
      const error = new Error("Persistent error");
      const fn = vi.fn(async () => {
        throw error;
      });

      const cache = new SWRCache({ fn, ttl: 2 }); // 2 seconds

      const result1 = await cache.read();
      const result2 = await cache.read();

      expect(result1).toBe(error);
      expect(result2).toBe(error);
      expect(result1).toBe(result2); // Same instance
      expect(fn).toHaveBeenCalledTimes(1); // Only called once initially
    });

    it("preserves custom error classes and properties", async () => {
      class CustomError extends Error {
        constructor(
          message: string,
          public code: number,
          public details: object,
        ) {
          super(message);
          this.name = "CustomError";
        }
      }

      const customError = new CustomError("Custom error message", 500, { key: "value" });
      const fn = vi.fn(async () => {
        throw customError;
      });

      const cache = new SWRCache({ fn, ttl: 1 });

      const result = await cache.read();
      expect(result).toBe(customError); // Same instance
      expect(result).toBeInstanceOf(CustomError);
      expect((result as CustomError).code).toBe(500);
      expect((result as CustomError).details).toEqual({ key: "value" });
      expect((result as Error).message).toBe("Custom error message");
    });

    it("handles multiple concurrent reads when initial fetch fails", async () => {
      let resolveInitialFetch: (error: Error) => void;
      const initialFetchPromise = new Promise<never>((_, reject) => {
        resolveInitialFetch = reject;
      });

      const fn = vi.fn(() => initialFetchPromise);
      const cache = new SWRCache({ fn, ttl: 1 });

      // Start multiple concurrent reads
      const readPromise1 = cache.read();
      const readPromise2 = cache.read();
      const readPromise3 = cache.read();

      // Reject the initial fetch
      const error = new Error("Initial fetch failed");
      resolveInitialFetch!(error);

      // All reads should return the same error
      const results = await Promise.all([readPromise1, readPromise2, readPromise3]);
      expect(results).toEqual([error, error, error]);
      expect(fn).toHaveBeenCalledTimes(1); // Only one fetch attempt
    });

    it("handles concurrent reads during revalidation errors", async () => {
      let shouldSucceed = true;
      const error = new Error("Revalidation failed");
      const fn = vi.fn(async () => {
        if (shouldSucceed) return "initial value";
        throw error;
      });

      const cache = new SWRCache({ fn, ttl: 1 });

      // Initial successful fetch
      const initialResult = await cache.read();
      expect(initialResult).toBe("initial value");

      // Advance time to make cache stale
      vi.advanceTimersByTime(2000);

      // Set up revalidation to fail
      shouldSucceed = false;

      // Multiple concurrent reads after TTL expiry
      const readPromise1 = cache.read();
      const readPromise2 = cache.read();
      const readPromise3 = cache.read();

      const results = await Promise.all([readPromise1, readPromise2, readPromise3]);

      // All should return the stale successful value (not the error)
      expect(results).toEqual(["initial value", "initial value", "initial value"]);

      await vi.runAllTimersAsync();

      // After revalidation failure, should still serve stale data
      const laterResult = await cache.read();
      expect(laterResult).toBe("initial value");
    });

    it("recovers successfully after error when function starts working again", async () => {
      let shouldError = true;
      const error = new Error("Temporary error");
      const fn = vi.fn(async () => {
        if (shouldError) throw error;
        return "recovered value";
      });

      const cache = new SWRCache({ fn, ttl: 1 });

      // Initial error
      const result1 = await cache.read();
      expect(result1).toBe(error);

      // Advance time to make cache stale
      vi.advanceTimersByTime(2000);

      // Fix the error condition
      shouldError = false;

      // This should return stale error but trigger revalidation
      const result2 = await cache.read();
      expect(result2).toBe(error); // Still stale error

      // Wait for revalidation to complete
      await vi.runAllTimersAsync();

      // Now should have the recovered value
      const result3 = await cache.read();
      expect(result3).toBe("recovered value");
    });

    it("handles error recovery scenarios correctly", async () => {
      const initialError = new Error("Initial error");
      const revalidationError = new Error("Revalidation error");

      let callCount = 0;
      const fn = vi.fn(async () => {
        callCount++;
        if (callCount === 1) throw initialError;
        if (callCount === 2) throw revalidationError;
        if (callCount === 3) return "success";
        throw new Error(`Unexpected call ${callCount}`);
      });

      const cache = new SWRCache({ fn, ttl: 1 });

      // Initial error should be cached and returned
      const result1 = await cache.read();
      expect(result1).toBe(initialError);
      expect(fn).toHaveBeenCalledTimes(1);

      // Advance time to make error stale
      vi.advanceTimersByTime(2000);

      // Should return stale error and trigger revalidation
      const result2 = await cache.read();
      expect(result2).toBe(initialError); // Should be stale error

      // Wait for revalidation to complete (it should fail)
      await vi.runAllTimersAsync();
      expect(fn).toHaveBeenCalledTimes(2);

      // After failed revalidation, should still return initial error
      const result3 = await cache.read();
      expect(result3).toBe(initialError);

      // Advance time again to make error stale for next revalidation
      vi.advanceTimersByTime(2000);

      // This should trigger successful revalidation
      await cache.read(); // May return success if revalidation is fast
      await vi.runAllTimersAsync();
      expect(fn).toHaveBeenCalledTimes(3);

      // Subsequent read should definitely have the successful value
      const result5 = await cache.read();
      expect(result5).toBe("success");
    });

    it("preserves error details and stack traces", async () => {
      const originalError = new Error("Original error");
      originalError.stack = "Original stack trace";
      (originalError as any).customProperty = "custom value";

      const fn = vi.fn(async () => {
        throw originalError;
      });

      const cache = new SWRCache({ fn, ttl: 1 });

      const result = await cache.read();
      expect(result).toBe(originalError);
      expect((result as Error).stack).toBe("Original stack trace");
      expect((result as any).customProperty).toBe("custom value");
    });
  });

  describe("proactively initialize", () => {
    it("initializes the cache proactively", async () => {
      const fn = vi.fn(async () => "value1");
      new SWRCache({ fn, ttl: 1, proactivelyInitialize: true }); // 1 second

      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("does not initialize the cache proactively", async () => {
      const fn = vi.fn(async () => "value1");
      const cache = new SWRCache({ fn, ttl: 1, proactivelyInitialize: false }); // 1 second

      expect(fn).toHaveBeenCalledTimes(0);

      await cache.read();
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });
});
