import { describe, expect, it } from "vitest";

import { isBefore, isBeforeOrEqualTo, isEqualTo } from "./block-ref";

describe("block-ref comparisons", () => {
  describe("isBefore", () => {
    it("returns true when blockA has a lower number", () => {
      expect(isBefore({ number: 1, timestamp: 100 }, { number: 2, timestamp: 200 })).toBe(true);
    });

    it("returns false when blockA has a higher number", () => {
      expect(isBefore({ number: 2, timestamp: 200 }, { number: 1, timestamp: 100 })).toBe(false);
    });

    it("returns false when block numbers are equal", () => {
      expect(isBefore({ number: 1, timestamp: 100 }, { number: 1, timestamp: 100 })).toBe(false);
    });

    it("returns true when block numbers differ but timestamps are the same", () => {
      expect(isBefore({ number: 1, timestamp: 100 }, { number: 2, timestamp: 100 })).toBe(true);
    });
  });

  describe("isEqualTo", () => {
    it("returns true when both number and timestamp match", () => {
      expect(isEqualTo({ number: 1, timestamp: 100 }, { number: 1, timestamp: 100 })).toBe(true);
    });

    it("returns false when numbers differ", () => {
      expect(isEqualTo({ number: 1, timestamp: 100 }, { number: 2, timestamp: 100 })).toBe(false);
    });

    it("returns false when timestamps differ", () => {
      expect(isEqualTo({ number: 1, timestamp: 100 }, { number: 1, timestamp: 200 })).toBe(false);
    });
  });

  describe("isBeforeOrEqualTo", () => {
    it("returns true when blockA is before blockB", () => {
      expect(isBeforeOrEqualTo({ number: 1, timestamp: 100 }, { number: 2, timestamp: 200 })).toBe(
        true,
      );
    });

    it("returns true when blocks are equal", () => {
      expect(isBeforeOrEqualTo({ number: 1, timestamp: 100 }, { number: 1, timestamp: 100 })).toBe(
        true,
      );
    });

    it("returns false when blockA is after blockB", () => {
      expect(isBeforeOrEqualTo({ number: 2, timestamp: 200 }, { number: 1, timestamp: 100 })).toBe(
        false,
      );
    });

    it("returns true when block numbers differ but timestamps are the same", () => {
      expect(isBeforeOrEqualTo({ number: 1, timestamp: 100 }, { number: 2, timestamp: 100 })).toBe(
        true,
      );
    });

    it("returns false when block numbers are equal but timestamps differ", () => {
      expect(isBeforeOrEqualTo({ number: 1, timestamp: 100 }, { number: 1, timestamp: 200 })).toBe(
        false,
      );
    });
  });
});
