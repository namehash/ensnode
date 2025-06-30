export const uniq = <T>(arr: T[]): T[] => [...new Set(arr)];

export const bigintMax = (...args: bigint[]): bigint => args.reduce((a, b) => (a > b ? a : b));

export const hasNullByte = (value: string) => value.indexOf("\u0000") !== -1;

export const stripNullBytes = (value: string) => value.replaceAll("\u0000", "");

export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => deepClone(item)) as any;
  }

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
