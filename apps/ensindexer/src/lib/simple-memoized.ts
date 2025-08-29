/**
 * Implements stale-while-revalidate synchronous memoization of arbitrary promise-returning functions
 * within `ttlMs` window, returning `defaultValue` when no cached value is available.
 *
 * Returns `defaultValue` in the window between the first execution and the resolution of the first
 * Promise.
 *
 * Returns the previous promise's value going forward, requesting a fresh value at most every `ttlMs`
 * window.
 */
export function simpleMemoized<T>(fn: () => Promise<T>, ttlMs: number, defaultValue: T) {
  let cachedValue: T = defaultValue;
  let cachedAt = 0;
  let refreshPromise: Promise<T> | undefined;

  return (): T => {
    const now = Date.now();
    const isExpired = now > cachedAt + ttlMs;

    if (isExpired && !refreshPromise) {
      // kick off background refresh if not already in progress
      refreshPromise = fn()
        .then((value) => {
          cachedValue = value;
          cachedAt = Date.now();
          return value;
        })
        .finally(() => {
          refreshPromise = undefined;
        });
    }

    return cachedValue;
  };
}
