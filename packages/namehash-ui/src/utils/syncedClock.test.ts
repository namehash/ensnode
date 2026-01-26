import { act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { HighResolutionSyncedClock } from "./syncedClock.ts";

describe("HighResolutionSyncedClock", () => {
  const mockedSystemTime = new Date("2025-01-01 00:00:00Z");

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(mockedSystemTime);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("basic functionality", () => {
    it("should create a clock instance with current time", () => {
      const clock = new HighResolutionSyncedClock();
      const now = Date.now();
      expect(clock.currentTime).toStrictEqual(now);
    });

    it("should start and stop the clock", async () => {
      const clock = new HighResolutionSyncedClock();
      const initialTime = clock.currentTime;

      // No listener → clock stopped
      await act(() => vi.advanceTimersByTimeAsync(1000));
      expect(clock.currentTime).toBe(initialTime);

      const listener = vi.fn();
      act(() => clock.addListener(listener));

      await act(() => vi.advanceTimersByTimeAsync(2000));

      expect(clock.currentTime).toStrictEqual(clock.currentTime);
      expect(listener).toHaveBeenCalled();
    });
  });

  describe("listener management", () => {
    it("should add listeners", () => {
      const clock = new HighResolutionSyncedClock();
      const listener = vi.fn();

      act(() => {
        clock.addListener(listener);
        vi.advanceTimersByTime(100);
      });

      expect(listener).toHaveBeenCalled();
    });

    it("should remove listeners", () => {
      const clock = new HighResolutionSyncedClock();
      const listener = vi.fn();

      act(() => {
        clock.addListener(listener);
        vi.advanceTimersByTime(100);
      });
      expect(listener).toHaveBeenCalled();

      vi.clearAllMocks();

      act(() => {
        clock.removeListener(listener);
        vi.advanceTimersByTime(100);
      });

      expect(listener).not.toHaveBeenCalled();
    });

    it("should start clock when first listener is added", () => {
      const clock = new HighResolutionSyncedClock();
      const initial = clock.currentTime;
      const listener = vi.fn();

      act(() => {
        clock.addListener(listener);
        vi.advanceTimersByTime(1000);
      });

      expect(clock.currentTime).toBeGreaterThan(initial);
      expect(listener).toHaveBeenCalled();
    });

    it("should stop clock when last listener is removed", () => {
      const clock = new HighResolutionSyncedClock();
      const l1 = vi.fn();
      const l2 = vi.fn();

      // add multiple listeners
      act(() => {
        clock.addListener(l1);
        clock.addListener(l2);
        vi.advanceTimersByTime(100);
      });
      expect(l1).toHaveBeenCalled();
      expect(l2).toHaveBeenCalled();

      const timeWithOne = clock.currentTime;

      l1.mockReset();
      l2.mockReset();

      // remove the one of multiple listeners
      act(() => {
        clock.removeListener(l1);
        vi.advanceTimersByTime(1000);
      });
      expect(clock.currentTime).toBeGreaterThan(timeWithOne);
      expect(l1).not.toHaveBeenCalled();
      expect(l2).toHaveBeenCalled();

      l1.mockReset();
      l2.mockReset();

      const timeBeforeStop = clock.currentTime;

      // remove the last listener
      act(() => {
        clock.removeListener(l2);
        vi.advanceTimersByTime(1000);
      });

      expect(clock.currentTime).toStrictEqual(timeBeforeStop);
      expect(l1).not.toHaveBeenCalled();
      expect(l2).not.toHaveBeenCalled();
    });

    it("should handle multiple listeners", () => {
      const clock = new HighResolutionSyncedClock();
      const l1 = vi.fn(),
        l2 = vi.fn(),
        l3 = vi.fn();

      act(() => {
        clock.addListener(l1);
        clock.addListener(l2);
        clock.addListener(l3);
        vi.advanceTimersByTime(100);
      });

      expect(l1).toHaveBeenCalled();
      expect(l2).toHaveBeenCalled();
      expect(l3).toHaveBeenCalled();
    });

    it("should deduplicate listeners when same listener is added multiple times", () => {
      const clock = new HighResolutionSyncedClock();
      const listener = vi.fn();

      act(() => {
        clock.addListener(listener);
        clock.addListener(listener);
        vi.advanceTimersByTime(100);
      });

      expect(listener).toHaveBeenCalled();

      listener.mockReset();
      const before = clock.currentTime;

      act(() => {
        clock.removeListener(listener);
        vi.advanceTimersByTime(100);
      });

      expect(clock.currentTime).toBe(before);
      expect(listener).not.toHaveBeenCalled();
    });
  });
});
