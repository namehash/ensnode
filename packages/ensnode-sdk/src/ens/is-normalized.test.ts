import { describe, expect, it } from "vitest";
import { isNormalizedLabel } from "./is-normalized";

const NORMALIZED_LABELS = ["eth", "test"];

const UNNORMALIZED_LABELS = [
  "еthchina", // \u0435thchina
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
});
