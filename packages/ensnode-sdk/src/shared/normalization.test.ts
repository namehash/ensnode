import { describe, expect, it } from "vitest";
import { normalizedLabelOrEncodedLabelHash } from "./normalization";

const ENCODED_LABELHASH_LABEL = /^\[[\da-f]{64}\]$/;

const VALID_LABELS = [
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

const INVALID_LABELS = [
  "", // Empty string
];

const INVALID_ENCODABLE_LABELS = [
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

describe("normalization", () => {
  describe("normalizedLabelOrEncodedLabelHash", () => {
    it("should return normalized labels unchanged", () => {
      VALID_LABELS.forEach((label) => expect(normalizedLabelOrEncodedLabelHash(label)).toBe(label));
    });

    it("should return null for invalid labels", () => {
      INVALID_LABELS.forEach((label) =>
        expect(normalizedLabelOrEncodedLabelHash(label)).toBeNull(),
      );
    });

    it("should encode non-normalized encodable labels as labelhashes", () => {
      INVALID_ENCODABLE_LABELS.forEach((label) =>
        expect(normalizedLabelOrEncodedLabelHash(label)).toMatch(ENCODED_LABELHASH_LABEL),
      );
    });
  });
});
