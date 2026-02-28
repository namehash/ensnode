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
