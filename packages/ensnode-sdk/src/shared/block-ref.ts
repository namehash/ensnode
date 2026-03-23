import type { BlockRef } from "./types";

/**
 * Compare two {@link BlockRef} objects to check
 * if blockA is before blockB.
 *
 * Ordering is determined by block number, which is the canonical
 * ordering on a single chain. Timestamp is not used because EVM
 * chains allow consecutive blocks to share the same timestamp.
 */
export function isBefore(blockA: BlockRef, blockB: BlockRef) {
  return blockA.number < blockB.number;
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
