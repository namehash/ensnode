import { secondsToMilliseconds } from "date-fns";

/**
 * Waits for the specified number of milliseconds.
 *
 * @param ms The number of milliseconds to wait.
 * @returns A promise that resolves after the specified delay.
 */
export async function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface WaitForConditionOptions {
  /**
   * Interval in milliseconds between condition checks.
   */
  intervalMs?: number;

  /**
   * Maximum time in milliseconds to wait for the condition before timing out.
   * If the timeout is reached, the returned promise will be rejected with
   * an error.
   */
  timeoutMs?: number;
}

const DEFAULT_WAIT_FOR_CONDITION_OPTIONS = {
  intervalMs: secondsToMilliseconds(1),
  timeoutMs: secondsToMilliseconds(30),
} as const satisfies WaitForConditionOptions;

/**
 * Waits for a specified condition function to return true,
 * checking at regular intervals until a timeout is reached.
 *
 * @param conditionFn The condition function to evaluate.
 * @param options Optional settings for interval and timeout.
 * @returns A promise that resolves when the condition is met or rejects on timeout.
 */
export async function waitForCondition(
  conditionFn: () => Promise<boolean>,
  options?: WaitForConditionOptions,
): Promise<void> {
  const {
    intervalMs = DEFAULT_WAIT_FOR_CONDITION_OPTIONS.intervalMs,
    timeoutMs = DEFAULT_WAIT_FOR_CONDITION_OPTIONS.timeoutMs,
  } = options || {};

  const startTime = Date.now();

  while (true) {
    try {
      if (await conditionFn()) {
        // Condition is met, resolve the promise and exit the loop
        return;
      }
    } catch {
      // Ignore errors from the condition function and continue retrying until timeout
    }

    if (Date.now() - startTime >= timeoutMs) {
      throw new Error("Timeout while waiting for condition");
    }

    await wait(intervalMs);
  }
}
