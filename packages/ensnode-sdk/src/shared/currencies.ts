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

export interface Price {
  currency: CurrencyId;

  /**
   * The amount of the currency in the smallest unit of the currency. (see
   * decimals of the {@link CurrencyConfig} for the currency).
   *
   * Guaranteed to be non-negative.
   */
  amount: bigint;
}

export interface SerializedPrice extends Omit<Price, "amount"> {
  currency: CurrencyId;

  /**
   * Serialized representation of a {@link Price.amount} which is the amount of
   * the currency in the smallest unit of the currency as a string.
   * (see decimals of the {@link CurrencyConfig} for the currency).
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
    name: "Ethereum",
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
