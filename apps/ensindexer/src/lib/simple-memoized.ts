export function simpleMemoized<T>(fn: () => Promise<T>, ttlMs: number) {
  let cachedPromise: Promise<T> | undefined;
  let cachedAt = 0;

  return (): Promise<T> => {
    const now = Date.now();

    // return cached promise if still valid
    if (cachedPromise && now <= cachedAt + ttlMs) return cachedPromise;

    // otherwise, create new cached promise
    cachedPromise = fn();
    cachedAt = Date.now();

    return cachedPromise;
  };
}
