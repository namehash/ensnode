import { z } from "zod/v4";

import { schemaNonnegativeInteger } from "./numbers";
import { schemaUnixTimestamp } from "./time";

//// Block Number

export const schemaBlockNumber = schemaNonnegativeInteger;

/**
 * Block Number
 *
 * Guaranteed to be a non-negative integer.
 */
export type BlockNumber = z.infer<typeof schemaBlockNumber>;

export const schemaBlockRef = z.object({
  number: schemaBlockNumber,
  timestamp: schemaUnixTimestamp,
});

/**
 * BlockRef
 *
 * Reference to a block.
 */
export type BlockRef = z.infer<typeof schemaBlockRef>;

/**
 * Compare two {@link BlockRef} objects to check
 * if blockA is before blockB.
 *
 * Ordering is determined by block number, which is the canonical
 * ordering on a single chain. Timestamp is not used because EVM
 * chains allow consecutive blocks to share the same timestamp.
 */
export function isBlockRefBefore(blockA: BlockRef, blockB: BlockRef) {
  return blockA.number < blockB.number;
}

/**
 * Compare two {@link BlockRef} objects to check
 * if blockA is equal to blockB.
 */
export function isBlockRefEqualTo(blockA: BlockRef, blockB: BlockRef) {
  return blockA.number === blockB.number && blockA.timestamp === blockB.timestamp;
}

/**
 * Compare two {@link BlockRef} objects to check
 * if blockA is before or equal to blockB.
 */
export function isBlockRefBeforeOrEqualTo(blockA: BlockRef, blockB: BlockRef) {
  return isBlockRefBefore(blockA, blockB) || isBlockRefEqualTo(blockA, blockB);
}
