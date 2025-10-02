import { describe, expect, it } from "vitest";

import { constrainBlockrange, createStartBlockByChainIdMap } from "@/lib/ponder-helpers";
import { Blockrange } from "@/lib/types";

const UNDEFINED_BLOCKRANGE = { startBlock: undefined, endBlock: undefined } satisfies Blockrange;
const BLOCKRANGE_WITH_END = { startBlock: undefined, endBlock: 1234 } satisfies Blockrange;

describe("ponder helpers", () => {
  describe("constrainBlockrange", () => {
    describe("without global range", () => {
      it("should return valid contract startBlock", () => {
        const range = constrainBlockrange(UNDEFINED_BLOCKRANGE, {
          startBlock: 5,
        } satisfies Blockrange);
        expect(range).toEqual({ startBlock: 5, endBlock: undefined });
      });

      it("should return valid contract endBlock", () => {
        const range = constrainBlockrange(UNDEFINED_BLOCKRANGE, {
          endBlock: 5,
        } satisfies Blockrange);
        expect(range).toEqual({ startBlock: 0, endBlock: 5 });
      });

      it("should return valid contract startBlock and endBlock", () => {
        const range = constrainBlockrange(UNDEFINED_BLOCKRANGE, {
          startBlock: 1,
          endBlock: 5,
        } satisfies Blockrange);
        expect(range).toEqual({ startBlock: 1, endBlock: 5 });
      });

      it("should handle undefined contract startBlock and endBlock", () => {
        const range = constrainBlockrange(UNDEFINED_BLOCKRANGE, {} satisfies Blockrange);
        expect(range).toEqual({ startBlock: 0, endBlock: undefined });
      });
    });

    describe("with global range", () => {
      it("should respect global end block", () => {
        const config = constrainBlockrange(BLOCKRANGE_WITH_END, {
          startBlock: 5,
        } satisfies Blockrange);
        expect(config).toEqual({ startBlock: 5, endBlock: 1234 });
      });

      it("should handle undefined contract start block", () => {
        const config = constrainBlockrange(BLOCKRANGE_WITH_END, {} satisfies Blockrange);
        expect(config).toEqual({ startBlock: 0, endBlock: 1234 });
      });

      it("should use contract start block if later than global start block", () => {
        const config = constrainBlockrange(
          { startBlock: 10, endBlock: 1234 } satisfies Blockrange,
          {
            startBlock: 20,
          } satisfies Blockrange,
        );
        expect(config).toEqual({ startBlock: 20, endBlock: 1234 });
      });

      it("should use global start block if later than contract start block", () => {
        const config = constrainBlockrange(
          { startBlock: 30, endBlock: 1234 } satisfies Blockrange,
          {
            startBlock: 20,
          } satisfies Blockrange,
        );
        expect(config).toEqual({ startBlock: 30, endBlock: 1234 });
      });

      it("should use contract end block if earlier than global end block", () => {
        const config = constrainBlockrange(
          { startBlock: 10, endBlock: 1234 } satisfies Blockrange,
          {
            startBlock: 20,
            endBlock: 5555,
          } satisfies Blockrange,
        );
        expect(config).toEqual({ startBlock: 20, endBlock: 1234 });
      });

      it("should use global end block if earlier than contract end block", () => {
        const config = constrainBlockrange({ startBlock: 30, endBlock: 1234 }, {
          startBlock: 20,
        } satisfies Blockrange);
        expect(config).toEqual({ startBlock: 30, endBlock: 1234 });
      });
    });
  });

  describe("createStartBlockByChainIdMap", () => {
    it("should return a map of start blocks by chain ID", async () => {
      const partialPonderConfig = {
        contracts: {
          "subgraph/Registrar": {
            chain: {
              "1": { id: 1, startBlock: 444_444_444 },
            },
          },
          "subgraph/Registry": {
            chain: {
              "1": { id: 1, startBlock: 444_444_333 },
            },
          },
          "basenames/Registrar": {
            chain: {
              "8453": { id: 8453, startBlock: 1_799_433 },
            },
          },
          "basenames/Registry": {
            chain: {
              "8453": { id: 8453, startBlock: 1_799_430 },
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
