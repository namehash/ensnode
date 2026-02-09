import { describe, expect, it } from "vitest";

import { addDuration, durationBetween, parseTimestamp } from "./datetime";

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

  describe("parseTimestamp()", () => {
    it("parses ISO 8601 date strings with Z suffix correctly", () => {
      expect(parseTimestamp("2025-12-01T00:00:00Z")).toEqual(1764547200);
      expect(parseTimestamp("2026-03-31T23:59:59Z")).toEqual(1775001599);
      expect(parseTimestamp("2026-03-01T00:00:00Z")).toEqual(1772323200);
      expect(parseTimestamp("2025-12-31T23:59:59Z")).toEqual(1767225599);
    });

    it("parses ISO 8601 date strings with UTC offset correctly", () => {
      expect(parseTimestamp("2025-12-01T01:00:00+01:00")).toEqual(1764547200);
      expect(parseTimestamp("2025-12-01T00:00:00-05:00")).toEqual(1764565200);
    });

    it("throws for date strings missing a timezone designator", () => {
      expect(() => parseTimestamp("2025-01-01T00:00:00")).toThrowError(
        /Timezone required: provide Z or offset/,
      );
      expect(() => parseTimestamp("2025-01-01")).toThrowError(
        /Timezone required: provide Z or offset/,
      );
    });

    it("throws an error for invalid date strings", () => {
      expect(() => parseTimestamp("invalid-dateZ")).toThrowError(/Invalid date string/);
      expect(() => parseTimestamp("2025-13-01T00:00:00Z")).toThrowError(/Invalid date string/);
    });

    it("throws for empty string", () => {
      expect(() => parseTimestamp("")).toThrowError(/Timezone required: provide Z or offset/);
    });
  });
});
