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
 */
export function isBlockRefBefore(blockA: BlockRef, blockB: BlockRef) {
  return blockA.number < blockB.number && blockA.timestamp < blockB.timestamp;
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

/**
 * Block range
 *
 * Represents a range of blocks
 */
export interface Blockrange {
  /**
   * Start block number
   *
   * Guaranteed to be lower than `endBlock` when both are present.
   */
  startBlock?: BlockNumber;

  /**
   * End block number
   *
   * Guaranteed to be greater than `startBlock` when both are present.
   */
  endBlock?: BlockNumber;
}

/**
 * Block range with required start block
 *
 * Represents a range of blocks where the start block is required and the end
 * block is optional.
 */
export interface BlockrangeWithStartBlock {
  /**
   * Start block number
   *
   * Guaranteed to be lower than `endBlock` when both are present.
   */
  startBlock: BlockNumber;

  /**
   * End block number
   *
   * Guaranteed to be greater than `startBlock` when both are present.
   */
  endBlock?: BlockNumber;
}
