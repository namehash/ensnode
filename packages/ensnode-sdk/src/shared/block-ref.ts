import type { BlockRef } from "./types";

/**
 * Compare two {@link BlockRef} object to check
 * if one is before the other.
 */
export function isBefore(blockA: BlockRef, blockB: BlockRef) {
  return blockA.number <= blockB.number && blockA.timestamp <= blockB.timestamp;
}

/**
 * Compare two {@link BlockRef} object to check
 * if one is equal to the other.
 */
export function isEqualTo(blockA: BlockRef, blockB: BlockRef) {
  return blockA.number === blockB.number && blockA.timestamp === blockB.timestamp;
}

/**
 * Compare two {@link BlockRef} object to check
 * if one is before or equal to the other.
 */
export function isBeforeOrEqualTo(blockA: BlockRef, blockB: BlockRef) {
  return isBefore(blockA, blockB) || isEqualTo(blockA, blockB);
}
