import { isBeforeOrEqualTo as isBlockRefBeforeOrEqualTo } from "./block-ref";
import type { BlockNumber, BlockRef } from "./types";

export const RangeTypeIds = {
  Unbounded: "unbounded",
  LeftBounded: "left-bounded",
  RightBounded: "right-bounded",
  Bounded: "bounded",
} as const;

export type RangeType = (typeof RangeTypeIds)[keyof typeof RangeTypeIds];

/************************
 * Block number range
 ***********************/

/**
 * Block number range unbounded
 */
export interface BlockNumberRangeUnbounded {
  rangeType: typeof RangeTypeIds.Unbounded;
  startBlock?: undefined;
  endBlock?: undefined;
}

/**
 * Block number range left bounded
 *
 * Range is inclusive of its left bound.
 */
export interface BlockNumberRangeLeftBounded {
  rangeType: typeof RangeTypeIds.LeftBounded;
  startBlock: BlockNumber;
  endBlock?: undefined;
}

/**
 * Block number range right bounded
 *
 * Range is inclusive of its right bound.
 */
export interface BlockNumberRangeRightBounded {
  rangeType: typeof RangeTypeIds.RightBounded;
  startBlock?: undefined;
  endBlock: BlockNumber;
}

/**
 * Block number range bounded
 *
 * Range is inclusive of its bounds.
 *
 * Invariants:
 * - `startBlock` is lower than or equal to `endBlock`
 */
export interface BlockNumberRangeBounded {
  rangeType: typeof RangeTypeIds.Bounded;
  startBlock: BlockNumber;
  endBlock: BlockNumber;
}

/**
 * Block number range with start block defined.
 *
 * This is a useful type for representing block ranges for indexed chains.
 */
export type BlockNumberRangeWithStartBlock = BlockNumberRangeLeftBounded | BlockNumberRangeBounded;

/**
 * Block number range
 *
 * Use the `rangeType` field to determine the specific type interpretation
 * at runtime.
 */
export type BlockNumberRange =
  | BlockNumberRangeUnbounded
  | BlockNumberRangeLeftBounded
  | BlockNumberRangeRightBounded
  | BlockNumberRangeBounded;

/**
 * Build a block number range object.
 */
export function buildBlockNumberRange(
  startBlock: undefined,
  endBlock: undefined,
): BlockNumberRangeUnbounded;
export function buildBlockNumberRange(
  startBlock: BlockNumber,
  endBlock: undefined,
): BlockNumberRangeLeftBounded;
export function buildBlockNumberRange(
  startBlock: undefined,
  endBlock: BlockNumber,
): BlockNumberRangeRightBounded;
export function buildBlockNumberRange(
  startBlock: BlockNumber,
  endBlock: BlockNumber,
): BlockNumberRangeBounded;
export function buildBlockNumberRange(
  startBlock?: BlockNumber,
  endBlock?: BlockNumber,
): BlockNumberRange;
export function buildBlockNumberRange(
  startBlock?: BlockNumber,
  endBlock?: BlockNumber,
): BlockNumberRange {
  if (startBlock === undefined && endBlock === undefined) {
    return {
      rangeType: RangeTypeIds.Unbounded,
    } satisfies BlockNumberRangeUnbounded;
  }

  if (startBlock !== undefined && endBlock === undefined) {
    return {
      rangeType: RangeTypeIds.LeftBounded,
      startBlock,
    } satisfies BlockNumberRangeLeftBounded;
  }

  if (startBlock === undefined && endBlock !== undefined) {
    return {
      rangeType: RangeTypeIds.RightBounded,
      endBlock,
    } satisfies BlockNumberRangeRightBounded;
  }

  if (startBlock !== undefined && endBlock !== undefined) {
    // Invariant: `startBlock` is lower than or equal to `endBlock`
    if (startBlock > endBlock) {
      throw new Error(
        `For a block number range startBlock must be lower than or equal to endBlock.`,
      );
    }

    return {
      rangeType: RangeTypeIds.Bounded,
      startBlock,
      endBlock,
    } satisfies BlockNumberRangeBounded;
  }

  // This should be unreachable, but TypeScript needs the exhaustive check
  throw new Error("Invalid block number range. This should be unreachable.");
}

/**
 * Merge multiple block number ranges into a single range.
 *
 * The resulting range is a union that covers all input ranges:
 * - Uses the minimum defined start block (undefined if no ranges define a start block)
 * - Uses the maximum defined end block (undefined if no ranges define an end block)
 *
 * Returns an unbounded range if no ranges are provided.
 *
 * @param ranges - The block number ranges to merge
 * @returns A single merged block number range covering all inputs
 */
export function mergeBlockNumberRanges(...ranges: BlockNumberRange[]): BlockNumberRange {
  if (ranges.length === 0) {
    return buildBlockNumberRange(undefined, undefined);
  }

  let minStartBlock: BlockNumber | undefined;
  let maxEndBlock: BlockNumber | undefined;

  for (const range of ranges) {
    // Update min start block (lower values win, undefined is ignored)
    if (range.startBlock !== undefined) {
      if (minStartBlock === undefined || range.startBlock < minStartBlock) {
        minStartBlock = range.startBlock;
      }
    }

    // Update max end block (higher values win, undefined is ignored)
    if (range.endBlock !== undefined) {
      if (maxEndBlock === undefined || range.endBlock > maxEndBlock) {
        maxEndBlock = range.endBlock;
      }
    }
  }

  return buildBlockNumberRange(minStartBlock, maxEndBlock);
}

/************************
 * Block ref range
 ***********************/

/**
 * Block ref range unbounded
 */
export interface BlockRefRangeUnbounded {
  rangeType: typeof RangeTypeIds.Unbounded;
  startBlock?: undefined;
  endBlock?: undefined;
}

/**
 * Block ref range left bounded
 *
 * Range is inclusive of its left bound.
 */
export interface BlockRefRangeLeftBounded {
  rangeType: typeof RangeTypeIds.LeftBounded;
  startBlock: BlockRef;
  endBlock?: undefined;
}

/**
 * Block ref range right bounded
 *
 * Range is inclusive of its right bound.
 */
export interface BlockRefRangeRightBounded {
  rangeType: typeof RangeTypeIds.RightBounded;
  startBlock?: undefined;
  endBlock: BlockRef;
}

/**
 * Block ref range bounded
 *
 * Range is inclusive of its bounds.
 *
 * Invariants:
 * - `startBlock` is before or equal to `endBlock`
 */
export interface BlockRefRangeBounded {
  rangeType: typeof RangeTypeIds.Bounded;
  startBlock: BlockRef;
  endBlock: BlockRef;
}

/**
 * Block ref range
 *
 * Use the `rangeType` field to determine the specific type interpretation
 * at runtime.
 */
export type BlockRefRange =
  | BlockRefRangeUnbounded
  | BlockRefRangeLeftBounded
  | BlockRefRangeRightBounded
  | BlockRefRangeBounded;

/**
 * Block ref range with start block defined.
 *
 * This is a useful type for representing block ranges for indexed chains.
 */
export type BlockRefRangeWithStartBlock = BlockRefRangeLeftBounded | BlockRefRangeBounded;

/**
 * Build a block ref range object.
 */
export function buildBlockRefRange(
  startBlock: undefined,
  endBlock: undefined,
): BlockRefRangeUnbounded;
export function buildBlockRefRange(
  startBlock: BlockRef,
  endBlock: undefined,
): BlockRefRangeLeftBounded;
export function buildBlockRefRange(
  startBlock: undefined,
  endBlock: BlockRef,
): BlockRefRangeRightBounded;
export function buildBlockRefRange(startBlock: BlockRef, endBlock: BlockRef): BlockRefRangeBounded;
export function buildBlockRefRange(startBlock?: BlockRef, endBlock?: BlockRef): BlockRefRange;
export function buildBlockRefRange(startBlock?: BlockRef, endBlock?: BlockRef): BlockRefRange {
  if (startBlock === undefined && endBlock === undefined) {
    return {
      rangeType: RangeTypeIds.Unbounded,
    } satisfies BlockRefRangeUnbounded;
  }

  if (startBlock !== undefined && endBlock === undefined) {
    return {
      rangeType: RangeTypeIds.LeftBounded,
      startBlock,
    } satisfies BlockRefRangeLeftBounded;
  }

  if (startBlock === undefined && endBlock !== undefined) {
    return {
      rangeType: RangeTypeIds.RightBounded,
      endBlock,
    } satisfies BlockRefRangeRightBounded;
  }

  if (startBlock !== undefined && endBlock !== undefined) {
    // Invariant: `startBlock` is before or equal to `endBlock`
    if (isBlockRefBeforeOrEqualTo(startBlock, endBlock) === false) {
      throw new Error(`For a block ref range startBlock must be before or equal to endBlock.`);
    }

    return {
      rangeType: RangeTypeIds.Bounded,
      startBlock,
      endBlock,
    } satisfies BlockRefRangeBounded;
  }

  // This should be unreachable, but TypeScript needs the exhaustive check
  throw new Error("Invalid block ref range. This should be unreachable.");
}
