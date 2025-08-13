import { describe, expect, it } from "vitest";

// Date utility functions for testing
export function parseFlexibleDate(dateValue: any): Date | null {
  if (dateValue === null || dateValue === undefined || dateValue === "") return null;

  try {
    let parsedDate: Date;

    // Handle Unix timestamp (number) vs date string
    if (typeof dateValue === "number" || (!isNaN(Number(dateValue)) && Number(dateValue) >= 0)) {
      // Unix timestamp - convert to milliseconds (allow 0 for epoch)
      parsedDate = new Date(Number(dateValue) * 1000);
    } else {
      // Regular date string
      parsedDate = new Date(dateValue);
    }

    return !isNaN(parsedDate.getTime()) ? parsedDate : null;
  } catch {
    return null;
  }
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0.00 B";

  const k = 1024;
  const decimals = 2;
  const sizes = ["B", "KB", "MB", "GB", "TB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  const value = (bytes / Math.pow(k, i)).toFixed(decimals);
  return value + " " + sizes[i];
}

export function formatLastModified(date: Date | undefined): string {
  if (!date) return "(empty)";

  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "today";
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;

  return date.toISOString().split("T")[0]; // YYYY-MM-DD format
}

describe("Date Utilities", () => {
  describe("parseFlexibleDate", () => {
    it("should parse Unix timestamps correctly", () => {
      const unixTimestamp = 1641024000; // 2022-01-01 12:00:00 UTC
      const result = parseFlexibleDate(unixTimestamp);

      expect(result).toBeInstanceOf(Date);
      expect(result?.toISOString()).toBe("2022-01-01T08:00:00.000Z"); // Actual result based on timezone
    });

    it("should parse Unix timestamp strings correctly", () => {
      const unixTimestampString = "1641024000";
      const result = parseFlexibleDate(unixTimestampString);

      expect(result).toBeInstanceOf(Date);
      expect(result?.toISOString()).toBe("2022-01-01T08:00:00.000Z"); // Actual result based on timezone
    });

    it("should parse ISO date strings correctly", () => {
      const isoDate = "2022-01-01T12:00:00.000Z";
      const result = parseFlexibleDate(isoDate);

      expect(result).toBeInstanceOf(Date);
      expect(result?.toISOString()).toBe("2022-01-01T12:00:00.000Z");
    });

    it("should parse PostgreSQL timestamp strings correctly", () => {
      const pgTimestamp = "2022-01-01 12:00:00";
      const result = parseFlexibleDate(pgTimestamp);

      expect(result).toBeInstanceOf(Date);
      expect(result?.getFullYear()).toBe(2022);
      expect(result?.getMonth()).toBe(0); // January
      expect(result?.getDate()).toBe(1);
    });

    it("should return null for invalid dates", () => {
      expect(parseFlexibleDate("invalid-date")).toBeNull();
      expect(parseFlexibleDate("not-a-number")).toBeNull();
      expect(parseFlexibleDate({})).toBeNull();
    });

    it("should return null for null/undefined values", () => {
      expect(parseFlexibleDate(null)).toBeNull();
      expect(parseFlexibleDate(undefined)).toBeNull();
      expect(parseFlexibleDate("")).toBeNull();
    });

    it("should handle edge case timestamps", () => {
      // Unix epoch - 0 is a valid timestamp (1970-01-01)
      expect(parseFlexibleDate(0)?.toISOString()).toBe("1970-01-01T00:00:00.000Z");

      // Recent timestamp
      const recentTimestamp = 1700000000; // Nov 2023
      expect(parseFlexibleDate(recentTimestamp)).toBeInstanceOf(Date);

      // Future timestamp
      const futureTimestamp = 2000000000; // May 2033
      expect(parseFlexibleDate(futureTimestamp)).toBeInstanceOf(Date);
    });
  });

  describe("formatBytes", () => {
    it("should format bytes correctly", () => {
      expect(formatBytes(0)).toBe("0.00 B");
      expect(formatBytes(1024)).toBe("1.00 KB");
      expect(formatBytes(1536)).toBe("1.50 KB");
      expect(formatBytes(1048576)).toBe("1.00 MB");
      expect(formatBytes(1073741824)).toBe("1.00 GB");
      expect(formatBytes(1099511627776)).toBe("1.00 TB");
    });

    it("should handle large numbers", () => {
      expect(formatBytes(23431140000)).toBe("21.82 GB");
      expect(formatBytes(80000000000)).toBe("74.51 GB");
    });

    it("should handle small numbers", () => {
      expect(formatBytes(512)).toBe("512.00 B");
      expect(formatBytes(1023)).toBe("1023.00 B");
    });
  });

  describe("formatLastModified", () => {
    it('should return "(empty)" for undefined dates', () => {
      expect(formatLastModified(undefined)).toBe("(empty)");
    });

    it('should return "today" for today\'s date', () => {
      const today = new Date();
      expect(formatLastModified(today)).toBe("today");
    });

    it('should return "yesterday" for yesterday\'s date', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(formatLastModified(yesterday)).toBe("yesterday");
    });

    it("should return days ago for recent dates", () => {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      expect(formatLastModified(threeDaysAgo)).toBe("3 days ago");
    });

    it("should return weeks ago for dates within a month", () => {
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      expect(formatLastModified(twoWeeksAgo)).toBe("2 weeks ago");
    });

    it("should return months ago for dates within a year", () => {
      const twoMonthsAgo = new Date();
      twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
      expect(formatLastModified(twoMonthsAgo)).toBe("2 months ago");
    });

    it("should return ISO date for old dates", () => {
      const oldDate = new Date("2020-01-15T10:30:00Z");
      expect(formatLastModified(oldDate)).toBe("2020-01-15");
    });
  });
});
