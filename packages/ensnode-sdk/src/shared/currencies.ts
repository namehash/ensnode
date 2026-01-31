import { parseUnits } from "viem";

import { scaleBigintByNumber } from "./numbers";

/**
 * Identifiers for supported currencies.
 *
 * TODO: Add support for WETH
 */
export const CurrencyIds = {
  ETH: "ETH",
  USDC: "USDC",
  DAI: "DAI",
} as const;

export type CurrencyId = (typeof CurrencyIds)[keyof typeof CurrencyIds];

/**
 * The amount of the currency in the smallest unit of the currency
 * (see {@link CurrencyInfo.decimals} for the currency).
 *
 * Guaranteed to be non-negative.
 */
export type CurrencyAmount = bigint;

/**
 * Serialized representation of {@link CurrencyAmount}.
 */
export type SerializedCurrencyAmount = string;

export interface PriceEth {
  currency: typeof CurrencyIds.ETH;

  amount: CurrencyAmount;
}

export interface PriceDai {
  currency: typeof CurrencyIds.DAI;

  amount: CurrencyAmount;
}

export interface PriceUsdc {
  currency: typeof CurrencyIds.USDC;

  amount: CurrencyAmount;
}

export type Price = PriceEth | PriceDai | PriceUsdc;

/**
 * Serialized representation of {@link PriceEth}.
 */
export interface SerializedPriceEth extends Omit<PriceEth, "amount"> {
  amount: SerializedCurrencyAmount;
}

/**
 * Serialized representation of {@link PriceDai}.
 */
export interface SerializedPriceDai extends Omit<PriceDai, "amount"> {
  amount: SerializedCurrencyAmount;
}

/**
 * Serialized representation of {@link PriceUsdc}.
 */
export interface SerializedPriceUsdc extends Omit<PriceUsdc, "amount"> {
  amount: SerializedCurrencyAmount;
}

/**
 * Serialized representation of {@link Price}.
 */
export type SerializedPrice = SerializedPriceEth | SerializedPriceDai | SerializedPriceUsdc;

export interface CurrencyInfo {
  id: CurrencyId;
  name: string;
  decimals: number;
}

const currencyInfo: Record<CurrencyId, CurrencyInfo> = {
  [CurrencyIds.ETH]: {
    id: CurrencyIds.ETH,
    name: "ETH",
    decimals: 18,
  },
  [CurrencyIds.USDC]: {
    id: CurrencyIds.USDC,
    name: "USDC",
    decimals: 6,
  },
  [CurrencyIds.DAI]: {
    id: CurrencyIds.DAI,
    name: "Dai Stablecoin",
    decimals: 18,
  },
};

/**
 * Get currency info for a provided currency.
 */
export function getCurrencyInfo(currencyId: CurrencyId): CurrencyInfo {
  return currencyInfo[currencyId];
}

/**
 * Create price in ETH for given amount.
 */
export function priceEth(amount: Price["amount"]): PriceEth {
  return {
    amount,
    currency: CurrencyIds.ETH,
  };
}

/**
 * Create price in USDC for given amount.
 */
export function priceUsdc(amount: Price["amount"]): PriceUsdc {
  return {
    amount,
    currency: CurrencyIds.USDC,
  };
}

/**
 * Create price in DAI for given amount.
 */
export function priceDai(amount: Price["amount"]): PriceDai {
  return {
    amount,
    currency: CurrencyIds.DAI,
  };
}

/**
 * Check if two prices have the same currency.
 */
export function isPriceCurrencyEqual(priceA: Price, priceB: Price): boolean {
  return priceA.currency === priceB.currency;
}

/**
 * Check if two {@link Price} values have the same currency and amount.
 */
export function isPriceEqual(priceA: Price, priceB: Price): boolean {
  return isPriceCurrencyEqual(priceA, priceB) && priceA.amount === priceB.amount;
}

/**
 * Add prices
 *
 * @param prices at least two {@link Price} values to be added together.
 * @returns total of all prices.
 * @throws if not all prices have the same currency.
 */
export function addPrices<const PriceType extends Price = Price>(
  ...prices: [PriceType, PriceType, ...PriceType[]]
): PriceType {
  const firstPrice = prices[0];
  const allPricesInSameCurrency = prices.every((price) => isPriceCurrencyEqual(firstPrice, price));

  if (allPricesInSameCurrency === false) {
    throw new Error("All prices must have the same currency to be added together.");
  }

  const { currency } = firstPrice;

  return prices.reduce(
    (acc, price) => ({
      amount: acc.amount + price.amount,
      currency,
    }),
    {
      amount: 0n,
      currency: firstPrice.currency,
    },
  ) as PriceType;
}

/**
 * Scales a Price object by a floating-point number while maintaining precision.
 *
 * **Important:** The precision of this method is bound to the precision of float
 * in JavaScript. For more information, see {@link scaleBigintByNumber}.
 *
 * @param price - The Price object to scale
 * @param scaleFactor - The number to multiply by (can be a decimal like 0.5)
 * @returns A new Price object with the scaled amount and same currency
 *
 * @throws {Error} If scaleFactor is negative, NaN, or infinite
 * @throws {Error} If price amount is negative
 *
 * @example
 * // Scale USDC price by 0.5
 * const price = priceUsdc(1000000n); // 1 USDC
 * const scaled = scalePrice(price, 0.5); // 0.5 USDC
 * // scaled = { currency: "USDC", amount: 500000n }
 *
 * @example
 * // Calculate 33.3% of ETH price
 * const ethPrice = priceEth(1000000000000000000n); // 1 ETH
 * const share = scalePrice(ethPrice, 0.333);
 * // share = { currency: "ETH", amount: 333000000000000000n }
 */
export function scalePrice<T extends Price>(price: T, scaleFactor: number): T {
  const scaledAmount = scaleBigintByNumber(price.amount, scaleFactor);

  return {
    ...price,
    amount: scaledAmount,
  };
}

/**
 * Parses a string representation of ETH into a {@link PriceEth} object.
 *
 * Uses {@link getCurrencyInfo} to get the correct number of decimals (18) for ETH
 * and {@link parseUnits} from viem to convert the decimal string to a bigint.
 *
 * **Note:** This function uses viem's `parseUnits`, which has permissive behavior:
 * - Empty strings are treated as "0"
 * - Negative values are allowed and will result in negative amounts
 * - Values with more than 18 decimal places will be truncated/rounded
 * - Only invalid non-numeric formats will throw an error
 *
 * @param value - The decimal string to parse (e.g., "0.015" for 0.015 ETH)
 * @returns A PriceEth object with the amount in wei (smallest unit)
 *
 * @throws {Error} If value is not a valid decimal string (e.g., "abc", "1.2.3")
 *
 * @example
 * parseEth("0.015") // returns { currency: "ETH", amount: 15000000000000000n }
 * parseEth("1") // returns { currency: "ETH", amount: 1000000000000000000n }
 * parseEth("123.456789012345678") // returns { currency: "ETH", amount: 123456789012345678000n }
 * parseEth("") // returns { currency: "ETH", amount: 0n }
 * parseEth("-1") // returns { currency: "ETH", amount: -1000000000000000000n }
 */
export function parseEth(value: string): PriceEth {
  const currencyInfo = getCurrencyInfo(CurrencyIds.ETH);
  const amount = parseUnits(value, currencyInfo.decimals);
  return priceEth(amount);
}

/**
 * Parses a string representation of USDC into a {@link PriceUsdc} object.
 *
 * Uses {@link getCurrencyInfo} to get the correct number of decimals (6) for USDC
 * and {@link parseUnits} from viem to convert the decimal string to a bigint.
 *
 * **Note:** This function uses viem's `parseUnits`, which has permissive behavior:
 * - Empty strings are treated as "0"
 * - Negative values are allowed and will result in negative amounts
 * - Values with more than 6 decimal places will be truncated/rounded
 * - Only invalid non-numeric formats will throw an error
 *
 * @param value - The decimal string to parse (e.g., "123.45678" for $123.45678)
 * @returns A PriceUsdc object with the amount in the smallest unit (6 decimals)
 *
 * @throws {Error} If value is not a valid decimal string (e.g., "abc", "1.2.3")
 *
 * @example
 * parseUsdc("123.45678") // returns { currency: "USDC", amount: 123456780n }
 * parseUsdc("1") // returns { currency: "USDC", amount: 1000000n }
 * parseUsdc("0.001") // returns { currency: "USDC", amount: 1000n }
 * parseUsdc("") // returns { currency: "USDC", amount: 0n }
 * parseUsdc("-1") // returns { currency: "USDC", amount: -1000000n }
 */
export function parseUsdc(value: string): PriceUsdc {
  const currencyInfo = getCurrencyInfo(CurrencyIds.USDC);
  const amount = parseUnits(value, currencyInfo.decimals);
  return priceUsdc(amount);
}

/**
 * Parses a string representation of DAI into a {@link PriceDai} object.
 *
 * Uses {@link getCurrencyInfo} to get the correct number of decimals (18) for DAI
 * and {@link parseUnits} from viem to convert the decimal string to a bigint.
 *
 * **Note:** This function uses viem's `parseUnits`, which has permissive behavior:
 * - Empty strings are treated as "0"
 * - Negative values are allowed and will result in negative amounts
 * - Values with more than 18 decimal places will be truncated/rounded
 * - Only invalid non-numeric formats will throw an error
 *
 * @param value - The decimal string to parse (e.g., "123.456789012345678" for 123.456789012345678 DAI)
 * @returns A PriceDai object with the amount in the smallest unit (18 decimals)
 *
 * @throws {Error} If value is not a valid decimal string (e.g., "abc", "1.2.3")
 *
 * @example
 * parseDai("123.456789012345678") // returns { currency: "DAI", amount: 123456789012345678000n }
 * parseDai("1") // returns { currency: "DAI", amount: 1000000000000000000n }
 * parseDai("0.001") // returns { currency: "DAI", amount: 1000000000000000n }
 * parseDai("") // returns { currency: "DAI", amount: 0n }
 * parseDai("-1") // returns { currency: "DAI", amount: -1000000000000000000n }
 */
export function parseDai(value: string): PriceDai {
  const currencyInfo = getCurrencyInfo(CurrencyIds.DAI);
  const amount = parseUnits(value, currencyInfo.decimals);
  return priceDai(amount);
}
