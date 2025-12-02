type SyncedClockListener = () => void;

type CreateNow = () => number;

interface SyncedClock {
  /**
   * Current time of the synced clock.
   */
  currentTime: ReturnType<CreateNow>;

  /**
   * Adds a new listener to all listeners tracking the synced clock.
   * @param callback React Component listener
   */
  addListener(callback: SyncedClockListener): void;

  /**
   * Removes a new listener from all listeners tracking the synced clock.
   * @param callback React Component listener
   */
  removeListener(callback: SyncedClockListener): void;
}

/**
 * Create high-precision clock with updates on every frame.
 * @returns {SyncedClock} to be used with {@link useSyncExternalStore}.
 */
export function createSyncedClock(): SyncedClock {
  const listeners = new Set<SyncedClockListener>();
  let _currentTime = Date.now();
  let timerId: ReturnType<typeof setTimeout> | null = null;

  /**
   * Clock's tick handler.
   *
   * Runs multiple times a second, and notifies all listeners about
   * the current time updates.
   */
  function tick() {
    _currentTime = Date.now();

    listeners.forEach((listener) => listener());

    timerId = setTimeout(tick, 16); // ~60fps, same as RAF
  }

  /**
   * Starts the clock.
   */
  function start() {
    if (timerId === null) {
      _currentTime = Date.now();
      timerId = setTimeout(tick, 16);
    }
  }

  /**
   * Stops the clock.
   */
  function stop() {
    if (timerId !== null) {
      clearTimeout(timerId);
      timerId = null;
    }
  }

  /**
   * Adds a new listener to all listeners tracking the synced clock.
   *
   * Starts the clock if there's at least one listener.
   *
   * @param callback React Component listener
   */
  function addListener(callback: SyncedClockListener) {
    listeners.add(callback);

    // start when someone is listening
    if (listeners.size > 0) {
      start();
    }
  }

  /**
   * Remove a new listener from all listeners tracking the synced clock.
   *
   * Stops the clock if there's no listener.
   *
   * @param callback React Component listener
   */
  function removeListener(callback: SyncedClockListener) {
    listeners.delete(callback);

    // stop when no one is listening anymore
    if (listeners.size === 0) {
      stop();
    }
  }

  return {
    get currentTime() {
      return _currentTime;
    },
    addListener,
    removeListener,
  };
}
