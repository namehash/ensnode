import type { ContractConfig } from "ponder";

export const uniq = <T>(arr: T[]): T[] => [...new Set(arr)];

export const hasNullByte = (value: string) => value.indexOf("\u0000") !== -1;

export const bigintMax = (...args: bigint[]): bigint => args.reduce((a, b) => (a > b ? a : b));

// makes sure start and end blocks are valid for ponder
export const blockConfig = (
  start: number | undefined,
  startBlock: number,
  end: number | undefined,
): Pick<ContractConfig, "startBlock" | "endBlock"> => ({
  // START_BLOCK < startBlock < (END_BLOCK || MAX_VALUE)
  startBlock: Math.min(Math.max(start || 0, startBlock), end || Number.MAX_SAFE_INTEGER),
  endBlock: end,
});

type AnyObject = { [key: string]: any };

/**
 * Deep merge two objects recursively.
 * @param target The target object to merge into.
 * @param source The source object to merge from.
 * @returns The merged object.
 * @see https://stackoverflow.com/a/48218209
 * @example
 * const obj1 = { a: 1, b: 2, c: { d: 3 } };
 * const obj2 = { a: 4, c: { e: 5 } };
 * const obj3 = deepMergeRecursive(obj1, obj2);
 * // { a: 4, b: 2, c: { d: 3, e: 5 } }
 */
export function deepMergeRecursive<T extends AnyObject, U extends AnyObject>(
  target: T,
  source: U,
): T & U {
  const output = { ...target } as T & U;

  function isObject(item: any): item is AnyObject {
    return item && typeof item === "object" && !Array.isArray(item);
  }

  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach((key) => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] });
        } else {
          (output as AnyObject)[key] = deepMergeRecursive(
            (target as AnyObject)[key],
            (source as AnyObject)[key],
          );
        }
      } else if (Array.isArray(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] });
        } else {
          (output as AnyObject)[key] = Array.isArray((target as AnyObject)[key])
            ? [...(target as AnyObject)[key], ...source[key]]
            : source[key];
        }
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }

  return output;
}
