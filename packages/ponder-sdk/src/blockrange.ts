import type { BlockNumber, BlockRef } from "./blocks";

export const RangeTypes = {
  Indefinite: "indefinite",
  Definite: "definite",
} as const;

export type RangeType = (typeof RangeTypes)[keyof typeof RangeTypes];

export interface BlockNumberRangeIndefinite {
  rangeType: typeof RangeTypes.Indefinite;
  /** @deprecated use rangeType instead */
  configType: typeof RangeTypes.Indefinite;
  startBlock: BlockNumber;
  endBlock: null;
}

export interface BlockNumberRangeDefinite {
  rangeType: typeof RangeTypes.Definite;
  /** @deprecated use rangeType instead */
  configType: typeof RangeTypes.Definite;
  startBlock: BlockNumber;
  endBlock: BlockNumber;
}

export type BlockNumberRange = BlockNumberRangeDefinite | BlockNumberRangeIndefinite;

export function buildBlockNumberRange(
  startBlock: BlockNumber,
  endBlock: null,
): BlockNumberRangeIndefinite;
export function buildBlockNumberRange(
  startBlock: BlockNumber,
  endBlock: BlockNumber,
): BlockNumberRangeDefinite;
export function buildBlockNumberRange(
  startBlock: BlockNumber,
  endBlock: BlockNumber | null,
): BlockNumberRange;
export function buildBlockNumberRange(
  startBlock: BlockNumber,
  endBlock: BlockNumber | null,
): BlockNumberRange {
  if (endBlock === null) {
    return {
      rangeType: RangeTypes.Indefinite,
      configType: RangeTypes.Indefinite,
      startBlock,
      endBlock: null,
    };
  }

  return {
    rangeType: RangeTypes.Definite,
    configType: RangeTypes.Definite,
    startBlock,
    endBlock,
  };
}

export interface BlockRefRangeIndefinite {
  rangeType: typeof RangeTypes.Indefinite;
  /** @deprecated use rangeType instead */
  configType: typeof RangeTypes.Indefinite;
  startBlock: BlockRef;
  endBlock: null;
}

export interface BlockRefRangeDefinite {
  rangeType: typeof RangeTypes.Definite;
  /** @deprecated use rangeType instead */
  configType: typeof RangeTypes.Definite;
  startBlock: BlockRef;
  endBlock: BlockRef;
}

export type BlockRefRange = BlockRefRangeDefinite | BlockRefRangeIndefinite;

export function buildBlockRefRange(startBlock: BlockRef, endBlock: null): BlockRefRangeIndefinite;
export function buildBlockRefRange(startBlock: BlockRef, endBlock: BlockRef): BlockRefRangeDefinite;
export function buildBlockRefRange(startBlock: BlockRef, endBlock: BlockRef | null): BlockRefRange;
export function buildBlockRefRange(startBlock: BlockRef, endBlock: BlockRef | null): BlockRefRange {
  if (endBlock === null) {
    return {
      rangeType: RangeTypes.Indefinite,
      configType: RangeTypes.Indefinite,
      startBlock,
      endBlock: null,
    };
  }

  return {
    rangeType: RangeTypes.Definite,
    configType: RangeTypes.Definite,
    startBlock,
    endBlock,
  };
}
