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

import { getChainIdsInNamespace } from "@/lib/datasource-helpers";
import { ENSNamespaceId, getENSNamespace } from "@ensnode/datasources";
import { AccountId, ChainId, accountIdEqual, uniq } from "@ensnode/ensnode-sdk";
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

export interface CurrencyConfig {
  id: CurrencyId;
  name: string;
  decimals: number;
}

const currencyConfigs: Record<CurrencyId, CurrencyConfig> = {
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

export const getCurrencyConfig = (currencyId: CurrencyId): CurrencyConfig => {
  return currencyConfigs[currencyId];
};

// NOTE: this mapping currently only considers the subset of chains where we have
// supported token issuing contracts.
const knownCurrencyContracts: Record<ChainId, Record<CurrencyId, Address>> = {
  /** mainnet namespace */
  [mainnet.id]: {
    [CurrencyIds.ETH]: zeroAddress,
    [CurrencyIds.USDC]: "0xA0b86a33E6417c5Dd4Baf8C54e5de49E293E9169",
    [CurrencyIds.DAI]: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
  },
  [base.id]: {
    [CurrencyIds.ETH]: zeroAddress,
    [CurrencyIds.USDC]: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    [CurrencyIds.DAI]: "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb",
  },
  [optimism.id]: {
    [CurrencyIds.ETH]: zeroAddress,
    [CurrencyIds.USDC]: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
    [CurrencyIds.DAI]: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1",
  },
  [linea.id]: {
    [CurrencyIds.ETH]: zeroAddress,
    [CurrencyIds.USDC]: "0x176211869cA2b568f2A7D4EE941E073a821EE1ff",
    [CurrencyIds.DAI]: "0x4AF15ec2A0BD43Db75dd04E62FAA3B8EF36b00d5",
  },

  /** sepolia namespace */
  [sepolia.id]: {
    [CurrencyIds.ETH]: zeroAddress,
    [CurrencyIds.USDC]: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
    [CurrencyIds.DAI]: "0x3e622317f8C93f7328350cF0B56d9eD4C620C5d6",
  },
  [baseSepolia.id]: {
    [CurrencyIds.ETH]: zeroAddress,
    [CurrencyIds.USDC]: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
    [CurrencyIds.DAI]: "0x7368C6C68a4b2b68F90DB2e8F5E3b8E1E5e4F5c7",
  },
  [lineaSepolia.id]: {
    [CurrencyIds.ETH]: zeroAddress,
    [CurrencyIds.USDC]: "0x176211869cA2b568f2A7D4EE941E073a821EE1ff",
    [CurrencyIds.DAI]: "0x4AF15ec2A0BD43Db75dd04E62FAA3B8EF36b00d5",
  },

  /** holesky namespace */
  [holesky.id]: {
    [CurrencyIds.ETH]: zeroAddress,
    [CurrencyIds.USDC]: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
    [CurrencyIds.DAI]: "0x3e622317f8C93f7328350cF0B56d9eD4C620C5d6",
  },
} as const;

/**
 * Gets the supported currency contracts for a given chain.
 *
 * @param chainId - The chain ID to get supported currency contracts for
 * @returns a record of currency ids to AccountIds for the given chain
 */
const getSupportedCurrencyContractsForChain = (
  chainId: ChainId,
): Record<CurrencyId, AccountId> => {
  let result = {} as Record<CurrencyId, AccountId>;

  const knownCurrencyContractsForChain = knownCurrencyContracts[chainId];
  if (!knownCurrencyContractsForChain) return result;

  for (const [currencyId, address] of Object.entries(knownCurrencyContractsForChain)) {
    result[currencyId as CurrencyId] = {
      address,
      chainId,
    } as AccountId;
  }

  return result;
};

/**
 * Gets the supported currency contracts for a given namespace.
 *
 * @param namespaceId - The ENSNamespace identifier (e.g. 'mainnet', 'sepolia', 'holesky',
 * 'ens-test-env')
 * @returns a record of currency ids to AccountIds for the given namespace
 */
const getSupportedCurrencyContractsForNamespace = (
  namespaceId: ENSNamespaceId,
): Record<CurrencyId, AccountId> => {
  let result = {} as Record<CurrencyId, AccountId>;
  const chainIds = getChainIdsInNamespace(namespaceId);
  for (const chainId of chainIds) {
    const supportedCurrencyContractsForChain = getSupportedCurrencyContractsForChain(chainId);
    result = { ...result, ...supportedCurrencyContractsForChain };
  }

  return result;
};

/**
 * Gets the currency id for the given contract in the specified namespace.
 *
 * @param namespaceId - The ENSNamespace identifier (e.g. 'mainnet', 'sepolia', 'holesky',
 * 'ens-test-env')
 * @param contract - The AccountId of the contract to get the currency id for
 * @returns the currency id for the given contract in the specified namespace, or
 *          null if the contract is not a supported currency contract in the
 *          specified namespace
 */
export const getCurrencyIdForContract = (
  namespaceId: ENSNamespaceId,
  contract: AccountId,
): CurrencyId | null => {
  const supportedCurrencyContracts = getSupportedCurrencyContractsForNamespace(namespaceId);

  for (const [currencyId, supportedCurrencyContract] of Object.entries(
    supportedCurrencyContracts,
  )) {
    if (accountIdEqual(supportedCurrencyContract, contract)) {
      return currencyId as CurrencyId;
    }
  }

  return null;
};
