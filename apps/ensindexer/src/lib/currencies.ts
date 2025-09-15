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
    ["0xA0b86a33E6417c5Dd4Baf8C54e5de49E293E9169"]: CurrencyIds.USDC,
    ["0x6B175474E89094C44Da98b954EedeAC495271d0F"]: CurrencyIds.DAI,
  },
  [base.id]: {
    [zeroAddress]: CurrencyIds.ETH,
    ["0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"]: CurrencyIds.USDC,
    ["0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb"]: CurrencyIds.DAI,
  },
  [optimism.id]: {
    [zeroAddress]: CurrencyIds.ETH,
    ["0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85"]: CurrencyIds.USDC,
    ["0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1"]: CurrencyIds.DAI,
  },
  [linea.id]: {
    [zeroAddress]: CurrencyIds.ETH,
    ["0x176211869cA2b568f2A7D4EE941E073a821EE1ff"]: CurrencyIds.USDC,
    ["0x4AF15ec2A0BD43Db75dd04E62FAA3B8EF36b00d5"]: CurrencyIds.DAI,
  },

  /** sepolia namespace */
  [sepolia.id]: {
    [zeroAddress]: CurrencyIds.ETH,
    ["0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238"]: CurrencyIds.USDC,
    ["0x3e622317f8C93f7328350cF0B56d9eD4C620C5d6"]: CurrencyIds.DAI,
  },
  [baseSepolia.id]: {
    [zeroAddress]: CurrencyIds.ETH,
    ["0x036CbD53842c5426634e7929541eC2318f3dCF7e"]: CurrencyIds.USDC,
    ["0x7368C6C68a4b2b68F90DB2e8F5E3b8E1E5e4F5c7"]: CurrencyIds.DAI,
  },
  [lineaSepolia.id]: {
    [zeroAddress]: CurrencyIds.ETH,
    ["0x176211869cA2b568f2A7D4EE941E073a821EE1ff"]: CurrencyIds.USDC,
    ["0x4AF15ec2A0BD43Db75dd04E62FAA3B8EF36b00d5"]: CurrencyIds.DAI,
  },

  /** holesky namespace */
  [holesky.id]: {
    [zeroAddress]: CurrencyIds.ETH,
    ["0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238"]: CurrencyIds.USDC,
    ["0x3e622317f8C93f7328350cF0B56d9eD4C620C5d6"]: CurrencyIds.DAI,
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
