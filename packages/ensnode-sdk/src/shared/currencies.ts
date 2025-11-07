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
 * Serialized representation of {@link Price}.
 */
export interface SerializedPrice extends Omit<Price, "amount"> {
  currency: CurrencyId;

  amount: string;
}

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
