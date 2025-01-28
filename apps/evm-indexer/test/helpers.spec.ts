import { describe, expect, it } from "vitest";
import { bigintMax, hasNullByte, uniq } from "../src/lib/helpers";

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
});
