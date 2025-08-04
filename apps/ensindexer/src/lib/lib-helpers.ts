export const uniq = <T>(arr: T[]): T[] => [...new Set(arr)];

export const bigintMax = (...args: bigint[]): bigint => args.reduce((a, b) => (a > b ? a : b));

export const hasNullByte = (value: string) => value.indexOf("\u0000") !== -1;

export const stripNullBytes = (value: string) => value.replaceAll("\u0000", "");

export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }

  // Handle URL objects
  if (obj instanceof URL) {
    return new URL(obj.href) as T;
  }

  // Handle Map objects
  if (obj instanceof Map) {
    const clonedMap = new Map();
    for (const [key, value] of obj.entries()) {
      clonedMap.set(deepClone(key), deepClone(value));
    }
    return clonedMap as T;
  }

  // Handle Set objects
  if (obj instanceof Set) {
    const clonedSet = new Set();
    for (const value of obj.values()) {
      clonedSet.add(deepClone(value));
    }
    return clonedSet as T;
  }

  // Handle Arrays
  if (Array.isArray(obj)) {
    return obj.map((item) => deepClone(item)) as T;
  }

  // Handle plain objects and other object types
  const clonedObj = {} as T;
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      clonedObj[key] = deepClone(obj[key]);
    }
  }

  return clonedObj;
}

/**
 * Helper type to merge multiple types into one.
 */
export type MergedTypes<T> = (T extends any ? (x: T) => void : never) extends (x: infer R) => void
  ? R
  : never;
