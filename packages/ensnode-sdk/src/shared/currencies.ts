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

export interface SerializedPrice extends Omit<Price, "amount"> {
  currency: CurrencyId;

  /**
   * Serialized representation of a {@link Price.amount} which is the amount of
   * the currency in the smallest unit of the currency as a string
   * (see {@link CurrencyInfo.decimals} for the currency).
   */
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

export const getCurrencyInfo = (currencyId: CurrencyId): CurrencyInfo => currencyInfo[currencyId];
