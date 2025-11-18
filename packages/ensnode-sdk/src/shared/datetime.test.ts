import { describe, expect, it } from "vitest";

import { addDuration, durationBetween } from "./datetime";

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

  describe("addDuration()", () => {
    it("adds duration to timestamp", () => {
      expect(addDuration(1234, 100)).toEqual(1334);
      expect(addDuration(1000, 500)).toEqual(1500);
    });
    it("handles zero duration", () => {
      expect(addDuration(1234, 0)).toEqual(1234);
    });
    it("handles large duration values", () => {
      expect(addDuration(1000000, 999999)).toEqual(1999999);
    });
  });
});
