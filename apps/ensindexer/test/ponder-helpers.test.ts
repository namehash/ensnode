import {
  DEFAULT_HEAL_REVERSE_ADDRESSES,
  DEFAULT_RPC_RATE_LIMIT,
  constrainContractBlockrange,
  createStartBlockByChainIdMap,
  deepMergePonderConfigs,
  getGlobalBlockrange,
  healReverseAddresses,
  parseEnsRainbowEndpointUrl,
  parsePonderPort,
  parseRequestedPluginNames,
  parseRpcEndpointUrl,
  parseRpcMaxRequestsPerSecond,
  parseUrl,
} from "@/lib/ponder-helpers";
import { DEFAULT_ENSRAINBOW_URL } from "@ensnode/ensrainbow-sdk";
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

  describe("getGlobalBlockrange", () => {
    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it("should return valid startBlock and endBlock", () => {
      vi.stubEnv("START_BLOCK", "1234");
      vi.stubEnv("END_BLOCK", "9999");

      const range = getGlobalBlockrange();
      expect(range).toEqual({ startBlock: 1234, endBlock: 9999 });
    });

    it("should throw error for non-numeric values", () => {
      vi.stubEnv("START_BLOCK", "abc");
      expect(() => getGlobalBlockrange()).toThrowError(/must be/i);
    });

    it("should throw error for non-numeric values", () => {
      vi.stubEnv("END_BLOCK", "abc");
      expect(() => getGlobalBlockrange()).toThrowError(/must be/i);
    });

    it("should throw error", () => {
      vi.stubEnv("START_BLOCK", "9999");
      vi.stubEnv("END_BLOCK", "1234");

      expect(() => getGlobalBlockrange()).toThrowError(/must be/i);
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

  describe("parseRequestedPluginNames", () => {
    it("should parse a list of comma-separated values", () => {
      expect(parseRequestedPluginNames("abc")).toEqual(["abc"]);

      expect(parseRequestedPluginNames("def,ghi")).toEqual(["def", "ghi"]);
    });

    it("should throw an error if the list is not set", () => {
      expect(() => parseRequestedPluginNames()).toThrowError("Expected value not set");
    });
  });

  describe("healReverseAddresses", () => {
    describe("unspecified", () => {
      afterEach(() => vi.unstubAllEnvs());

      it("should return the default", () => {
        vi.stubEnv("HEAL_REVERSE_ADDRESSES", "");
        expect(healReverseAddresses()).toBe(DEFAULT_HEAL_REVERSE_ADDRESSES);
      });
    });

    describe("specified", () => {
      afterEach(() => vi.unstubAllEnvs());
      it("should handle true", () => {
        vi.stubEnv("HEAL_REVERSE_ADDRESSES", "true");
        expect(healReverseAddresses()).toBe(true);
      });
      it("should handle false", () => {
        vi.stubEnv("HEAL_REVERSE_ADDRESSES", "false");
        expect(healReverseAddresses()).toBe(false);
      });
    });

    describe("malformed", () => {
      afterEach(() => vi.unstubAllEnvs());
      it("should throw", () => {
        vi.stubEnv("HEAL_REVERSE_ADDRESSES", "1");
        expect(() => healReverseAddresses()).toThrowError(/Error parsing environment variable/i);

        vi.stubEnv("HEAL_REVERSE_ADDRESSES", "0");
        expect(() => healReverseAddresses()).toThrowError(/Error parsing environment variable/i);

        vi.stubEnv("HEAL_REVERSE_ADDRESSES", "on");
        expect(() => healReverseAddresses()).toThrowError(/Error parsing environment variable/i);

        vi.stubEnv("HEAL_REVERSE_ADDRESSES", "off");
        expect(() => healReverseAddresses()).toThrowError(/Error parsing environment variable/i);
      });
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

  describe("deepMergePonderConfigs", () => {
    it("should deeply merge two objects", () => {
      const target = { a: 1, b: { c: 2 } };
      const source = { b: { d: 3 }, e: 4 };
      expect(deepMergePonderConfigs(target, source)).toEqual({ a: 1, b: { c: 2, d: 3 }, e: 4 });
    });

    it("should de-duplicate abis instead of concatenating them", () => {
      const EXAMPLE_ABI_ITEM = {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            internalType: "bytes32",
            name: "node",
            type: "bytes32",
          },
          {
            indexed: true,
            internalType: "uint256",
            name: "contentType",
            type: "uint256",
          },
        ],
        name: "ABIChanged",
        type: "event",
      };
      const target = { abi: [EXAMPLE_ABI_ITEM], array: [{ key: "a" }] };
      const source = { abi: [EXAMPLE_ABI_ITEM], array: [{ key: "a" }, { key: "b" }] };
      expect(deepMergePonderConfigs(target, source)).toEqual({
        abi: [EXAMPLE_ABI_ITEM], // de-duped
        array: [{ key: "a" }, { key: "a" }, { key: "b" }], // concatenated
      });
    });
  });

  it("should use the minimum startBlock and maxium endBlock for Resolver contracts", () => {
    const target = {
      contracts: { Resolver: { network: { "1": { startBlock: 1, endBlock: 1 } } } },
    };
    const source = {
      contracts: { Resolver: { network: { "1": { startBlock: 2, endBlock: 2 } } } },
    };
    expect(deepMergePonderConfigs(target, source)).toEqual({
      contracts: {
        Resolver: {
          network: {
            "1": {
              startBlock: 1,
              endBlock: 2,
            },
          },
        },
      },
    });
  });
});
