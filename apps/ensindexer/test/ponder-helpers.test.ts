import {
  DEFAULT_RPC_RATE_LIMIT,
  constrainContractBlockrange,
  createStartBlockByChainIdMap,
  parseRpcEndpointUrl,
  parseRpcMaxRequestsPerSecond,
  parseUrl,
} from "@/lib/ponder-helpers";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("ponder helpers", () => {
  describe("constrainContractBlockrange", () => {
    describe("without global range", () => {
      beforeEach(() => {
        vi.stubEnv("START_BLOCK", "");
        vi.stubEnv("END_BLOCK", "");
      });

      afterEach(() => {
        vi.unstubAllEnvs();
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
        vi.stubEnv("END_BLOCK", "1234");
      });

      afterEach(() => {
        vi.unstubAllEnvs();
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
        vi.stubEnv("START_BLOCK", "10");

        const config = constrainContractBlockrange(20);
        expect(config).toEqual({ startBlock: 20, endBlock: 1234 });
      });

      it("should use global start block if later than contract start", () => {
        vi.stubEnv("START_BLOCK", "30");

        const config = constrainContractBlockrange(20);
        expect(config).toEqual({ startBlock: 30, endBlock: 1234 });
      });
    });
  });

  describe("parseRpcEndpointUrl", () => {
    it("should parse a valid RPC URL", () => {
      expect(parseRpcEndpointUrl("https://eth.drpc.org")).toBe("https://eth.drpc.org/");
    });

    it("should throw an error if the URL is invalid", () => {
      expect(() => parseRpcEndpointUrl("invalid")).toThrowError(/is not a valid URL/);
    });

    it("should return undefined if the URL is missing", () => {
      expect(parseRpcEndpointUrl()).toBeUndefined();
    });
  });

  describe("parseRpcMaxRequestsPerSecond", () => {
    it("should parse the RPC rate limit as a number", () => {
      expect(parseRpcMaxRequestsPerSecond("10")).toBe(10);
    });

    it("should return the default rate limit if the value is undefined", () => {
      expect(parseRpcMaxRequestsPerSecond()).toBe(DEFAULT_RPC_RATE_LIMIT);
    });

    it("should throw an error if the value is invalid", () => {
      expect(() => parseRpcMaxRequestsPerSecond("invalid")).toThrowError(
        "'invalid' is not a number",
      );
    });

    it("should throw an error if the value is out of bounds", () => {
      expect(() => parseRpcMaxRequestsPerSecond("0")).toThrowError("'0' is not a positive integer");
      expect(() => parseRpcMaxRequestsPerSecond("-1")).toThrowError(
        "'-1' is not a positive integer",
      );
    });
  });

  describe("parseUrl", () => {
    it("should parse the public URL", () => {
      expect(parseUrl("https://public.ensnode.io")).toBe("https://public.ensnode.io/");
    });

    it("should throw an error if the URL is invalid", () => {
      expect(() => parseUrl("https//public.ensnode.io")).toThrowError(
        "'https//public.ensnode.io' is not a valid URL",
      );
    });

    it("should throw an error if the URL is missing", () => {
      expect(() => parseUrl()).toThrowError("Expected value not set");
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
