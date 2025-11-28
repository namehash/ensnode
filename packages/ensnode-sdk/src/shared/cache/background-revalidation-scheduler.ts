/**
 * Configuration for scheduling a background revalidation task.
 *
 * @internal
 */
interface ScheduleConfig {
  /**
   * The async function to invoke on schedule.
   */
  revalidate: () => Promise<void>;

  /**
   * The interval in milliseconds between revalidations.
   */
  interval: number;

  /**
   * Optional delay in milliseconds before the first revalidation.
   * Useful to stagger multiple schedules and avoid thundering herd on startup.
   * @default 0
   */
  initialDelay?: number;

  /**
   * Optional callback invoked when a revalidation attempt fails.
   * If not provided, errors are silently ignored.
   */
  onError?: (error: unknown) => void;
}

/**
 * Metadata about an active schedule.
 *
 * @internal
 */
interface ScheduleMetadata {
  config: ScheduleConfig;
  timeoutId: NodeJS.Timeout | null;
  inProgress: boolean;
}

/**
 * Manager for background revalidation scheduling of caches.
 *
 * This module handles scheduling periodic revalidation tasks on a recurring interval
 * to proactively update cache data instead of waiting for lazy revalidation.
 *
 * Features:
 * - Prevents concurrent revalidations within a single schedule
 * - Configurable error handling via callbacks
 * - Cancellation via stored timeout IDs
 * - Optional initial delay to stagger schedules
 * - Introspection of active schedules for debugging
 *
 * @internal
 */
export class BackgroundRevalidationScheduler {
  private activeSchedules: Map<() => Promise<void>, ScheduleMetadata> = new Map();

  /**
   * Schedule a revalidation function to run on a recurring interval.
   *
   * @param config Configuration object for the schedule
   * @returns The revalidate function that can be passed to `cancel()` to stop the schedule
   */
  schedule(config: ScheduleConfig): () => Promise<void> {
    const { revalidate, interval, initialDelay = 0, onError } = config;

    // Prevent duplicate schedules for the same function
    if (this.activeSchedules.has(revalidate)) {
      return revalidate;
    }

    const metadata: ScheduleMetadata = {
      config,
      timeoutId: null,
      inProgress: false,
    };

    this.activeSchedules.set(revalidate, metadata);

    // Helper to execute a single revalidation attempt
    const executeRevalidation = async (): Promise<void> => {
      // Skip if a revalidation is already in progress for this schedule
      if (metadata.inProgress) return;

      metadata.inProgress = true;

      try {
        await revalidate();
      } catch (error) {
        onError?.(error);
      } finally {
        metadata.inProgress = false;
      }
    };

    // Helper to schedule the next revalidation
    const scheduleNext = (): void => {
      if (!this.activeSchedules.has(revalidate)) return;

      metadata.timeoutId = setTimeout(() => {
        if (this.activeSchedules.has(revalidate)) {
          executeRevalidation().then(() => scheduleNext());
        }
      }, interval);
    };

    // Schedule the first revalidation after initialDelay
    if (initialDelay > 0) {
      metadata.timeoutId = setTimeout(() => {
        if (this.activeSchedules.has(revalidate)) {
          executeRevalidation().then(() => scheduleNext());
        }
      }, initialDelay);
    } else {
      scheduleNext();
    }

    return revalidate;
  }

  /**
   * Cancel a scheduled revalidation by its revalidate function.
   *
   * @param revalidate The revalidation function returned from `schedule()`
   */
  cancel(revalidate: () => Promise<void>): void {
    const metadata = this.activeSchedules.get(revalidate);
    if (!metadata) return;

    // Clear the pending timeout
    if (metadata.timeoutId !== null) {
      clearTimeout(metadata.timeoutId);
    }

    this.activeSchedules.delete(revalidate);
  }

  /**
   * Cancel all active schedules.
   */
  cancelAll(): void {
    for (const [, metadata] of this.activeSchedules) {
      if (metadata.timeoutId !== null) {
        clearTimeout(metadata.timeoutId);
      }
    }
    this.activeSchedules.clear();
  }

  /**
   * Get the count of active schedules.
   * Useful for debugging and monitoring.
   *
   * @returns The number of currently active schedules
   */
  getActiveScheduleCount(): number {
    return this.activeSchedules.size;
  }
}
