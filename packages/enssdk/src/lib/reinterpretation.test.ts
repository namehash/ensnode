import { describe, expect, it } from "vitest";

import { asInterpretedLabel } from "./interpreted-names-and-labels";
import { encodeLabelHash, labelhashLiteralLabel } from "./labelhash";
import { reinterpretLabel } from "./reinterpretation";
import type { InterpretedLabel, LiteralLabel } from "./types";

const UNNORMALIZED_LABEL = "Eth";
const NORMALIZED_LABEL = asInterpretedLabel("eth");

describe("Reinterpretation", () => {
  describe("reinterpretLabel()", () => {
    const encodedLabelHash = asInterpretedLabel(
      encodeLabelHash(labelhashLiteralLabel(UNNORMALIZED_LABEL as LiteralLabel)),
    );

    it("can reinterpret EncodedLabelHash", () => {
      expect(reinterpretLabel(encodedLabelHash)).toBe(encodedLabelHash);
    });

    it("can reinterpret NormalizedLabel", () => {
      expect(reinterpretLabel(NORMALIZED_LABEL)).toBe(NORMALIZED_LABEL);
    });

    it("can reinterpret UnnormalizedLabel", () => {
      // directly cast the unnormalized label to avoid asInterpretedLabel validity checks
      expect(reinterpretLabel(UNNORMALIZED_LABEL as InterpretedLabel)).toBe(encodedLabelHash);
    });

    it("refuses to reinterpret an empty Label", () => {
      expect(() => reinterpretLabel("" as InterpretedLabel)).toThrowError(
        /Cannot reinterpret an empty label that violates the invariants of an InterpretedLabel/i,
      );
    });
  });
});
