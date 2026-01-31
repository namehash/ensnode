import { describe, expect, it } from "vitest";

import { bigIntToNumber, scaleBigintByNumber } from "./numbers";

describe("Numbers", () => {
  describe("bigIntToNumber()", () => {
    it("can convert bigint to number when possible", () => {
      expect(bigIntToNumber(BigInt(Number.MIN_SAFE_INTEGER))).toEqual(Number.MIN_SAFE_INTEGER);

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

  describe("scaleBigintByNumber()", () => {
    describe("basic functionality", () => {
      it("should scale by 1 returning the same value", () => {
        expect(scaleBigintByNumber(1000n, 1)).toBe(1000n);
        expect(scaleBigintByNumber(9999999999999999999999n, 1)).toBe(9999999999999999999999n);
      });

      it("should scale by 0 returning 0", () => {
        expect(scaleBigintByNumber(1000n, 0)).toBe(0n);
        expect(scaleBigintByNumber(9999999999999999999999n, 0)).toBe(0n);
      });

      it("should handle zero value", () => {
        expect(scaleBigintByNumber(0n, 0.5)).toBe(0n);
        expect(scaleBigintByNumber(0n, 2)).toBe(0n);
        expect(scaleBigintByNumber(0n, 1 / 3)).toBe(0n);
        expect(scaleBigintByNumber(0n, 0)).toBe(0n);
      });

      it("should scale by 0.5", () => {
        expect(scaleBigintByNumber(1000n, 0.5)).toBe(500n);
        expect(scaleBigintByNumber(100n, 0.5)).toBe(50n);
        expect(scaleBigintByNumber(1n, 0.5)).toBe(0n); // rounds down
      });

      it("should scale by 2", () => {
        expect(scaleBigintByNumber(1000n, 2)).toBe(2000n);
        expect(scaleBigintByNumber(500n, 2)).toBe(1000n);
      });

      it("should scale by decimals", () => {
        expect(scaleBigintByNumber(1000n, 0.333)).toBe(333n);
        expect(scaleBigintByNumber(1000n, 0.667)).toBe(667n);
        // 0.999 in JavaScript is represented as 0.99899999999999999911... (IEEE 754)
        expect(scaleBigintByNumber(1000n, 0.999)).toBe(998n);
      });
    });

    describe("precision handling", () => {
      it("should handle high precision from JavaScript floats", () => {
        const value = 1000000000000000000n; // 1 ETH in wei
        const result = scaleBigintByNumber(value, 0.5);
        expect(result).toBe(500000000000000000n); // 0.5 ETH
      });

      it("should round down fractional results", () => {
        expect(scaleBigintByNumber(10n, 0.333)).toBe(3n);
        expect(scaleBigintByNumber(10n, 0.667)).toBe(6n);
        expect(scaleBigintByNumber(10n, 0.999)).toBe(9n);
        expect(scaleBigintByNumber(3n, 0.5)).toBe(1n);
      });
    });

    describe("large values", () => {
      it("should handle very large bigint values", () => {
        const largeValue = 10n ** 30n; // 1 followed by 30 zeros
        const result = scaleBigintByNumber(largeValue, 0.5);
        expect(result).toBe(5n * 10n ** 29n);
      });

      it("should handle maximum safe bigint operations", () => {
        const largeValue = 10n ** 50n;
        const result = scaleBigintByNumber(largeValue, 0.1);
        // 0.1 in JavaScript is actually 0.10000000000000000555... (IEEE 754)
        // So the result will have that tiny imprecision carried through
        expect(result).toBe(10000000000000000555000000000000000000000000000000n);
      });

      it("should not lose precision with large values and small scale factors", () => {
        const value = 1000000000000000000n;
        const scaleFactor = 0.0000000000000001;
        const result = scaleBigintByNumber(value, scaleFactor);
        expect(result).toBe(100n);
      });
    });

    describe("edge cases with small scale factors", () => {
      it("should handle very small scale factors", () => {
        const value = 1000000000000000000n;
        expect(scaleBigintByNumber(value, 0.000000000000000001)).toBe(1n);
        expect(scaleBigintByNumber(value, 0.0000000000000000001)).toBe(0n);
      });
    });

    describe("error handling", () => {
      it("should throw on negative value", () => {
        expect(() => scaleBigintByNumber(-1n, 0.5)).toThrow(
          "scaleBigintByNumber: value must be non-negative",
        );
        expect(() => scaleBigintByNumber(-1000n, 1)).toThrow(
          "scaleBigintByNumber: value must be non-negative",
        );
      });

      it("should throw on negative scale factor", () => {
        expect(() => scaleBigintByNumber(1000n, -0.5)).toThrow(
          "scaleBigintByNumber: scaleFactor must be non-negative",
        );
        expect(() => scaleBigintByNumber(1000n, -1)).toThrow(
          "scaleBigintByNumber: scaleFactor must be non-negative",
        );
      });

      it("should throw on NaN scale factor", () => {
        expect(() => scaleBigintByNumber(1000n, Number.NaN)).toThrow(
          "scaleBigintByNumber: scaleFactor must be a finite number",
        );
      });

      it("should throw on infinite scale factor", () => {
        expect(() => scaleBigintByNumber(1000n, Number.POSITIVE_INFINITY)).toThrow(
          "scaleBigintByNumber: scaleFactor must be a finite number",
        );
        expect(() => scaleBigintByNumber(1000n, Number.NEGATIVE_INFINITY)).toThrow(
          "scaleBigintByNumber: scaleFactor must be a finite number",
        );
      });
    });
  });
});
