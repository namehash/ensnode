import { describe, expect, it } from "vitest";

import { hasNullByte, stripNullBytes } from "./null-bytes";

describe("helpers", () => {
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
