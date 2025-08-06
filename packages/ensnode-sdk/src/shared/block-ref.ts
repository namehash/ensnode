import type { BlockRef } from "./types";

/**
 * Compare two {@link BlockRef} object to check
 * if blockA is before blockB.
 */
export function isBefore(blockA: BlockRef, blockB: BlockRef) {
  return blockA.number < blockB.number && blockA.timestamp < blockB.timestamp;
}

/**
 * Compare two {@link BlockRef} object to check
 * if blockA is equal to blockB.
 */
export function isEqualTo(blockA: BlockRef, blockB: BlockRef) {
  return blockA.number === blockB.number && blockA.timestamp === blockB.timestamp;
}

/**
 * Compare two {@link BlockRef} object to check
 * if blockA is before or equal to blockB.
 */
export function isBeforeOrEqualTo(blockA: BlockRef, blockB: BlockRef) {
  return isBefore(blockA, blockB) || isEqualTo(blockA, blockB);
}
