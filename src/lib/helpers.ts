import type { ContractConfig } from "ponder";

export const uniq = <T>(arr: T[]): T[] => [...new Set(arr)];

export const hasNullByte = (value: string) => value.indexOf("\u0000") !== -1;

export const bigintMax = (...args: bigint[]): bigint => args.reduce((a, b) => (a > b ? a : b));

// makes sure start and end blocks are valid for ponder
export const blockConfig = (
  start: number,
  startBlock: number,
  end: number,
): Pick<ContractConfig, "startBlock" | "endBlock"> => ({
  // START_BLOCK < startBlock < (END_BLOCK || MAX_VALUE)
  startBlock: Math.min(Math.max(start, startBlock), end || Number.MAX_SAFE_INTEGER),
  endBlock: end,
});
