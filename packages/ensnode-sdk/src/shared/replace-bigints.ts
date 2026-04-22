// Sourced from @ponder/utils to avoid the dependency:
// https://github.com/ponder-sh/ponder/blob/c8f6935fb65176c01b40cae9056be704c0e5318e/packages/utils/src/replaceBigInts.ts

type _ReplaceBigInts<
  arr extends readonly unknown[],
  type,
  result extends readonly unknown[] = [],
> = arr extends readonly [infer first, ...infer rest]
  ? _ReplaceBigInts<rest, type, readonly [...result, first extends bigint ? type : first]>
  : result;

export type ReplaceBigInts<obj, type> = obj extends bigint
  ? type
  : obj extends readonly unknown[]
    ? _ReplaceBigInts<obj, type>
    : obj extends object
      ? { [key in keyof obj]: ReplaceBigInts<obj[key], type> }
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
