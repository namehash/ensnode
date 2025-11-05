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
  priceDai,
  priceEth,
  priceUsdc,
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
      expect(() => addPrices(priceEth(1n), priceDai(2n), priceEth(3n))).toThrowError(
        /All prices must have the same currency to be added together/i,
      );
    });
  });
});
