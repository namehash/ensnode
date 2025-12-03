type SyncedClockListener = () => void;

/**
 * Cerate Now
 *
 * Helper type defining a factory function for unix timestamp values in milliseconds.
 * An example factory is `Date.now`.
 */
type CreateNow = () => number;

export interface SyncedClock {
  /**
   * Current time of the synced clock.
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
 * High-precision clock with multiple updates over each second.
 */
export class HighPrecisionSyncedClock implements SyncedClock {
  private listeners = new Set<SyncedClockListener>();

  private _currentTime = Date.now();

  private timerId: ReturnType<typeof setTimeout> | null = null;

  /**
   * Tick rate in milliseconds.
   *
   * For example, updating clock 60 times in a second requires
   * tick rate of around 16ms.
   */
  private tickRate: number = 16;

  /**
   * Clock's tick handler.
   *
   * Runs multiple times a second, and notifies all listeners about
   * the current time updates.
   */
  private tick = () => {
    this._currentTime = Date.now();

    this.listeners.forEach((listener) => listener());

    this.timerId = setTimeout(this.tick, this.tickRate);
  };

  /**
   * Starts the clock.
   */
  private start = () => {
    if (this.timerId === null) {
      this._currentTime = Date.now();
      this.timerId = setTimeout(this.tick, 16);
    }
  };

  /**
   * Stops the clock.
   */
  private stop = () => {
    if (this.timerId !== null) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  };

  /**
   * Adds a new listener to all listeners tracking the synced clock.
   *
   * Starts the clock if there's at least one listener.
   *
   * @param callback to notify the listener about clock updates.
   */
  public addListener(callback: SyncedClockListener) {
    this.listeners.add(callback);

    // start when someone is listening
    if (this.listeners.size > 0) {
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
    this.listeners.delete(callback);

    // stop when no one is listening anymore
    if (this.listeners.size === 0) {
      this.stop();
    }
  }

  get currentTime() {
    return this._currentTime;
  }
}
