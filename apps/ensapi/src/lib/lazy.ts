const UNSET = Symbol("UNSET");

/**
 * Creates a lazy singleton — the factory is called at most once, on first invocation.
 * Correctly handles factories that return `null` or `undefined`.
 *
 * Returns a getter function. Use this for primitive or nullable values where a Proxy
 * is not suitable (e.g. `bigint | null`). For objects, prefer `lazyProxy`.
 */
export function lazy<T>(factory: () => T): () => T {
  let cached: T | typeof UNSET = UNSET;
  return () => {
    if (cached === UNSET) cached = factory();
    return cached as T;
  };
}

/**
 * Creates a lazy singleton object exposed as a stable Proxy reference.
 * The factory is called at most once, on first property access.
 *
 * Unlike `lazy()`, this returns the object itself (not a getter function), so
 * consumers can import and use it directly without calling a getter:
 *
 * ```ts
 * export const myCache = lazyProxy(() => new SWRCache(...));
 * // usage: myCache.read()  ← no getter call needed
 * ```
 *
 * Not suitable for primitives or nullable values — use `lazy()` for those.
 */
export function lazyProxy<T extends object>(factory: () => T): T {
  const getInstance = lazy(factory);
  return new Proxy({} as T, {
    get(_, prop) {
      const instance = getInstance();
      const value = Reflect.get(instance, prop as string, instance);
      if (typeof value === "function") {
        return (value as (...args: unknown[]) => unknown).bind(instance);
      }
      return value;
    },
    has(_, prop) {
      return Reflect.has(getInstance(), prop);
    },
  });
}
