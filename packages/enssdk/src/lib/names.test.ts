import { describe, expect, it } from "vitest";

import { ENS_ROOT_NAME } from "./constants";
import { asInterpretedName } from "./interpreted-names-and-labels";
import { beautifyName, getNameHierarchy, getParentInterpretedName } from "./names";
import type { Name } from "./types";

describe("names", () => {
  describe("getNameHierarchy", () => {
    it("should split name into hierarchy correctly", () => {
      const name = asInterpretedName("sub.example.eth");
      const expected = ["sub.example.eth", "example.eth", "eth"];
      expect(getNameHierarchy(name)).toEqual(expected);
    });

    it("should handle single label names", () => {
      const name = asInterpretedName("eth");
      const expected = ["eth"];
      expect(getNameHierarchy(name)).toEqual(expected);
    });

    it("should handle empty string (root node)", () => {
      const name = asInterpretedName("");
      expect(getNameHierarchy(name)).toEqual([]);
    });

    it("should handle names with different TLDs", () => {
      const name = asInterpretedName("sub.example.com");
      const expected = ["sub.example.com", "example.com", "com"];
      expect(getNameHierarchy(name)).toEqual(expected);
    });
  });

  describe("getParentInterpretedName", () => {
    it("returns null for ENS Root", () => {
      expect(getParentInterpretedName(ENS_ROOT_NAME)).toBeNull();
    });

    it("returns ENS Root for top-level name", () => {
      expect(getParentInterpretedName(asInterpretedName("eth"))).toStrictEqual(ENS_ROOT_NAME);
    });

    it("returns parent for 2nd-level name", () => {
      expect(getParentInterpretedName(asInterpretedName("base.eth"))).toStrictEqual("eth");
    });

    it("returns parent for 3rd-level name", () => {
      expect(getParentInterpretedName(asInterpretedName("test.base.eth"))).toStrictEqual(
        "base.eth",
      );
    });
  });

  describe("beautifyName", () => {
    it("should beautify a name with no labels", () => {
      const name = "";
      const expected = "";
      expect(beautifyName(name)).toEqual(expected);
    });

    it("should beautify normalized labels", () => {
      const name = "1⃣2⃣.eth";
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
