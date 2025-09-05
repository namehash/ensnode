import { labelhash } from "viem";
import { describe, expect, it } from "vitest";

import { LiteralLabel, encodeLabelHash } from "../ens";
import { literalLabelToInterpretedLabel, literalLabelsToInterpretedName } from "./interpretation";

const ENCODED_LABELHASH_LABEL = /^\[[\da-f]{64}\]$/;

const NORMALIZED_LABELS = [
  "vitalik",
  "example",
  "test",
  "eth",
  "base",
  "🔥",
  "test🎂",
  "café",
  "sub",
  "a".repeat(512), // Long normalized
] as LiteralLabel[];

const UNNORMALIZED_LABELS = [
  "", // Empty string
  "Vitalik", // Uppercase
  "Example", // Uppercase
  "TEST", // Uppercase
  "ETH", // Uppercase
  "test\0", // Null character
  "vitalik\0", // Null character
  "\0", // Only null character
  "example.\0", // Null character in middle
  "test[", // Not normalizable bracket
  "test]", // Not normalizable bracket
  "test.", // Contains dot
  ".eth", // Starts with dot
  "sub.example", // Contains dot
  "test\u0000", // Unicode null
  "test\uFEFF", // Zero-width no-break space
  "test\u200B", // Zero-width space
  "test\u202E", // RTL override
  "A".repeat(300), // Long non-normalized
] as LiteralLabel[];

describe("interpretation", () => {
  describe("interpretLiteralLabel", () => {
    it("should return normalized labels unchanged", () => {
      NORMALIZED_LABELS.forEach((label) =>
        expect(literalLabelToInterpretedLabel(label)).toBe(label),
      );
    });

    it("should encode non-normalized encodable labels as labelhashes", () => {
      UNNORMALIZED_LABELS.forEach((label) =>
        expect(literalLabelToInterpretedLabel(label)).toMatch(ENCODED_LABELHASH_LABEL),
      );
    });
  });

  describe("interpretLiteralLabelsIntoInterpretedName", () => {
    it("correctly interprets labels with period", () => {
      expect(literalLabelsToInterpretedName(["a.b", "c"] as LiteralLabel[])).toEqual(
        `${encodeLabelHash(labelhash("a.b"))}.c`,
      );
    });

    it("correctly interprets labels with NULL", () => {
      expect(literalLabelsToInterpretedName(["\0", "c"] as LiteralLabel[])).toEqual(
        `${encodeLabelHash(labelhash("\0"))}.c`,
      );
    });

    it("correctly interprets encoded-labelhash-looking-strings", () => {
      const literalLabelThatLooksLikeALabelHash = encodeLabelHash(labelhash("test"));

      expect(
        literalLabelsToInterpretedName([
          literalLabelThatLooksLikeALabelHash,
          "c",
        ] as LiteralLabel[]),
      ).toEqual(`${encodeLabelHash(labelhash(literalLabelThatLooksLikeALabelHash))}.c`);
    });
  });
});
