import { toUnixTimestamp } from "@/components/recent-registrations/hooks";
import { describe, expect, it } from "vitest";

describe("toUnixTimestamp", () => {
  it("should throw an exception for non-integer input", () => {
    expect(() => toUnixTimestamp("A1781826068")).toThrowError();
    expect(() => toUnixTimestamp("1.5")).toThrowError();
  });

  it("should throw an exception for an empty string as input", () => {
    expect(() => toUnixTimestamp("")).toThrowError();
  });

  it("should parse correct timestamp to a date object", () => {
    expect(toUnixTimestamp("1781826068")).toStrictEqual(1781826068);
    expect(toUnixTimestamp("0")).toStrictEqual(0);
    expect(toUnixTimestamp("-1781826068")).toStrictEqual(-1781826068);
  });
});
