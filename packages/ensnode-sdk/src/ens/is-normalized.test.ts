import { describe, expect, it } from "vitest";
import { isNormalizedLabel, isNormalizedName } from "./is-normalized";

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
  "VITALIK", // normalizable but not normalized
  "", // empty string
  "abc.123", // contains full-stop
  "еthchina", // \u0435thchina
  "еthgold", // same situation
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
];

const NORMALIZED_NAMES = [
  "", // empty string
  "abc", // single label name
  "abc.123", // multi-label name
];

const UNNORMALIZED_NAMES = [
  "VITALIK.eth", // normalizable but not normalized
  "invalid|name.eth", // unnormalizable
];

describe("is-normalized", () => {
  describe("isNormalizedLabel", () => {
    NORMALIZED_LABELS.forEach((label) => {
      it(`correctly identifies '${label}' as normalized`, () => {
        expect(isNormalizedLabel(label)).toBe(true);
      });
    });

    UNNORMALIZED_LABELS.forEach((label) => {
      it(`correctly identifies '${label}' as unnormalized`, () => {
        expect(isNormalizedLabel(label)).toBe(false);
      });
    });
  });

  describe("isNormalizedName", () => {
    NORMALIZED_NAMES.forEach((name) => {
      it(`correctly identifies '${name}' as normalized`, () => {
        expect(isNormalizedName(name)).toBe(true);
      });
    });

    UNNORMALIZED_NAMES.forEach((name) => {
      it(`correctly identifies '${name}' as unnormalized`, () => {
        expect(isNormalizedName(name)).toBe(false);
      });
    });
  });
});
