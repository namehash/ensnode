import { describe, expect, it } from "vitest";

import { reinterpretLabel } from "./reinterpretation";

describe("Reinterpretation", () => {
  describe("reinterpretLabel()", () => {
    const unnormalizedLabel = "Eth";
    const normalizedLabel = "eth";
    const encodedLabelHash = "[4c10068c4e8f0b2905447ed0a679a3934513092c8a965b7a3d1ea67ea1cd0698]";

    it("can reinterpret NormalizedLabel", () => {
      expect(reinterpretLabel(normalizedLabel)).toBe(normalizedLabel);
    });

    it("can reinterpret UnnormalizedLabel", () => {
      expect(reinterpretLabel(unnormalizedLabel)).toBe(encodedLabelHash);
    });

    it("refuses to reinterpret an empty Label", () => {
      expect(() => reinterpretLabel("")).toThrowError(
        /Label must not be an empty string to be reinterpreted/i,
      );
    });
  });
});
