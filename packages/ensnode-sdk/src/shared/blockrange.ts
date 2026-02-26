import type { BlockNumber, Blockrange, BlockrangeWithStartBlock } from "./types";

/**
 * Merges two blockranges by taking the minimum start block and maximum end block.
 *
 * @param blockrangeA The first blockrange to merge.
 * @param blockrangeB The second blockrange to merge.
 *
 * @returns The merged blockrange.
 */
export function mergeBlockranges(
  blockrangeA: BlockrangeWithStartBlock,
  blockrangeB: Blockrange,
): BlockrangeWithStartBlock;
export function mergeBlockranges(
  blockrangeA: Blockrange,
  blockrangeB: BlockrangeWithStartBlock,
): BlockrangeWithStartBlock;
export function mergeBlockranges(blockrangeA: Blockrange, blockrangeB: Blockrange): Blockrange;
export function mergeBlockranges(blockrangeA: Blockrange, blockrangeB: Blockrange): Blockrange {
  let startBlock: BlockNumber | undefined;

  if (blockrangeA.startBlock !== undefined && blockrangeB.startBlock !== undefined) {
    startBlock = Math.min(blockrangeA.startBlock, blockrangeB.startBlock);
  } else {
    startBlock = blockrangeA.startBlock ?? blockrangeB.startBlock;
  }

  let endBlock: BlockNumber | undefined;

  if (blockrangeA.endBlock !== undefined && blockrangeB.endBlock !== undefined) {
    endBlock = Math.max(blockrangeA.endBlock, blockrangeB.endBlock);
  } else {
    endBlock = blockrangeA.endBlock ?? blockrangeB.endBlock;
  }

  return { startBlock, endBlock };
}
