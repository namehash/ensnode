import { afterAll, beforeEach, describe, expect, it, vitest } from "vitest";
import {
  DEFAULT_RPC_RATE_LIMIT,
  bigintMax,
  blockConfig,
  deepMergeRecursive,
  hasNullByte,
  parseRpcEndpointUrl,
  parseRpcMaxRequestsPerSecond,
  rpcEndpointUrl,
  rpcMaxRequestsPerSecond,
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
      expect(() => parseRpcEndpointUrl("invalid")).toThrowError("Invalid URL 'invalid'");
    });

    it("should throw an error if the URL is missing", () => {
      expect(() => parseRpcEndpointUrl()).toThrowError("Missing value");
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
      expect(() => parseRpcMaxRequestsPerSecond("invalid")).toThrowError("Not a number 'invalid'");
    });

    it("should throw an error if the value is out of bounds", () => {
      expect(() => parseRpcMaxRequestsPerSecond("0")).toThrowError("Not a positive integer '0'");
      expect(() => parseRpcMaxRequestsPerSecond("-1")).toThrowError("Not a positive integer '-1'");
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
