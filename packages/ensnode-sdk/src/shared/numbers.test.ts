import { describe, expect, it } from "vitest";

import { bigIntToNumber } from "./numbers";

describe("Numbers", () => {
  it("can convert bigint to number when possible", () => {
    expect(bigIntToNumber(BigInt(Number.MAX_SAFE_INTEGER))).toEqual(Number.MAX_SAFE_INTEGER);
  });

  it("refuses to convert to low bigint value", () => {
    expect(() => bigIntToNumber(BigInt(Number.MIN_SAFE_INTEGER - 1))).toThrowError(
      /The bigint '-9007199254740992' value is too low to be to converted into a number/i,
    );
  });
  it("refuses to convert to high bigint value", () => {
    expect(() => bigIntToNumber(BigInt(Number.MAX_SAFE_INTEGER + 1))).toThrowError(
      /The bigint '9007199254740992' value is too high to be to converted into a number/i,
    );
  });
});
