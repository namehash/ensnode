import { describe, expect, it } from "vitest";
import { isNormalizedLabel } from "./is-normalized";

const NORMALIZED_LABELS = ["eth", "test"];

// https://www.soscisurvey.de/tools/view-chars.php
const UNNORMALIZED_LABELS = [
  "еthchina", // \u0435thchina
  "еthgold", // same situation
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
