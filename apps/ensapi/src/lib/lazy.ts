/**
 * Creates a lazy singleton — the factory is called at most once, on first invocation.
 */
export function lazy<T>(factory: () => T): () => T {
  let cached: T | undefined;
  return () => (cached ??= factory());
}
