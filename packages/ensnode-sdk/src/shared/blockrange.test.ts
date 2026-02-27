import { describe, expect, it } from "vitest";

import { buildBlockNumberRange, buildBlockRefRange, RangeTypeIds } from "./blockrange";

describe("Blockrange", () => {
  describe("buildBlockNumberRange", () => {
    it("returns unbounded range", () => {
      const result = buildBlockNumberRange(undefined, undefined);

      expect(result).toStrictEqual({
        rangeType: RangeTypeIds.Unbounded,
      });
    });

    it("returns left-bounded range", () => {
      const result = buildBlockNumberRange(100, undefined);

      expect(result).toStrictEqual({
        rangeType: RangeTypeIds.LeftBounded,
        startBlock: 100,
      });
    });

    it("returns right-bounded range", () => {
      const result = buildBlockNumberRange(undefined, 200);

      expect(result).toStrictEqual({
        rangeType: RangeTypeIds.RightBounded,
        endBlock: 200,
      });
    });

    it("returns bounded range", () => {
      const result = buildBlockNumberRange(100, 200);

      expect(result).toStrictEqual({
        rangeType: RangeTypeIds.Bounded,
        startBlock: 100,
        endBlock: 200,
      });
    });

    it("returns bounded range when start equals end", () => {
      const result = buildBlockNumberRange(100, 100);

      expect(result).toStrictEqual({
        rangeType: RangeTypeIds.Bounded,
        startBlock: 100,
        endBlock: 100,
      });
    });

    it("throws when start is greater than end", () => {
      expect(() => buildBlockNumberRange(200, 100)).toThrow(
        "For a block number range startBlock must be lower than or equal to endBlock.",
      );
    });
  });

  describe("buildBlockRefRange", () => {
    const startBlockRef = { number: 100, timestamp: 1000 };
    const endBlockRef = { number: 200, timestamp: 2000 };

    it("returns unbounded range", () => {
      const result = buildBlockRefRange(undefined, undefined);

      expect(result).toStrictEqual({
        rangeType: RangeTypeIds.Unbounded,
      });
    });

    it("returns left-bounded range", () => {
      const result = buildBlockRefRange(startBlockRef, undefined);

      expect(result).toStrictEqual({
        rangeType: RangeTypeIds.LeftBounded,
        startBlock: startBlockRef,
      });
    });

    it("returns right-bounded range", () => {
      const result = buildBlockRefRange(undefined, endBlockRef);

      expect(result).toStrictEqual({
        rangeType: RangeTypeIds.RightBounded,
        endBlock: endBlockRef,
      });
    });

    it("returns bounded range", () => {
      const result = buildBlockRefRange(startBlockRef, endBlockRef);

      expect(result).toStrictEqual({
        rangeType: RangeTypeIds.Bounded,
        startBlock: startBlockRef,
        endBlock: endBlockRef,
      });
    });

    it("returns bounded range when start equals end", () => {
      const sameBlock = { number: 100, timestamp: 1000 };

      const result = buildBlockRefRange(sameBlock, sameBlock);

      expect(result).toStrictEqual({
        rangeType: RangeTypeIds.Bounded,
        startBlock: sameBlock,
        endBlock: sameBlock,
      });
    });

    it("throws when start is not before or equal to end", () => {
      expect(() => buildBlockRefRange(endBlockRef, startBlockRef)).toThrow(
        "For a block ref range startBlock must be before or equal to endBlock.",
      );
    });
  });
});
