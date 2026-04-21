import { type Hex, numberToHex } from "viem";
import { describe, expect, expectTypeOf, it } from "vitest";

import { replaceBigInts } from "./replace-bigints";

describe("replaceBigInts", () => {
  it("replaces a scalar bigint", () => {
    const out = replaceBigInts(5n, numberToHex);

    expect(out).toBe("0x5");
    expectTypeOf<Hex>(out);
  });

  it("passes through non-bigint scalars", () => {
    expect(replaceBigInts("hello", String)).toBe("hello");
    expect(replaceBigInts(42, String)).toBe(42);
    expect(replaceBigInts(true, String)).toBe(true);
    expect(replaceBigInts(false, String)).toBe(false);
  });

  it("passes through null and undefined", () => {
    expect(replaceBigInts(null, String)).toBe(null);
    expect(replaceBigInts(undefined, String)).toBe(undefined);
  });

  it("handles empty array", () => {
    expect(replaceBigInts([], String)).toStrictEqual([]);
  });

  it("handles empty object", () => {
    expect(replaceBigInts({}, String)).toStrictEqual({});
  });

  it("replaces bigints in an array", () => {
    const out = replaceBigInts([5n], numberToHex);

    expect(out).toStrictEqual(["0x5"]);
    expectTypeOf<readonly [Hex]>(out);
  });

  it("replaces bigints in a readonly (as const) array", () => {
    const out = replaceBigInts([5n] as const, numberToHex);

    expect(out).toStrictEqual(["0x5"]);
    expectTypeOf<readonly [Hex]>(out);
  });

  it("replaces bigints in a mixed-type array", () => {
    const out = replaceBigInts([1n, "x", 2, null, 3n], String);

    expect(out).toStrictEqual(["1", "x", 2, null, "3"]);
  });

  it("replaces bigints in nested objects", () => {
    const out = replaceBigInts({ kevin: { kevin: 5n } }, numberToHex);

    expect(out).toStrictEqual({ kevin: { kevin: "0x5" } });
    expectTypeOf<{ kevin: { kevin: Hex } }>(out);
  });

  it("replaces bigints in an object whose value is a bigint array", () => {
    const out = replaceBigInts({ values: [1n, 2n, 3n] }, String);

    expect(out).toStrictEqual({ values: ["1", "2", "3"] });
  });

  it("replaces bigints in deeply nested array-in-object-in-array structures", () => {
    const out = replaceBigInts([{ xs: [1n, { y: 2n }] }, { xs: [3n] }], String);

    expect(out).toStrictEqual([{ xs: ["1", { y: "2" }] }, { xs: ["3"] }]);
  });

  it("supports an identity replacer", () => {
    const out = replaceBigInts(5n, (x) => x);

    expect(out).toBe(5n);
  });

  it("supports the String replacer (common toJson case)", () => {
    const out = replaceBigInts({ a: 1n, b: [2n, "x"] }, String);

    expect(out).toStrictEqual({ a: "1", b: ["2", "x"] });
  });
});
