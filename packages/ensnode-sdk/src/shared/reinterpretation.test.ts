import { describe, expect, it } from "vitest";

import { reinterpretLabel } from "./reinterpretation";

describe("Reinterpretation", () => {
  describe("reinterpretLabel()", () => {
    const unnormalizedLabel = "Eth";
    const normalizedLabel = "eth";
    const encodedLabelHash = "[731f7025b488151de311c24abc1f27f02940bde412246fbdb3dea0d4f0663b22]";
    const labelHash = "0x731f7025b488151de311c24abc1f27f02940bde412246fbdb3dea0d4f0663b22";

    it("can reinterpret NormalizedLabel", () => {
      expect(reinterpretLabel(normalizedLabel)).toBe(normalizedLabel);
    });

    it("can reinterpret EncodedLabelHash", () => {
      expect(reinterpretLabel(encodedLabelHash)).toBe(encodedLabelHash);
    });

    it("can reinterpret LabelHash", () => {
      expect(reinterpretLabel(labelHash)).toBe(encodedLabelHash);
    });

    it("refuses to reinterpret not unnormalized Label", () => {
      expect(() => reinterpretLabel(unnormalizedLabel)).toThrowError(
        /'Eth' label must be either a NormalizedLabel, EncodedLabelHash, or LabelHash to be reinterpreted/,
      );
    });
  });
});
