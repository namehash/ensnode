import { describe, expect, it } from "vitest";

import { buildBlockNumberRange, mergeBlockNumberRanges, RangeTypes } from "./blockrange";

describe("blockrange", () => {
  describe("mergeBlockNumberRanges()", () => {
    it("uses the minimum start block and maximum end block", () => {
      expect(
        mergeBlockNumberRanges(buildBlockNumberRange(100, 200), buildBlockNumberRange(50, 250)),
      ).toEqual(buildBlockNumberRange(50, 250));
    });

    it("keeps the defined end block when only one is present", () => {
      expect(
        mergeBlockNumberRanges(buildBlockNumberRange(10, 20), buildBlockNumberRange(5, null)),
      ).toEqual(buildBlockNumberRange(5, 20));

      expect(
        mergeBlockNumberRanges(buildBlockNumberRange(10, null), buildBlockNumberRange(5, 25)),
      ).toEqual(buildBlockNumberRange(5, 25));
    });

    it("returns an indefinite range when both ends are null", () => {
      expect(
        mergeBlockNumberRanges(buildBlockNumberRange(42, null), buildBlockNumberRange(7, null)),
      ).toEqual({
        rangeType: RangeTypes.Indefinite,
        configType: RangeTypes.Indefinite,
        startBlock: 7,
        endBlock: null,
      });
    });
  });
});
