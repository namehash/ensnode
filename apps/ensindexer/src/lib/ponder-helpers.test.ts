import { describe, expect, it } from "vitest";

import { buildBlockNumberRange } from "@ensnode/ponder-sdk";

import { constrainBlockrange, createStartBlockByChainIdMap } from "./ponder-helpers";

const UNDEFINED_BLOCKRANGE = buildBlockNumberRange(undefined, undefined);
const BLOCKRANGE_WITH_END = buildBlockNumberRange(undefined, 1234);

describe("ponder helpers", () => {
  describe("constrainBlockrange", () => {
    describe("without global range", () => {
      it("should return valid contract startBlock", () => {
        const range = constrainBlockrange(
          UNDEFINED_BLOCKRANGE,
          buildBlockNumberRange(5, undefined),
        );
        expect(range).toEqual(buildBlockNumberRange(5, undefined));
      });

      it("should return valid contract endBlock", () => {
        const range = constrainBlockrange(
          UNDEFINED_BLOCKRANGE,
          buildBlockNumberRange(undefined, 5),
        );
        expect(range).toEqual(buildBlockNumberRange(0, 5));
      });

      it("should return valid contract startBlock and endBlock", () => {
        const range = constrainBlockrange(UNDEFINED_BLOCKRANGE, buildBlockNumberRange(1, 5));
        expect(range).toEqual(buildBlockNumberRange(1, 5));
      });

      it("should handle undefined contract startBlock and endBlock", () => {
        const range = constrainBlockrange(
          UNDEFINED_BLOCKRANGE,
          buildBlockNumberRange(undefined, undefined),
        );
        expect(range).toEqual(buildBlockNumberRange(0, undefined));
      });
    });

    describe("with global range", () => {
      it("should respect global end block", () => {
        const config = constrainBlockrange(
          BLOCKRANGE_WITH_END,
          buildBlockNumberRange(5, undefined),
        );
        expect(config).toEqual(buildBlockNumberRange(5, 1234));
      });

      it("should handle undefined contract start block", () => {
        const config = constrainBlockrange(
          BLOCKRANGE_WITH_END,
          buildBlockNumberRange(undefined, undefined),
        );
        expect(config).toEqual(buildBlockNumberRange(0, 1234));
      });

      it("should use contract start block if later than global start block", () => {
        const config = constrainBlockrange(
          buildBlockNumberRange(10, 1234),
          buildBlockNumberRange(20, undefined),
        );
        expect(config).toEqual(buildBlockNumberRange(20, 1234));
      });

      it("should use global start block if later than contract start block", () => {
        const config = constrainBlockrange(
          buildBlockNumberRange(30, 1234),
          buildBlockNumberRange(20, undefined),
        );
        expect(config).toEqual(buildBlockNumberRange(30, 1234));
      });

      it("should use contract end block if earlier than global end block", () => {
        const config = constrainBlockrange(
          buildBlockNumberRange(10, 1234),
          buildBlockNumberRange(20, 5555),
        );
        expect(config).toEqual(buildBlockNumberRange(20, 1234));
      });

      it("should use global end block if earlier than contract end block", () => {
        const config = constrainBlockrange(
          buildBlockNumberRange(30, 1234),
          buildBlockNumberRange(20, undefined),
        );
        expect(config).toEqual(buildBlockNumberRange(30, 1234));
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
