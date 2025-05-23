import { beforeEach, describe, expect, it } from "vitest";
import { resetMockConfig, setGlobalBlockrange, setupConfigMock } from "./utils/mockConfig";
setupConfigMock(); // setup config mock before importing dependent modules

import { constrainContractBlockrange, createStartBlockByChainIdMap } from "@/lib/ponder-helpers";

describe("ponder helpers", () => {
  // Reset mock config before each test
  beforeEach(() => {
    resetMockConfig();
  });

  describe("constrainContractBlockrange", () => {
    describe("without global range", () => {
      beforeEach(() => {
        setGlobalBlockrange(undefined, undefined);
      });

      it("should return valid startBlock and endBlock", () => {
        const range = constrainContractBlockrange(5);
        expect(range).toEqual({ startBlock: 5, endBlock: undefined });
      });

      it("should handle undefined contractStartBlock", () => {
        const range = constrainContractBlockrange(undefined);
        expect(range).toEqual({ startBlock: 0, endBlock: undefined });
      });
    });

    describe("with global range", () => {
      beforeEach(() => {
        setGlobalBlockrange(undefined, 1234);
      });

      it("should respect global end block", () => {
        const config = constrainContractBlockrange(5);
        expect(config).toEqual({ startBlock: 5, endBlock: 1234 });
      });

      it("should handle undefined contract start block", () => {
        const config = constrainContractBlockrange(undefined);
        expect(config).toEqual({ startBlock: 0, endBlock: 1234 });
      });

      it("should use contract start block if later than global start", () => {
        setGlobalBlockrange(10, 1234);

        const config = constrainContractBlockrange(20);
        expect(config).toEqual({ startBlock: 20, endBlock: 1234 });
      });

      it("should use global start block if later than contract start", () => {
        setGlobalBlockrange(30, 1234);

        const config = constrainContractBlockrange(20);
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
