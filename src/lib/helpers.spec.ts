import { describe, expect, it } from "vitest";
import {
  DEFAULT_RPC_RATE_LIMIT,
  bigintMax,
  blockConfig,
  deepMergeRecursive,
  hasNullByte,
  parseRpcEndpointUrl,
  parseRpcMaxRequestsPerSecond,
  uniq,
} from "./helpers";

describe("helpers", () => {
  describe("uniq", () => {
    it("should return unique elements from an array", () => {
      expect(uniq([1, 2, 2, 3, 4, 4])).toEqual([1, 2, 3, 4]);
    });
  });

  describe("hasNullByte", () => {
    it("should return true if the string contains a null byte", () => {
      expect(hasNullByte("hello\u0000world")).toBe(true);
    });

    it("should return false if the string does not contain a null byte", () => {
      expect(hasNullByte("helloworld")).toBe(false);
    });
  });

  describe("bigintMax", () => {
    it("should return the maximum bigint value", () => {
      expect(bigintMax(1n, 2n, 3n)).toBe(3n);
    });
  });

  describe("blockConfig", () => {
    it("should return valid startBlock and endBlock", () => {
      const config = blockConfig(5, 10, 20);
      expect(config).toEqual({ startBlock: 10, endBlock: 20 });
    });

    it("should handle undefined start and end", () => {
      const config = blockConfig(undefined, 10, undefined);
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
      expect(() => parseRpcMaxRequestsPerSecond("invalid")).toThrowError("'invalid' is not a number");
    });

    it("should throw an error if the value is out of bounds", () => {
      expect(() => parseRpcMaxRequestsPerSecond("0")).toThrowError("'0' is not a positive integer");
      expect(() => parseRpcMaxRequestsPerSecond("-1")).toThrowError("'-1' is not a positive integer");
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
