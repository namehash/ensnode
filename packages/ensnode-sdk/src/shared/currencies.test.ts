import { describe, expect, it } from "vitest";

import {
  addPrices,
  CurrencyIds,
  type CurrencyInfo,
  getCurrencyInfo,
  isPriceCurrencyEqual,
  isPriceEqual,
  type Price,
  type PriceDai,
  type PriceEth,
  type PriceUsdc,
  parseDai,
  parseEth,
  parseUsdc,
  priceDai,
  priceEth,
  priceUsdc,
  scalePrice,
} from "./currencies";

describe("Currencies", () => {
  describe("getCurrencyInfo", () => {
    it("returns CurrencyInfo for requested CurrencyId", () => {
      expect(getCurrencyInfo(CurrencyIds.ETH)).toStrictEqual({
        id: CurrencyIds.ETH,
        name: "ETH",
        decimals: 18,
      } satisfies CurrencyInfo);
    });
  });

  describe("priceEth", () => {
    it("returns correct Price object", () => {
      expect(priceEth(1n)).toStrictEqual({
        amount: 1n,
        currency: CurrencyIds.ETH,
      } satisfies PriceEth);
    });
  });

  describe("priceUsdc", () => {
    it("returns correct Price object", () => {
      expect(priceUsdc(1n)).toStrictEqual({
        amount: 1n,
        currency: CurrencyIds.USDC,
      } satisfies PriceUsdc);
    });
  });

  describe("priceDai", () => {
    it("returns correct Price object", () => {
      expect(priceDai(1n)).toStrictEqual({
        amount: 1n,
        currency: CurrencyIds.DAI,
      } satisfies PriceDai);
    });
  });

  describe("isPriceCurrencyEqual", () => {
    it("returns true when two prices have the same currency", () => {
      expect(isPriceCurrencyEqual(priceEth(1n), priceEth(1n))).toBe(true);
    });

    it("returns false when two prices have different currency", () => {
      expect(isPriceCurrencyEqual(priceEth(1n), priceUsdc(1n))).toBe(false);
    });
  });

  describe("isPriceEqual", () => {
    it("returns true when two prices have the same currency and the same amount", () => {
      const price = {
        amount: 1n,
        currency: CurrencyIds.ETH,
      } satisfies Price;

      expect(isPriceEqual(price, price)).toBe(true);
    });

    it("returns false when two prices have different currency", () => {
      const priceA = {
        amount: 1n,
        currency: CurrencyIds.ETH,
      } satisfies Price;

      const priceB = {
        amount: 1n,
        currency: CurrencyIds.USDC,
      } satisfies Price;

      expect(isPriceEqual(priceA, priceB)).toBe(false);
    });

    it("returns false when two prices have different amount", () => {
      const priceA = {
        amount: 1n,
        currency: CurrencyIds.ETH,
      } satisfies Price;

      const priceB = {
        amount: 2n,
        currency: CurrencyIds.ETH,
      } satisfies Price;

      expect(isPriceEqual(priceA, priceB)).toBe(false);
    });
  });

  describe("addPrices", () => {
    it("returns a total of at prices which all have the same currency", () => {
      expect(addPrices(priceEth(1n), priceEth(2n), priceEth(3n))).toEqual(priceEth(6n));
    });
    it("throws an error if all prices do not have the same currency", () => {
      // @ts-expect-error
      expect(() => addPrices(priceEth(1n), priceDai(2n), priceEth(3n))).toThrowError(
        /All prices must have the same currency to be added together/i,
      );
    });
  });

  describe("scalePrice", () => {
    describe("currency preservation", () => {
      it("should preserve USDC currency type and scale correctly", () => {
        const price: PriceUsdc = priceUsdc(1000000n);
        const result: PriceUsdc = scalePrice(price, 0.5);
        expect(result.currency).toBe("USDC");
        expect(result.amount).toBe(500000n);
      });

      it("should preserve ETH currency type and scale correctly", () => {
        const price: PriceEth = priceEth(1000000000000000000n);
        const result: PriceEth = scalePrice(price, 0.5);
        expect(result.currency).toBe("ETH");
        expect(result.amount).toBe(500000000000000000n);
      });

      it("should preserve DAI currency type and scale correctly", () => {
        const price: PriceDai = priceDai(1000000000000000000n);
        const result: PriceDai = scalePrice(price, 0.5);
        expect(result.currency).toBe("DAI");
        expect(result.amount).toBe(500000000000000000n);
      });

      it("should preserve currency when scaling by 1", () => {
        const price = priceUsdc(1000000n);
        const result = scalePrice(price, 1);
        expect(result.currency).toBe(price.currency);
        expect(result.amount).toBe(1000000n);
      });

      it("should preserve currency when scaling by 0", () => {
        const price = priceUsdc(1000000n);
        const result = scalePrice(price, 0);
        expect(result.currency).toBe(price.currency);
        expect(result.amount).toBe(0n);
      });

      it("should preserve currency when input amount is zero", () => {
        const price = priceUsdc(0n);
        const result = scalePrice(price, 0.5);
        expect(result.currency).toBe(price.currency);
        expect(result.amount).toBe(0n);
      });
    });

    describe("type preservation", () => {
      it("should preserve PriceUsdc type", () => {
        const price: PriceUsdc = priceUsdc(1000000n);
        const result: PriceUsdc = scalePrice(price, 0.5);
        expect(result.currency).toBe("USDC");
      });

      it("should preserve PriceEth type", () => {
        const price: PriceEth = priceEth(1000000000000000000n);
        const result: PriceEth = scalePrice(price, 0.5);
        expect(result.currency).toBe("ETH");
      });

      it("should preserve PriceDai type", () => {
        const price: PriceDai = priceDai(1000000000000000000n);
        const result: PriceDai = scalePrice(price, 0.5);
        expect(result.currency).toBe("DAI");
      });
    });

    describe("error handling", () => {
      it("should throw on negative scale factor", () => {
        const price = priceUsdc(1000000n);
        expect(() => scalePrice(price, -0.5)).toThrow("scaleFactor must be non-negative");
      });

      it("should throw on NaN scale factor", () => {
        const price = priceUsdc(1000000n);
        expect(() => scalePrice(price, Number.NaN)).toThrow("scaleFactor must be a finite number");
      });

      it("should throw on infinite scale factor", () => {
        const price = priceUsdc(1000000n);
        expect(() => scalePrice(price, Number.POSITIVE_INFINITY)).toThrow(
          "scaleFactor must be a finite number",
        );
      });
    });
  });

  describe("parseEth", () => {
    describe("correct format and decimals", () => {
      it("should return PriceEth type with correct currency", () => {
        const result = parseEth("1");
        expect(result).toHaveProperty("currency", CurrencyIds.ETH);
        expect(result).toHaveProperty("amount");
        expect(result.currency).toBe(CurrencyIds.ETH);
        expect(typeof result.amount).toBe("bigint");
      });

      it("should use 18 decimals from getCurrencyInfo", () => {
        const currencyInfo = getCurrencyInfo(CurrencyIds.ETH);
        expect(currencyInfo.decimals).toBe(18);

        // Test that it uses 18 decimals by parsing a value with 18 decimal places
        const result = parseEth("1.123456789012345678");
        expect(result.amount).toBe(1123456789012345678n);
      });

      it("should parse integer ETH values correctly", () => {
        expect(parseEth("1")).toEqual({
          currency: CurrencyIds.ETH,
          amount: 1000000000000000000n, // 1 ETH = 10^18 wei
        } satisfies PriceEth);

        expect(parseEth("0")).toEqual({
          currency: CurrencyIds.ETH,
          amount: 0n,
        } satisfies PriceEth);

        expect(parseEth("123")).toEqual({
          currency: CurrencyIds.ETH,
          amount: 123000000000000000000n,
        } satisfies PriceEth);
      });

      it("should parse decimal ETH values correctly", () => {
        expect(parseEth("0.015")).toEqual({
          currency: CurrencyIds.ETH,
          amount: 15000000000000000n, // 0.015 ETH
        } satisfies PriceEth);

        expect(parseEth("0.5")).toEqual({
          currency: CurrencyIds.ETH,
          amount: 500000000000000000n, // 0.5 ETH
        } satisfies PriceEth);

        expect(parseEth("123.456789012345678")).toEqual({
          currency: CurrencyIds.ETH,
          amount: 123456789012345678000n,
        } satisfies PriceEth);
      });

      it("should handle small ETH values (minimum unit)", () => {
        expect(parseEth("0.000000000000000001")).toEqual({
          currency: CurrencyIds.ETH,
          amount: 1n, // 1 wei
        } satisfies PriceEth);
      });

      it("should handle maximum precision (18 decimal places)", () => {
        expect(parseEth("1.123456789012345678")).toEqual({
          currency: CurrencyIds.ETH,
          amount: 1123456789012345678n,
        } satisfies PriceEth);
      });
    });

    describe("error handling", () => {
      it("should throw on invalid format", () => {
        expect(() => parseEth("abc")).toThrow();
        expect(() => parseEth("1.2.3")).toThrow();
      });

      it("should throw on empty string", () => {
        expect(() => parseEth("")).toThrow("amount must be a non-negative decimal string");
      });

      it("should throw on whitespace-only string", () => {
        expect(() => parseEth("   ")).toThrow("amount must be a non-negative decimal string");
        expect(() => parseEth("\t")).toThrow("amount must be a non-negative decimal string");
        expect(() => parseEth("\n")).toThrow("amount must be a non-negative decimal string");
      });

      it("should throw on negative values", () => {
        expect(() => parseEth("-1")).toThrow("amount must be a non-negative decimal string");
        expect(() => parseEth("-0.5")).toThrow("amount must be a non-negative decimal string");
        expect(() => parseEth("-123.456")).toThrow("amount must be a non-negative decimal string");
      });
    });
  });

  describe("parseUsdc", () => {
    describe("correct format and decimals", () => {
      it("should return PriceUsdc type with correct currency", () => {
        const result = parseUsdc("1");
        expect(result).toHaveProperty("currency", CurrencyIds.USDC);
        expect(result).toHaveProperty("amount");
        expect(result.currency).toBe(CurrencyIds.USDC);
        expect(typeof result.amount).toBe("bigint");
      });

      it("should use 6 decimals from getCurrencyInfo", () => {
        const currencyInfo = getCurrencyInfo(CurrencyIds.USDC);
        expect(currencyInfo.decimals).toBe(6);

        // Test that it uses 6 decimals by parsing a value with 6 decimal places
        const result = parseUsdc("1.123456");
        expect(result.amount).toBe(1123456n);
      });

      it("should parse integer USDC values correctly", () => {
        expect(parseUsdc("1")).toEqual({
          currency: CurrencyIds.USDC,
          amount: 1000000n, // 1 USDC = 10^6 smallest units
        } satisfies PriceUsdc);

        expect(parseUsdc("0")).toEqual({
          currency: CurrencyIds.USDC,
          amount: 0n,
        } satisfies PriceUsdc);

        expect(parseUsdc("123")).toEqual({
          currency: CurrencyIds.USDC,
          amount: 123000000n,
        } satisfies PriceUsdc);
      });

      it("should parse decimal USDC values correctly", () => {
        expect(parseUsdc("123.45678")).toEqual({
          currency: CurrencyIds.USDC,
          amount: 123456780n,
        } satisfies PriceUsdc);

        expect(parseUsdc("0.001")).toEqual({
          currency: CurrencyIds.USDC,
          amount: 1000n,
        } satisfies PriceUsdc);

        expect(parseUsdc("1.5")).toEqual({
          currency: CurrencyIds.USDC,
          amount: 1500000n,
        } satisfies PriceUsdc);
      });

      it("should handle small USDC values (minimum unit)", () => {
        expect(parseUsdc("0.000001")).toEqual({
          currency: CurrencyIds.USDC,
          amount: 1n, // 1 smallest unit
        } satisfies PriceUsdc);
      });

      it("should handle maximum precision (6 decimal places)", () => {
        expect(parseUsdc("1.123456")).toEqual({
          currency: CurrencyIds.USDC,
          amount: 1123456n,
        } satisfies PriceUsdc);
      });
    });

    describe("error handling", () => {
      it("should throw on invalid format", () => {
        expect(() => parseUsdc("abc")).toThrow();
        expect(() => parseUsdc("1.2.3")).toThrow();
      });

      it("should throw on empty string", () => {
        expect(() => parseUsdc("")).toThrow("amount must be a non-negative decimal string");
      });

      it("should throw on whitespace-only string", () => {
        expect(() => parseUsdc("   ")).toThrow("amount must be a non-negative decimal string");
        expect(() => parseUsdc("\t")).toThrow("amount must be a non-negative decimal string");
        expect(() => parseUsdc("\n")).toThrow("amount must be a non-negative decimal string");
      });

      it("should throw on negative values", () => {
        expect(() => parseUsdc("-1")).toThrow("amount must be a non-negative decimal string");
        expect(() => parseUsdc("-0.5")).toThrow("amount must be a non-negative decimal string");
        expect(() => parseUsdc("-123.456")).toThrow("amount must be a non-negative decimal string");
      });
    });
  });

  describe("parseDai", () => {
    describe("correct format and decimals", () => {
      it("should return PriceDai type with correct currency", () => {
        const result = parseDai("1");
        expect(result).toHaveProperty("currency", CurrencyIds.DAI);
        expect(result).toHaveProperty("amount");
        expect(result.currency).toBe(CurrencyIds.DAI);
        expect(typeof result.amount).toBe("bigint");
      });

      it("should use 18 decimals from getCurrencyInfo", () => {
        const currencyInfo = getCurrencyInfo(CurrencyIds.DAI);
        expect(currencyInfo.decimals).toBe(18);

        // Test that it uses 18 decimals by parsing a value with 18 decimal places
        const result = parseDai("1.123456789012345678");
        expect(result.amount).toBe(1123456789012345678n);
      });

      it("should parse integer DAI values correctly", () => {
        expect(parseDai("1")).toEqual({
          currency: CurrencyIds.DAI,
          amount: 1000000000000000000n, // 1 DAI = 10^18 smallest units
        } satisfies PriceDai);

        expect(parseDai("0")).toEqual({
          currency: CurrencyIds.DAI,
          amount: 0n,
        } satisfies PriceDai);

        expect(parseDai("123")).toEqual({
          currency: CurrencyIds.DAI,
          amount: 123000000000000000000n,
        } satisfies PriceDai);
      });

      it("should parse decimal DAI values correctly", () => {
        expect(parseDai("123.456789012345678")).toEqual({
          currency: CurrencyIds.DAI,
          amount: 123456789012345678000n,
        } satisfies PriceDai);

        expect(parseDai("0.001")).toEqual({
          currency: CurrencyIds.DAI,
          amount: 1000000000000000n,
        } satisfies PriceDai);

        expect(parseDai("0.5")).toEqual({
          currency: CurrencyIds.DAI,
          amount: 500000000000000000n,
        } satisfies PriceDai);
      });

      it("should handle small DAI values (minimum unit)", () => {
        expect(parseDai("0.000000000000000001")).toEqual({
          currency: CurrencyIds.DAI,
          amount: 1n, // 1 smallest unit
        } satisfies PriceDai);
      });

      it("should handle maximum precision (18 decimal places)", () => {
        expect(parseDai("1.123456789012345678")).toEqual({
          currency: CurrencyIds.DAI,
          amount: 1123456789012345678n,
        } satisfies PriceDai);
      });
    });

    describe("error handling", () => {
      it("should throw on invalid format", () => {
        expect(() => parseDai("abc")).toThrow();
        expect(() => parseDai("1.2.3")).toThrow();
      });

      it("should throw on empty string", () => {
        expect(() => parseDai("")).toThrow("amount must be a non-negative decimal string");
      });

      it("should throw on whitespace-only string", () => {
        expect(() => parseDai("   ")).toThrow("amount must be a non-negative decimal string");
        expect(() => parseDai("\t")).toThrow("amount must be a non-negative decimal string");
        expect(() => parseDai("\n")).toThrow("amount must be a non-negative decimal string");
      });

      it("should throw on negative values", () => {
        expect(() => parseDai("-1")).toThrow("amount must be a non-negative decimal string");
        expect(() => parseDai("-0.5")).toThrow("amount must be a non-negative decimal string");
        expect(() => parseDai("-123.456")).toThrow("amount must be a non-negative decimal string");
      });
    });
  });
});
