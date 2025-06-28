import { describe, expect, it } from "vitest";

import { constrainBlockrange, createStartBlockByChainIdMap } from "@/lib/ponder-helpers";
import { Blockrange } from "@/lib/types";

const UNDEFINED_BLOCKRANGE = { startBlock: undefined, endBlock: undefined } satisfies Blockrange;
const BLOCKRANGE_WITH_END = { startBlock: undefined, endBlock: 1234 } satisfies Blockrange;

describe("ponder helpers", () => {
  describe("constrainBlockrange", () => {
    describe("without global range", () => {
      it("should return valid startBlock and endBlock", () => {
        const range = constrainBlockrange(UNDEFINED_BLOCKRANGE, 5);
        expect(range).toEqual({ startBlock: 5, endBlock: undefined });
      });

      it("should handle undefined contractStartBlock", () => {
        const range = constrainBlockrange(UNDEFINED_BLOCKRANGE, undefined);
        expect(range).toEqual({ startBlock: 0, endBlock: undefined });
      });
    });

    describe("with global range", () => {
      it("should respect global end block", () => {
        const config = constrainBlockrange(BLOCKRANGE_WITH_END, 5);
        expect(config).toEqual({ startBlock: 5, endBlock: 1234 });
      });

      it("should handle undefined contract start block", () => {
        const config = constrainBlockrange(BLOCKRANGE_WITH_END, undefined);
        expect(config).toEqual({ startBlock: 0, endBlock: 1234 });
      });

      it("should use contract start block if later than global start", () => {
        const config = constrainBlockrange({ startBlock: 10, endBlock: 1234 }, 20);
        expect(config).toEqual({ startBlock: 20, endBlock: 1234 });
      });

      it("should use global start block if later than contract start", () => {
        const config = constrainBlockrange({ startBlock: 30, endBlock: 1234 }, 20);
        expect(config).toEqual({ startBlock: 30, endBlock: 1234 });
      });
    });
  });

  describe("createStartBlockByChainIdMap", () => {
    it("should return a map of start blocks by chain ID", async () => {
      const partialPonderConfig = {
        contracts: {
          "subgraph/Registrar": {
            network: {
              "1": { startBlock: 444_444_444 },
            },
          },
          "subgraph/Registry": {
            network: {
              "1": { startBlock: 444_444_333 },
            },
          },
          "basenames/Registrar": {
            network: {
              "8453": { startBlock: 1_799_433 },
            },
          },
          "basenames/Registry": {
            network: {
              "8453": { startBlock: 1_799_430 },
            },
          },
        },
      };

      expect(await createStartBlockByChainIdMap(Promise.resolve(partialPonderConfig))).toEqual({
        1: 444_444_333,
        8453: 1_799_430,
      });
    });
  });
});
