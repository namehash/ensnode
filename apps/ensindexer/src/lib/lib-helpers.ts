export const uniq = <T>(arr: T[]): T[] => [...new Set(arr)];

export const bigintMax = (...args: bigint[]): bigint => args.reduce((a, b) => (a > b ? a : b));

export const hasNullByte = (value: string) => value.indexOf("\u0000") !== -1;

export const stripNullBytes = (value: string) => value.replaceAll("\u0000", "");
