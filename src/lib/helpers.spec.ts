import { afterAll, beforeEach, describe, expect, it, vitest } from "vitest";
import {
  bigintMax,
  blockConfig,
  deepMergeRecursive,
  hasNullByte,
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

  describe("rpcEndpointUrl", () => {
    const originalEnv = process.env;

    beforeEach(() => {
      vitest.resetModules();
      process.env = { ...originalEnv };
    });

    afterAll(() => {
      process.env = originalEnv;
    });

    it("should return the RPC endpoint URL from the environment variable", () => {
      process.env.RPC_URL_1 = "https://eth.drpc.org";
      expect(rpcEndpointUrl(1)).toContain("https://eth.drpc.org");
    });

    it("should throw an error if the environment variable is missing", () => {
      expect(() => rpcEndpointUrl(1)).toThrow(
        "Missing 'RPC_URL_1' environment variable. The RPC URL for chainId 1 is required.",
      );
    });

    it("should throw an error if the environment variable value is invalid", () => {
      process.env.RPC_URL_1 = "invalid-url";
      expect(() => rpcEndpointUrl(1)).toThrow(
        "Invalid 'RPC_URL_1' environment variable value: 'invalid-url'. Please provide a valid RPC URL.",
      );
    });
  });

  describe("rpcMaxRequestsPerSecond", () => {
    const originalEnv = process.env;

    beforeEach(() => {
      vitest.resetModules();
      process.env = { ...originalEnv };
    });

    afterAll(() => {
      process.env = originalEnv;
    });

    it("should return the rate limit from the environment variable", () => {
      process.env.RPC_REQUEST_RATE_LIMIT_1 = "400";
      expect(rpcMaxRequestsPerSecond(1)).toBe(400);
    });

    it("should return the default rate limit if the environment variable is missing", () => {
      expect(rpcMaxRequestsPerSecond(1)).toBe(50);
    });

    it("should throw an error if the environment variable value is invalid", () => {
      process.env.RPC_REQUEST_RATE_LIMIT_1 = "invalid";
      expect(() => rpcMaxRequestsPerSecond(1)).toThrow(
        "Invalid 'RPC_REQUEST_RATE_LIMIT_1' environment variable value: 'invalid'. Rate limit value must be an integer greater than 0.",
      );
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
