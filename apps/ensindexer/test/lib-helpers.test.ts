import { bigintMax, hasNullByte, stripNullBytes } from "@/lib/lib-helpers";
import { describe, expect, it } from "vitest";

describe("helpers", () => {
  describe("bigintMax", () => {
    it("should return the maximum bigint value", () => {
      expect(bigintMax(1n, 2n, 3n)).toBe(3n);
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

  describe("stripNullBytes", () => {
    it("should remove null bytes", () => {
      expect(stripNullBytes("hello\u0000world")).toBe("helloworld");
      expect(stripNullBytes("\0")).toBe("");
      expect(stripNullBytes("x\0y\0z\0")).toBe("xyz");
    });
  });
});
