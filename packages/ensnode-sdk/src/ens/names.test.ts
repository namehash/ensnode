import { describe, expect, it } from "vitest";

import { getNameHierarchy, nameToNormalizedName } from "./names";

describe("names", () => {
  describe("getNameHierarchy", () => {
    it("should split name into hierarchy correctly", () => {
      const name = nameToNormalizedName("sub.example.eth");
      const expected = ["sub.example.eth", "example.eth", "eth"];
      expect(getNameHierarchy(name)).toEqual(expected);
    });

    it("should handle single label names", () => {
      const name = nameToNormalizedName("eth");
      const expected = ["eth"];
      expect(getNameHierarchy(name)).toEqual(expected);
    });

    it("should handle empty string (root node)", () => {
      const name = nameToNormalizedName("");
      const expected = [""];
      expect(getNameHierarchy(name)).toEqual(expected);
    });

    it("should handle names with different TLDs", () => {
      const name = nameToNormalizedName("sub.example.com");
      const expected = ["sub.example.com", "example.com", "com"];
      expect(getNameHierarchy(name)).toEqual(expected);
    });
  });
});
