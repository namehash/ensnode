import { getUnixTime } from "date-fns";

/**
 * Sync mechanism to ensure all components
 * using useIndexingStatus share the same projection timestamp.
 *
 * This is a minimal store that only manages:
 * - A synchronized "tick" (updated every second)
 * - Notifying subscribers when the tick changes
 *
 * React Query handles all the actual data fetching and caching.
 * This store just ensures all components project from the same moment in time.
 */
class ProjectionSync {
  private currentTimestamp: number = getUnixTime(new Date());
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private listeners = new Set<() => void>();
  private subscriberCount = 0;

  getTimestamp(): number {
    return this.currentTimestamp;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    this.subscriberCount++;

    if (this.subscriberCount === 1) {
      this.start();
    }

    return () => {
      this.listeners.delete(listener);
      this.subscriberCount--;

      if (this.subscriberCount === 0) {
        this.stop();
      }
    };
  }

  private start(): void {
    if (this.intervalId !== null) return;

    this.intervalId = setInterval(() => {
      this.currentTimestamp = getUnixTime(new Date());
      this.notifyListeners();
    }, 1000);
  }

  private stop(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => {
      listener();
    });
  }
}

export const projectionSync = new ProjectionSync();
