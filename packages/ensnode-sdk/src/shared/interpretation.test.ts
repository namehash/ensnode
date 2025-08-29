import { describe, expect, it } from "vitest";
import { interpretLiteralLabel, interpretLiteralName } from "./interpretation";

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
];

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
  "test[", // Unindexable character
  "test]", // Unindexable character
  "test.", // Contains dot
  ".eth", // Starts with dot
  "sub.example", // Contains dot
  "test\u0000", // Unicode null
  "test\uFEFF", // Zero-width no-break space
  "test\u200B", // Zero-width space
  "test\u202E", // RTL override
  "A".repeat(300), // Long non-normalized
];

describe("interpretation", () => {
  describe("interpretLiteralLabel", () => {
    it("should return normalized labels unchanged", () => {
      NORMALIZED_LABELS.forEach((label) => expect(interpretLiteralLabel(label)).toBe(label));
    });

    it("should encode non-normalized encodable labels as labelhashes", () => {
      UNNORMALIZED_LABELS.forEach((label) =>
        expect(interpretLiteralLabel(label)).toMatch(ENCODED_LABELHASH_LABEL),
      );
    });
  });

  describe("interpretLiteralName", () => {
    it("should return empty string for empty string", () => {
      expect(interpretLiteralName("")).toBe("");
    });

    it("should work for unnormalizable single label", () => {
      expect(interpretLiteralName("unnormalizable|label")).toMatch(ENCODED_LABELHASH_LABEL);
    });

    it("should handle empty labels", () => {
      // 2 empty labels, looks like [00...00].[00...00]
      expect(interpretLiteralName(".")).toMatch(/^\[[\da-f]{64}\]\.\[[\da-f]{64}\]$/);

      // 3 empty labels, looks like [00...00].[00...00].[00...00]
      expect(interpretLiteralName("..")).toMatch(
        /^\[[\da-f]{64}\]\.\[[\da-f]{64}\]\.\[[\da-f]{64}\]$/,
      );
    });
  });
});
