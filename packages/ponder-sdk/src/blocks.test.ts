import { describe, expect, it } from "vitest";

import { isBlockRefBefore, isBlockRefBeforeOrEqualTo, isBlockRefEqualTo } from "./blocks";

describe("BlockRef comparisons", () => {
  describe("isBlockRefBefore", () => {
    it("returns true when blockA has a lower number", () => {
      expect(isBlockRefBefore({ number: 1, timestamp: 100 }, { number: 2, timestamp: 200 })).toBe(
        true,
      );
    });

    it("returns false when blockA has a higher number", () => {
      expect(isBlockRefBefore({ number: 2, timestamp: 200 }, { number: 1, timestamp: 100 })).toBe(
        false,
      );
    });

    it("returns false when block numbers are equal", () => {
      expect(isBlockRefBefore({ number: 1, timestamp: 100 }, { number: 1, timestamp: 100 })).toBe(
        false,
      );
    });

    it("returns true when block numbers differ but timestamps are the same", () => {
      expect(isBlockRefBefore({ number: 1, timestamp: 100 }, { number: 2, timestamp: 100 })).toBe(
        true,
      );
    });
  });

  describe("isBlockRefEqualTo", () => {
    it("returns true when both number and timestamp match", () => {
      expect(isBlockRefEqualTo({ number: 1, timestamp: 100 }, { number: 1, timestamp: 100 })).toBe(
        true,
      );
    });

    it("returns false when numbers differ", () => {
      expect(isBlockRefEqualTo({ number: 1, timestamp: 100 }, { number: 2, timestamp: 100 })).toBe(
        false,
      );
    });

    it("returns false when timestamps differ", () => {
      expect(isBlockRefEqualTo({ number: 1, timestamp: 100 }, { number: 1, timestamp: 200 })).toBe(
        false,
      );
    });
  });

  describe("isBlockRefBeforeOrEqualTo", () => {
    it("returns true when blockA is before blockB", () => {
      expect(
        isBlockRefBeforeOrEqualTo({ number: 1, timestamp: 100 }, { number: 2, timestamp: 200 }),
      ).toBe(true);
    });

    it("returns true when blocks are equal", () => {
      expect(
        isBlockRefBeforeOrEqualTo({ number: 1, timestamp: 100 }, { number: 1, timestamp: 100 }),
      ).toBe(true);
    });

    it("returns false when blockA is after blockB", () => {
      expect(
        isBlockRefBeforeOrEqualTo({ number: 2, timestamp: 200 }, { number: 1, timestamp: 100 }),
      ).toBe(false);
    });

    it("returns true when block numbers differ but timestamps are the same", () => {
      expect(
        isBlockRefBeforeOrEqualTo({ number: 1, timestamp: 100 }, { number: 2, timestamp: 100 }),
      ).toBe(true);
    });

    it("returns false when block numbers are equal but timestamps differ", () => {
      expect(
        isBlockRefBeforeOrEqualTo({ number: 1, timestamp: 100 }, { number: 1, timestamp: 200 }),
      ).toBe(false);
    });
  });
});
