import { describe, expect, it } from "vitest";

import { mergeBlockranges } from "./blockrange";
import type { Blockrange } from "./types";

describe("blockrange", () => {
  describe("mergeBlockranges()", () => {
    it("uses the minimum start block and maximum end block", () => {
      expect(
        mergeBlockranges({ startBlock: 100, endBlock: 200 }, { startBlock: 50, endBlock: 250 }),
      ).toEqual({ startBlock: 50, endBlock: 250 });
    });

    it("keeps the defined end block when only one is present", () => {
      expect(mergeBlockranges({ startBlock: 10, endBlock: 20 }, { startBlock: 5 })).toEqual({
        startBlock: 5,
        endBlock: 20,
      });

      expect(mergeBlockranges({ startBlock: 10 }, { startBlock: 5, endBlock: 25 })).toEqual({
        startBlock: 5,
        endBlock: 25,
      });
    });

    it("returns an open-ended range when both ends are undefined", () => {
      expect(mergeBlockranges({ startBlock: 42 }, { startBlock: 7 })).toEqual({
        startBlock: 7,
        endBlock: undefined,
      });
    });

    it("supports the overload where the first range has no start block", () => {
      const openStartRange: Blockrange = { endBlock: 25 };

      expect(mergeBlockranges(openStartRange, { startBlock: 10 })).toEqual({
        startBlock: 10,
        endBlock: 25,
      });
    });
  });
});
