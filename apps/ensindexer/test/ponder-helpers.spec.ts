import { DEFAULT_ENSRAINBOW_URL } from "@ensnode/ensrainbow-sdk";
import { describe, expect, it } from "vitest";
import {
  DEFAULT_RPC_RATE_LIMIT,
  constrainBlockrange,
  createStartBlockByChainIdMap,
  deepMergeRecursive,
  parseEnsNodePublicUrl,
  parseEnsRainbowEndpointUrl,
  parsePonderPort,
  parseRequestedPluginNames,
  parseRpcEndpointUrl,
  parseRpcMaxRequestsPerSecond,
} from "../src/lib/ponder-helpers";

describe("ponder helpers", () => {
  describe("blockConfig", () => {
    it("should return valid startBlock and endBlock", () => {
      const config = constrainBlockrange(5, 10, 20);
      expect(config).toEqual({ startBlock: 10, endBlock: 20 });
    });

    it("should handle undefined start and end", () => {
      const config = constrainBlockrange(undefined, 10, undefined);
      expect(config).toEqual({ startBlock: 10, endBlock: undefined });
    });
  });

  describe("parseRpcEndpointUrl", () => {
    it("should parse a valid RPC URL", () => {
      expect(parseRpcEndpointUrl("https://eth.drpc.org")).toBe("https://eth.drpc.org/");
    });

    it("should throw an error if the URL is invalid", () => {
      expect(() => parseRpcEndpointUrl("invalid")).toThrowError("'invalid' is not a valid URL");
    });

    it("should throw an error if the URL is missing", () => {
      expect(() => parseRpcEndpointUrl()).toThrowError("Expected value not set");
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

  describe("parseEnsRainbowEndpointUrl", () => {
    it("should parse a custom ENSRainbow endpoint URL", () => {
      expect(parseEnsRainbowEndpointUrl("https://api.ens.rocks")).toBe("https://api.ens.rocks/");
    });

    it("should throw an error if the URL is invalid", () => {
      expect(() => parseEnsRainbowEndpointUrl("almost_an_URL")).toThrowError(
        "'almost_an_URL' is not a valid URL",
      );
    });

    it("should return the default URL if the URL is missing", () => {
      expect(parseEnsRainbowEndpointUrl()).toBe(DEFAULT_ENSRAINBOW_URL);
    });
  });

  describe("parseEnsNodePublicUrl", () => {
    it("should parse the public URL", () => {
      expect(parseEnsNodePublicUrl("https://public.ensnode.io")).toBe("https://public.ensnode.io/");
    });

    it("should throw an error if the URL is invalid", () => {
      expect(() => parseEnsNodePublicUrl("https//public.ensnode.io")).toThrowError(
        "'https//public.ensnode.io' is not a valid URL",
      );
    });

    it("should throw an error if the URL is missing", () => {
      expect(() => parseEnsNodePublicUrl()).toThrowError("Expected value not set");
    });
  });

  describe("parseRequestedPluginNames", () => {
    it("should parse a list of comma-separated values", () => {
      expect(parseRequestedPluginNames("abc")).toEqual(["abc"]);

      expect(parseRequestedPluginNames("def,ghi")).toEqual(["def", "ghi"]);
    });

    it("should throw an error if the list is not set", () => {
      expect(() => parseRequestedPluginNames()).toThrowError("Expected value not set");
    });
  });

  describe("parsePonderPort", () => {
    it("should return the port if the environment variable is set correctly", () => {
      expect(parsePonderPort("3000")).toBe(3000);
    });

    it("should throw an error if the port is not a number", () => {
      expect(() => parsePonderPort("abc")).toThrowError("'abc' is not a number");
    });

    it("should throw an error if the port is not a natural number", () => {
      expect(() => parsePonderPort("-1")).toThrowError("'-1' is not a natural number");
    });

    it("should throw an error if the port is missing", () => {
      expect(() => parsePonderPort()).toThrowError("Expected value not set");
    });
  });

  describe("createStartBlockByChainIdMap", () => {
    it("should return a map of start blocks by chain ID", async () => {
      const partialPonderConfig = {
        contracts: {
          "/eth/Registrar": {
            network: {
              "1": { startBlock: 444_444_444 },
            },
          },
          "/eth/Registry": {
            network: {
              "1": { startBlock: 444_444_333 },
            },
          },
          "/eth/base/Registrar": {
            network: {
              "8453": { startBlock: 1_799_433 },
            },
          },
          "/eth/base/Registry": {
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

  describe("deepMergeRecursive", () => {
    it("should deeply merge two objects", () => {
      const target = { a: 1, b: { c: 2 } };
      const source = { b: { d: 3 }, e: 4 };
      const result = deepMergeRecursive(target, source);
      expect(result).toEqual({ a: 1, b: { c: 2, d: 3 }, e: 4 });
    });
  });
});
