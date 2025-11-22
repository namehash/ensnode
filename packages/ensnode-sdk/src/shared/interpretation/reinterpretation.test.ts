import { describe, expect, it } from "vitest";

import type { InterpretedLabel } from "../../ens";
import { reinterpretLabel } from "./reinterpretation";

describe("Reinterpretation", () => {
  describe("reinterpretLabel()", () => {
    const unnormalizedLabel = "Eth";
    const normalizedLabel = "eth" as InterpretedLabel;
    const encodedLabelHash =
      "[4c10068c4e8f0b2905447ed0a679a3934513092c8a965b7a3d1ea67ea1cd0698]" as InterpretedLabel;

    it("can reinterpret EncodedLabelHash", () => {
      expect(reinterpretLabel(encodedLabelHash)).toBe(encodedLabelHash);
    });

    it("can reinterpret NormalizedLabel", () => {
      expect(reinterpretLabel(normalizedLabel)).toBe(normalizedLabel);
    });

    it("can reinterpret UnnormalizedLabel", () => {
      expect(reinterpretLabel(unnormalizedLabel as InterpretedLabel)).toBe(encodedLabelHash);
    });

    it("refuses to reinterpret an empty Label", () => {
      expect(() => reinterpretLabel("" as InterpretedLabel)).toThrowError(
        /Cannot reinterpret an empty label that violates the invariants of an InterpretedLabel/i,
      );
    });
  });
});
