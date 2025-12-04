type SyncedClockListener = () => void;

/**
 * Create Now
 *
 * Helper type defining a factory function for unix timestamp values in milliseconds.
 * An example factory is `Date.now`.
 */
type CreateNow = () => number;

export interface SyncedClock {
  /**
   * Current time of the synced clock as a unix timestamp value in milliseconds.
   */
  currentTime: ReturnType<CreateNow>;

  /**
   * Adds a new listener to all listeners tracking the synced clock.
   * @param callback to notify the listener about clock updates.
   */
  addListener(callback: SyncedClockListener): void;

  /**
   * Removes a listener from all listeners tracking the synced clock.
   * @param callback to notify the listener about clock updates.
   */
  removeListener(callback: SyncedClockListener): void;
}

/**
 * Default tick rate frequency in milliseconds.
 */
export const DEFAULT_TICK_RATE = 16;

/**
 * High-resolution clock that updates with `tickRate` frequency.
 */
export class HighResolutionSyncedClock implements SyncedClock {
  #listeners = new Set<SyncedClockListener>();

  #currentTime = Date.now();

  #timerId: ReturnType<typeof setTimeout> | null = null;

  /**
   * Tick rate frequency in milliseconds.
   */
  #tickRate: number;

  /**
   * Clock's tick handler.
   *
   * Runs at `tickRate` frequency, and notifies all listeners about
   * the current time updates.
   */
  #tick = () => {
    this.#currentTime = Date.now();

    this.#listeners.forEach((listener) => listener());

    this.#timerId = setTimeout(this.#tick, this.#tickRate);
  };

  /**
   * Starts the clock.
   */
  private start = () => {
    if (this.#timerId === null) {
      this.#currentTime = Date.now();
      this.#timerId = setTimeout(this.#tick, this.#tickRate);
    }
  };

  /**
   * Stops the clock.
   */
  private stop = () => {
    if (this.#timerId !== null) {
      clearTimeout(this.#timerId);
      this.#timerId = null;
    }
  };

  public constructor(tickRate = DEFAULT_TICK_RATE) {
    this.#tickRate = tickRate;
  }

  /**
   * Adds a new listener to all listeners tracking the synced clock.
   *
   * Starts the clock (or restarts it, which is a noop) if there's at
   * least one listener.
   *
   * @param callback to notify the listener about clock updates.
   */
  public addListener(callback: SyncedClockListener) {
    this.#listeners.add(callback);

    // start (or restart, which is a noop) when anyone is listening
    if (this.#listeners.size > 0) {
      this.start();
    }
  }

  /**
   * Removes a listener from all listeners tracking the synced clock.
   *
   * Stops the clock if there's no listener.
   *
   * @param callback to notify the listener about clock updates.
   */
  public removeListener(callback: SyncedClockListener) {
    this.#listeners.delete(callback);

    // stop when no one is listening anymore
    if (this.#listeners.size === 0) {
      this.stop();
    }
  }

  get currentTime() {
    return this.#currentTime;
  }
}
