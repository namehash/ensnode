import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { wait, waitForCondition } from "./wait";

describe("wait", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("wait()", () => {
    it("resolves after the specified time", async () => {
      // arrange
      let resolved = false;
      const promise = wait(50).then(() => {
        resolved = true;
      });

      // assert - not resolved yet
      expect(resolved).toBe(false);

      // act - advance time
      await vi.advanceTimersByTimeAsync(50);
      await promise;

      // assert - resolved
      expect(resolved).toBe(true);
    });

    it("resolves immediately for zero milliseconds", async () => {
      // arrange
      let resolved = false;
      const promise = wait(0).then(() => {
        resolved = true;
      });

      // act - flush promises
      await vi.advanceTimersByTimeAsync(0);
      await promise;

      // assert - resolved immediately
      expect(resolved).toBe(true);
    });
  });

  describe("waitForCondition()", () => {
    it("resolves when condition is met on first check", async () => {
      // arrange
      let calls = 0;
      const condition = async () => {
        calls++;
        return true;
      };

      // act
      const promise = waitForCondition(condition, { intervalMs: 10, timeoutMs: 100 });
      await vi.advanceTimersByTimeAsync(0);
      await promise;

      // assert
      expect(calls).toBe(1);
    });

    it("resolves when condition becomes true after multiple checks", async () => {
      // arrange
      let calls = 0;
      const condition = async () => {
        calls++;
        return calls >= 3;
      };

      // act
      const promise = waitForCondition(condition, { intervalMs: 10, timeoutMs: 100 });
      // Condition checked at time 0, returns false
      await vi.advanceTimersByTimeAsync(0);
      // Wait 10ms, condition checked again
      await vi.advanceTimersByTimeAsync(10);
      // Wait 10ms, condition checked again
      await vi.advanceTimersByTimeAsync(10);
      await promise;

      // assert
      expect(calls).toBe(3);
    });

    it("throws error when timeout is reached", async () => {
      // arrange
      const condition = async () => false;

      // act & assert
      const promise = waitForCondition(condition, { intervalMs: 10, timeoutMs: 50 });

      // Attach assertion handler before running timers to avoid unhandled rejection
      const assertion = expect(promise).rejects.toThrowError("Timeout while waiting for condition");

      // Run all pending timers to trigger the timeout
      await vi.runAllTimersAsync();

      await assertion;
    });

    it("ignores errors from condition function and continues retrying", async () => {
      // arrange
      let calls = 0;
      const condition = async () => {
        calls++;
        if (calls < 3) {
          throw new Error("Temporary error");
        }
        return true;
      };

      // act
      const promise = waitForCondition(condition, { intervalMs: 10, timeoutMs: 100 });
      await vi.advanceTimersByTimeAsync(0); // First call, throws
      await vi.advanceTimersByTimeAsync(10); // Second call, throws
      await vi.advanceTimersByTimeAsync(10); // Third call, returns true
      await promise;

      // assert
      expect(calls).toBe(3);
    });

    it("throws timeout error if condition keeps throwing until timeout", async () => {
      // arrange
      const condition = async () => {
        throw new Error("Always fails");
      };

      // act & assert
      const promise = waitForCondition(condition, { intervalMs: 10, timeoutMs: 50 });

      // Attach assertion handler before running timers to avoid unhandled rejection
      const assertion = expect(promise).rejects.toThrowError("Timeout while waiting for condition");

      // Run all pending timers to trigger the timeout
      await vi.runAllTimersAsync();

      await assertion;
    });

    it("uses default options when none provided", async () => {
      // arrange
      let calls = 0;
      const condition = async () => {
        calls++;
        return true;
      };

      // act
      const promise = waitForCondition(condition);
      await vi.advanceTimersByTimeAsync(0);
      await promise;

      // assert
      expect(calls).toBe(1);
    });

    it("respects custom intervalMs", async () => {
      // arrange
      let calls = 0;
      const timestamps: number[] = [];
      const condition = async () => {
        calls++;
        timestamps.push(Date.now());
        return calls >= 3;
      };

      // act
      const promise = waitForCondition(condition, { intervalMs: 50, timeoutMs: 500 });
      await vi.advanceTimersByTimeAsync(0); // First check
      await vi.advanceTimersByTimeAsync(50); // Second check
      await vi.advanceTimersByTimeAsync(50); // Third check, condition met
      await promise;

      // assert
      expect(calls).toBe(3);
      // With fake timers, Date.now() advances by the same amount
      expect(timestamps[1] - timestamps[0]).toBe(50);
      expect(timestamps[2] - timestamps[1]).toBe(50);
    });
  });
});
