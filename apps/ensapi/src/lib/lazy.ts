const UNSET = Symbol("UNSET");

/**
 * Creates a lazy singleton — the factory is called at most once, on first invocation.
 * Correctly handles factories that return `null` or `undefined`.
 */
export function lazy<T>(factory: () => T): () => T {
  let cached: T | typeof UNSET = UNSET;
  return () => {
    if (cached === UNSET) cached = factory();
    return cached as T;
  };
}
