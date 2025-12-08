import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { BackgroundRevalidationScheduler } from "./background-revalidation-scheduler";

describe("BackgroundRevalidationScheduler", () => {
  let scheduler: BackgroundRevalidationScheduler;

  beforeEach(() => {
    scheduler = new BackgroundRevalidationScheduler();
    vi.useFakeTimers();
  });

  afterEach(() => {
    scheduler.cancelAll();
    vi.restoreAllMocks();
  });

  describe("schedule", () => {
    it("should schedule a revalidation function and return it", () => {
      const revalidate = vi.fn(async () => {});

      const result = scheduler.schedule({
        revalidate,
        interval: 1000,
      });

      expect(result).toBe(revalidate);
    });

    it("should invoke the revalidation function on interval", async () => {
      const revalidate = vi.fn(async () => {});

      scheduler.schedule({
        revalidate,
        interval: 1000,
      });

      await vi.advanceTimersByTimeAsync(1000);
      expect(revalidate).toHaveBeenCalledTimes(1);

      await vi.advanceTimersByTimeAsync(1000);
      expect(revalidate).toHaveBeenCalledTimes(2);

      await vi.advanceTimersByTimeAsync(1000);
      expect(revalidate).toHaveBeenCalledTimes(3);
    });

    it("should respect initial delay before first revalidation", async () => {
      const revalidate = vi.fn(async () => {});

      scheduler.schedule({
        revalidate,
        interval: 1000,
        initialDelay: 500,
      });

      await vi.advanceTimersByTimeAsync(499);
      expect(revalidate).not.toHaveBeenCalled();

      await vi.advanceTimersByTimeAsync(1);
      expect(revalidate).toHaveBeenCalledTimes(1);

      await vi.advanceTimersByTimeAsync(1000);
      expect(revalidate).toHaveBeenCalledTimes(2);
    });

    it("should prevent concurrent revalidations within a schedule", async () => {
      let resolveRevalidate: (() => void) | null = null;
      const revalidate = vi.fn(async () => {
        // Return a promise that we can manually resolve
        await new Promise<void>((resolve) => {
          resolveRevalidate = resolve;
        });
      });

      scheduler.schedule({
        revalidate,
        interval: 1000,
      });

      // First invocation at t=1000
      await vi.advanceTimersByTimeAsync(1000);
      expect(revalidate).toHaveBeenCalledTimes(1);
      expect(resolveRevalidate).not.toBeNull();

      // At t=2000, second invocation is queued but first is still in progress
      await vi.advanceTimersByTimeAsync(1000);
      expect(revalidate).toHaveBeenCalledTimes(1); // Still only 1 because first is in progress

      // Resolve the first revalidation
      resolveRevalidate!();
      await vi.runAllTimersAsync();

      // Now second should have started
      expect(revalidate).toHaveBeenCalledTimes(2);

      // Resolve the second revalidation
      resolveRevalidate!();
      await vi.runAllTimersAsync();

      // Now third should have started (queued for t=3000)
      expect(revalidate).toHaveBeenCalledTimes(3);
    });

    it("should invoke onError callback when revalidation fails", async () => {
      const error = new Error("Revalidation failed");
      const revalidate = vi.fn(async () => {
        throw error;
      });
      const onError = vi.fn();

      scheduler.schedule({
        revalidate,
        interval: 1000,
        onError,
      });

      await vi.advanceTimersByTimeAsync(1000);
      expect(onError).toHaveBeenCalledWith(error);
      expect(onError).toHaveBeenCalledTimes(1);

      await vi.advanceTimersByTimeAsync(1000);
      expect(onError).toHaveBeenCalledTimes(2);
    });

    it("should continue scheduling after an error", async () => {
      const revalidate = vi
        .fn()
        .mockRejectedValueOnce(new Error("First failure"))
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined);

      const onError = vi.fn();

      scheduler.schedule({
        revalidate,
        interval: 1000,
        onError,
      });

      await vi.advanceTimersByTimeAsync(1000);
      expect(revalidate).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledTimes(1);

      await vi.advanceTimersByTimeAsync(1000);
      expect(revalidate).toHaveBeenCalledTimes(2);
      expect(onError).toHaveBeenCalledTimes(1);

      await vi.advanceTimersByTimeAsync(1000);
      expect(revalidate).toHaveBeenCalledTimes(3);
      expect(onError).toHaveBeenCalledTimes(1);
    });

    it("should not invoke onError callback if none is provided", async () => {
      const revalidate = vi.fn(async () => {
        throw new Error("Revalidation failed");
      });

      scheduler.schedule({
        revalidate,
        interval: 1000,
      });

      await vi.advanceTimersByTimeAsync(1000);
      expect(revalidate).toHaveBeenCalledTimes(1);
      // Should not throw
    });

    it("should handle multiple concurrent schedules", async () => {
      const revalidate1 = vi.fn(async () => {});
      const revalidate2 = vi.fn(async () => {});
      const revalidate3 = vi.fn(async () => {});

      scheduler.schedule({ revalidate: revalidate1, interval: 1000 });
      scheduler.schedule({ revalidate: revalidate2, interval: 1500 });
      scheduler.schedule({ revalidate: revalidate3, interval: 2000 });

      await vi.advanceTimersByTimeAsync(1000);
      expect(revalidate1).toHaveBeenCalledTimes(1);
      expect(revalidate2).toHaveBeenCalledTimes(0);
      expect(revalidate3).toHaveBeenCalledTimes(0);

      await vi.advanceTimersByTimeAsync(500);
      expect(revalidate1).toHaveBeenCalledTimes(1);
      expect(revalidate2).toHaveBeenCalledTimes(1);
      expect(revalidate3).toHaveBeenCalledTimes(0);

      await vi.advanceTimersByTimeAsync(500);
      expect(revalidate1).toHaveBeenCalledTimes(2);
      expect(revalidate2).toHaveBeenCalledTimes(1);
      expect(revalidate3).toHaveBeenCalledTimes(1);
    });
  });

  describe("cancel", () => {
    it("should stop scheduling revalidations for a specific function", async () => {
      const revalidate = vi.fn(async () => {});

      const fn = scheduler.schedule({
        revalidate,
        interval: 1000,
      });

      await vi.advanceTimersByTimeAsync(1000);
      expect(revalidate).toHaveBeenCalledTimes(1);

      scheduler.cancel(fn);

      await vi.advanceTimersByTimeAsync(1000);
      expect(revalidate).toHaveBeenCalledTimes(1);

      await vi.advanceTimersByTimeAsync(1000);
      expect(revalidate).toHaveBeenCalledTimes(1);
    });

    it("should cancel a schedule that has initialDelay", async () => {
      const revalidate = vi.fn(async () => {});

      const fn = scheduler.schedule({
        revalidate,
        interval: 1000,
        initialDelay: 500,
      });

      scheduler.cancel(fn);

      await vi.advanceTimersByTimeAsync(500);
      expect(revalidate).not.toHaveBeenCalled();

      await vi.advanceTimersByTimeAsync(1000);
      expect(revalidate).not.toHaveBeenCalled();
    });

    it("should be safe to cancel a non-existent schedule", () => {
      const revalidate = vi.fn(async () => {});

      expect(() => {
        scheduler.cancel(revalidate);
      }).not.toThrow();
    });

    it("should allow re-scheduling a cancelled function", async () => {
      const revalidate = vi.fn(async () => {});

      const fn = scheduler.schedule({
        revalidate,
        interval: 1000,
      });

      await vi.advanceTimersByTimeAsync(1000);
      expect(revalidate).toHaveBeenCalledTimes(1);

      scheduler.cancel(fn);

      await vi.advanceTimersByTimeAsync(1000);
      expect(revalidate).toHaveBeenCalledTimes(1);

      scheduler.schedule({
        revalidate,
        interval: 1000,
      });

      await vi.advanceTimersByTimeAsync(1000);
      expect(revalidate).toHaveBeenCalledTimes(2);
    });

    it("should not affect other active schedules when cancelling one", async () => {
      const revalidate1 = vi.fn(async () => {});
      const revalidate2 = vi.fn(async () => {});

      const fn1 = scheduler.schedule({
        revalidate: revalidate1,
        interval: 1000,
      });
      scheduler.schedule({
        revalidate: revalidate2,
        interval: 1000,
      });

      await vi.advanceTimersByTimeAsync(1000);
      expect(revalidate1).toHaveBeenCalledTimes(1);
      expect(revalidate2).toHaveBeenCalledTimes(1);

      scheduler.cancel(fn1);

      await vi.advanceTimersByTimeAsync(1000);
      expect(revalidate1).toHaveBeenCalledTimes(1);
      expect(revalidate2).toHaveBeenCalledTimes(2);
    });
  });

  describe("cancelAll", () => {
    it("should cancel all active schedules", async () => {
      const revalidate1 = vi.fn(async () => {});
      const revalidate2 = vi.fn(async () => {});
      const revalidate3 = vi.fn(async () => {});

      scheduler.schedule({ revalidate: revalidate1, interval: 1000 });
      scheduler.schedule({ revalidate: revalidate2, interval: 1500 });
      scheduler.schedule({ revalidate: revalidate3, interval: 2000 });

      await vi.advanceTimersByTimeAsync(1000);
      expect(revalidate1).toHaveBeenCalledTimes(1);
      expect(revalidate2).toHaveBeenCalledTimes(0);
      expect(revalidate3).toHaveBeenCalledTimes(0);

      scheduler.cancelAll();

      await vi.advanceTimersByTimeAsync(5000);
      expect(revalidate1).toHaveBeenCalledTimes(1);
      expect(revalidate2).toHaveBeenCalledTimes(0);
      expect(revalidate3).toHaveBeenCalledTimes(0);
    });

    it("should be safe to call cancelAll when no schedules exist", () => {
      expect(() => {
        scheduler.cancelAll();
      }).not.toThrow();
    });
  });

  describe("getActiveScheduleCount", () => {
    it("should return 0 when no schedules are active", () => {
      expect(scheduler.getActiveScheduleCount()).toBe(0);
    });

    it("should return the count of active schedules", () => {
      const revalidate1 = vi.fn(async () => {});
      const revalidate2 = vi.fn(async () => {});
      const revalidate3 = vi.fn(async () => {});

      scheduler.schedule({ revalidate: revalidate1, interval: 1000 });
      expect(scheduler.getActiveScheduleCount()).toBe(1);

      scheduler.schedule({ revalidate: revalidate2, interval: 1000 });
      expect(scheduler.getActiveScheduleCount()).toBe(2);

      scheduler.schedule({ revalidate: revalidate3, interval: 1000 });
      expect(scheduler.getActiveScheduleCount()).toBe(3);
    });

    it("should decrement count when schedules are cancelled", () => {
      const revalidate1 = vi.fn(async () => {});
      const revalidate2 = vi.fn(async () => {});

      const fn1 = scheduler.schedule({
        revalidate: revalidate1,
        interval: 1000,
      });
      scheduler.schedule({ revalidate: revalidate2, interval: 1000 });

      expect(scheduler.getActiveScheduleCount()).toBe(2);

      scheduler.cancel(fn1);
      expect(scheduler.getActiveScheduleCount()).toBe(1);

      scheduler.cancelAll();
      expect(scheduler.getActiveScheduleCount()).toBe(0);
    });
  });
});
