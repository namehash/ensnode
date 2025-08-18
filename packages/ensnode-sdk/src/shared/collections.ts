/**
 * Filter out duplicates.
 */
export const uniq = <T>(arr: T[]): T[] => [...new Set(arr)];
