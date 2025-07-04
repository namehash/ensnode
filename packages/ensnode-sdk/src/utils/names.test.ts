import { describe, expect, it } from "vitest";
import { getNameHierarchy } from "./names";

describe("names", () => {
  describe("getNameHierarchy", () => {
    it("should split name into hierarchy correctly", () => {
      const name = "sub.example.eth";
      const expected = ["sub.example.eth", "example.eth", "eth"];
      expect(getNameHierarchy(name)).toEqual(expected);
    });

    it("should handle single label names", () => {
      const name = "eth";
      const expected = ["eth"];
      expect(getNameHierarchy(name)).toEqual(expected);
    });

    it("should handle empty string", () => {
      const name = "";
      const expected = [""];
      expect(getNameHierarchy(name)).toEqual(expected);
    });

    it("should handle names with different TLDs", () => {
      const name = "sub.example.com";
      const expected = ["sub.example.com", "example.com", "com"];
      expect(getNameHierarchy(name)).toEqual(expected);
    });
  });
});
