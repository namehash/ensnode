import { describe, expect, it } from "vitest";

import { beautifyName, ENS_ROOT, getNameHierarchy, getParentNameFQDN } from "./names";
import type { Name, NormalizedName } from "./types";

describe("names", () => {
  describe("getNameHierarchy", () => {
    it("should split name into hierarchy correctly", () => {
      const name = "sub.example.eth" as NormalizedName;
      const expected = ["sub.example.eth", "example.eth", "eth"];
      expect(getNameHierarchy(name)).toEqual(expected);
    });

    it("should handle single label names", () => {
      const name = "eth" as NormalizedName;
      const expected = ["eth"];
      expect(getNameHierarchy(name)).toEqual(expected);
    });

    it("should handle empty string (root node)", () => {
      const name = "" as NormalizedName;
      const expected = [""];
      expect(getNameHierarchy(name)).toEqual(expected);
    });

    it("should handle names with different TLDs", () => {
      const name = "sub.example.com" as NormalizedName;
      const expected = ["sub.example.com", "example.com", "com"];
      expect(getNameHierarchy(name)).toEqual(expected);
    });
  });

  describe("getParentNameFQDN", () => {
    it("throws error for ENS Root", () => {
      expect(() => getParentNameFQDN(ENS_ROOT)).toThrowError(
        /There is no parent name for ENS Root/i,
      );
    });

    it("returns ENS Root for top-level name", () => {
      expect(getParentNameFQDN("eth")).toStrictEqual(ENS_ROOT);
    });

    it("returns FQDN for 2nd-level name", () => {
      expect(getParentNameFQDN("base.eth")).toStrictEqual("eth");
    });

    it("returns FQDN for 3rd-level name", () => {
      expect(getParentNameFQDN("test.base.eth")).toStrictEqual("base.eth");
    });
  });

  describe("beautifyName", () => {
    it("should beautify a name with no labels", () => {
      const name = "" as Name;
      const expected = "";
      expect(beautifyName(name)).toEqual(expected);
    });

    it("should beautify normalized labels", () => {
      const name = "1⃣2⃣.eth" as NormalizedName;
      const expected = "1️⃣2️⃣.eth";
      expect(beautifyName(name)).toEqual(expected);
    });

    it("should gracefully skip unnormalized labels", () => {
      const name = "ABC.eth" as Name;
      const expected = "ABC.eth";
      expect(beautifyName(name)).toEqual(expected);
    });

    it("should selectively beautify labels where possible", () => {
      const name = "1⃣2⃣.ABC.eth" as Name;
      const expected = "1️⃣2️⃣.ABC.eth";
      expect(beautifyName(name)).toEqual(expected);
    });

    it("should gracefully handle names with a leading, middle, and trailing empty label", () => {
      const name = ".abc..eth." as Name;
      const expected = ".abc..eth.";
      expect(beautifyName(name)).toEqual(expected);
    });
  });
});
