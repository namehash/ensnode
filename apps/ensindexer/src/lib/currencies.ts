import {
  base,
  baseSepolia,
  holesky,
  linea,
  lineaSepolia,
  mainnet,
  optimism,
  sepolia,
} from "viem/chains";

import { AccountId, ChainId } from "@ensnode/ensnode-sdk";
import { Address, zeroAddress } from "viem";

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
   * decimals of the CurrencyConfig for the currency).
   *
   * Guaranteed to be non-negative.
   */
  amount: bigint;
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

// NOTE: this mapping currently only considers the subset of chains where we have
// supported token issuing contracts.
const SUPPORTED_CURRENCY_CONTRACTS: Record<ChainId, Record<Address, CurrencyId>> = {
  /** mainnet namespace */
  [mainnet.id]: {
    [zeroAddress]: CurrencyIds.ETH,
    ["0xa0b86a33e6417c5dd4baf8c54e5de49e293e9169"]: CurrencyIds.USDC,
    ["0x6b175474e89094c44da98b954eedeac495271d0f"]: CurrencyIds.DAI,
  },
  [base.id]: {
    [zeroAddress]: CurrencyIds.ETH,
    ["0x833589fcd6edb6e08f4c7c32d4f71b54bda02913"]: CurrencyIds.USDC,
    ["0x50c5725949a6f0c72e6c4a641f24049a917db0cb"]: CurrencyIds.DAI,
  },
  [optimism.id]: {
    [zeroAddress]: CurrencyIds.ETH,
    ["0x0b2c639c533813f4aa9d7837caf62653d097ff85"]: CurrencyIds.USDC,
    ["0xda10009cbd5d07dd0cecc66161fc93d7c9000da1"]: CurrencyIds.DAI,
  },
  [linea.id]: {
    [zeroAddress]: CurrencyIds.ETH,
    ["0x176211869ca2b568f2a7d4ee941e073a821ee1ff"]: CurrencyIds.USDC,
    ["0x4af15ec2a0bd43db75dd04e62faa3b8ef36b00d5"]: CurrencyIds.DAI,
  },

  /** sepolia namespace */
  [sepolia.id]: {
    [zeroAddress]: CurrencyIds.ETH,
    ["0x1c7d4b196cb0c7b01d743fbc6116a902379c7238"]: CurrencyIds.USDC,
    ["0x3e622317f8c93f7328350cf0b56d9eD4c620c5d6"]: CurrencyIds.DAI,
  },
  [baseSepolia.id]: {
    [zeroAddress]: CurrencyIds.ETH,
    ["0x036cbd53842c5426634e7929541ec2318f3dcf7e"]: CurrencyIds.USDC,
    ["0x7368c6c68a4b2b68f90db2e8f5e3b8e1e5e4f5c7"]: CurrencyIds.DAI,
  },
  [lineaSepolia.id]: {
    [zeroAddress]: CurrencyIds.ETH,
    ["0x176211869ca2b568f2a7d4ee941e073a821ee1ff"]: CurrencyIds.USDC,
    ["0x4af15ec2a0bd43db75dd04e62faa3b8ef36b00d5"]: CurrencyIds.DAI,
  },

  /** holesky namespace */
  [holesky.id]: {
    [zeroAddress]: CurrencyIds.ETH,
    ["0x1c7d4b196cb0c7b01d743fbc6116a902379c7238"]: CurrencyIds.USDC,
    ["0x3e622317f8c93f7328350cf0b56d9ed4c620c5d6"]: CurrencyIds.DAI,
  },
};

/**
 * Gets the currency id for the given contract.
 *
 * @param contract - The AccountId of the contract to get the currency id for
 * @returns The CurrencyId for the given contract, or null if the contract is not supported
 */
export const getCurrencyIdForContract = ({ chainId, address }: AccountId): CurrencyId | null => {
  return SUPPORTED_CURRENCY_CONTRACTS[chainId]?.[address] ?? null;
};
