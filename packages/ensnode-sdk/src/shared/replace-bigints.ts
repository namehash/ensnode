// Sourced from @ponder/utils to avoid the dependency:
// https://github.com/ponder-sh/ponder/blob/c8f6935fb65176c01b40cae9056be704c0e5318e/packages/utils/src/replaceBigInts.ts

type _ReplaceBigInts<arr extends readonly unknown[], type> = number extends arr["length"]
  ? ReplaceBigInts<arr[number], type>[]
  : arr extends readonly [infer first, ...infer rest]
    ? [ReplaceBigInts<first, type>, ..._ReplaceBigInts<rest, type>]
    : [];

/**
 * Designed for plain JSON-like values (records, arrays, primitives, bigint).
 * Non-plain objects (e.g. `Date`, `Map`, class instances) are walked via
 * `Object.entries` at runtime, which strips prototype methods — pass them
 * through unchanged or use `JSON.stringify`'s replacer instead (see `toJson`).
 *
 * Output arrays and objects are mutable to match runtime behavior
 * (`Array.prototype.map` and `Object.fromEntries` both produce mutable values).
 */
export type ReplaceBigInts<obj, type> = obj extends bigint
  ? type
  : obj extends readonly unknown[]
    ? _ReplaceBigInts<obj, type>
    : obj extends object
      ? { -readonly [key in keyof obj]: ReplaceBigInts<obj[key], type> }
      : obj;

export const replaceBigInts = <const T, const type>(
  obj: T,
  replacer: (x: bigint) => type,
): ReplaceBigInts<T, type> => {
  if (typeof obj === "bigint") return replacer(obj) as ReplaceBigInts<T, type>;
  if (Array.isArray(obj))
    return obj.map((x) => replaceBigInts(x, replacer)) as ReplaceBigInts<T, type>;
  if (obj && typeof obj === "object")
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [k, replaceBigInts(v, replacer)]),
    ) as ReplaceBigInts<T, type>;
  return obj as ReplaceBigInts<T, type>;
};
