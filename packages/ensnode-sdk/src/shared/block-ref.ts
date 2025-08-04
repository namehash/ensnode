import type { BlockRef } from "./types";

/**
 * Compare two {@link BlockRef} object to check
 * if one is before or same as the other.
 */
export function isBeforeOrSameAs(blockA: BlockRef, blockB: BlockRef) {
  // compare block creation dates
  if (blockA.createdAt.getTime() <= blockB.createdAt.getTime()) return true;

  // compare block numbers
  if (blockA.number <= blockB.number) {
    return true;
  }

  return false;
}

/**
 * Compare two {@link BlockRef} object to check
 * if one is same as the other.
 */
export function isSameAs(blockA: BlockRef, blockB: BlockRef) {
  // compare block creation dates
  if (blockA.createdAt.getTime() === blockB.createdAt.getTime()) return true;

  // compare block numbers
  if (blockA.number === blockB.number) {
    return true;
  }

  return false;
}
