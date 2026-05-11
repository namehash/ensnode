/**
 * The maximum depth of a name supported by Omnigraph traversal libs, to avoid runaway walks across
 * the namegraph. ENS names have no formal depth limit, but we cap traversal to fail loudly rather
 * than risk an unbounded recursive CTE.
 *
 * If this depth turns out to be problematic in practice, we can increase it as necessary.
 */
export const MAX_SUPPORTED_NAME_DEPTH = 16;
