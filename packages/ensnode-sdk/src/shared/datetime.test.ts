import { describe, expect, it } from "vitest";

import { durationBetween } from "./datetime";

describe("datetime", () => {
  describe("durationBetween()", () => {
    it("returns duration for valid input where start is before end", () => {
      expect(durationBetween(1234, 4321)).toEqual(3087);
      expect(durationBetween(1234, 1234)).toEqual(0);
    });
    it("throws an error for invalid input where end is before start", () => {
      expect(() => durationBetween(1234, 1233)).toThrowError(
        /Duration must be a non-negative integer/i,
      );
    });
  });
});
