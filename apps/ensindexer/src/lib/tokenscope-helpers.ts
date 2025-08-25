import {
  DatasourceNames,
  ENSNamespaceId,
  ENSNamespaceIds,
  getDatasource,
} from "@ensnode/datasources";
import { BASE_NODE, ChainId, ETH_NODE, makeSubdomainNode } from "@ensnode/ensnode-sdk";
import { Address, Hex } from "viem";
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

/**
 * Identifies a specific address on a specific chain.
 */
export interface ChainAddress {
  chainId: ChainId;
  address: Address;
}

/**
 * Identifies a specific currency.
 */
export interface Currency {
  symbol: string;
  name: string;
  decimals: number;
  // For native currencies, address will be null
  address: Address | null;
}

/**
 * Identifies a specific currency on a specific chain.
 */
export interface ChainCurrency extends Currency {
  chainId: ChainId;
}

/**
 * Returns an array of 0 or more ChainAddress objects that are known to provide tokenized name ownership.
 *
 * @param namespaceId - The ENSNamespace identifier (e.g. 'mainnet', 'sepolia', 'holesky', 'ens-test-env')
 * @returns an array of 0 or more ChainAddress objects
 */
export const getKnownTokenIssuingContracts = (namespaceId: ENSNamespaceId): ChainAddress[] => {
  switch (namespaceId) {
    case ENSNamespaceIds.Mainnet: {
      const rootDatasource = getDatasource(namespaceId, DatasourceNames.ENSRoot);
      const lineanamesDatasource = getDatasource(namespaceId, DatasourceNames.Lineanames);
      const basenamesDatasource = getDatasource(namespaceId, DatasourceNames.Basenames);
      const threeDnsBaseDatasource = getDatasource(namespaceId, DatasourceNames.ThreeDNSBase);
      const threeDnsOptimismDatasource = getDatasource(
        namespaceId,
        DatasourceNames.ThreeDNSOptimism,
      );
      return [
        // Eth Token - Mainnet
        {
          chainId: rootDatasource.chain.id,
          address: rootDatasource.contracts["BaseRegistrar"].address,
        },
        // NameWrapper Token - Mainnet
        {
          chainId: rootDatasource.chain.id,
          address: rootDatasource.contracts["NameWrapper"].address,
        },
        // 3DNS Token - Optimism
        {
          chainId: threeDnsOptimismDatasource.chain.id,
          address: threeDnsOptimismDatasource.contracts["ThreeDNSToken"].address,
        },
        // 3DNS Token - Base
        {
          chainId: threeDnsBaseDatasource.chain.id,
          address: threeDnsBaseDatasource.contracts["ThreeDNSToken"].address,
        },
        // Linea Names Token - Linea
        {
          chainId: lineanamesDatasource.chain.id,
          address: lineanamesDatasource.contracts["BaseRegistrar"].address,
        },
        // Base Names Token - Base
        {
          chainId: basenamesDatasource.chain.id,
          address: basenamesDatasource.contracts["BaseRegistrar"].address,
        },
      ];
    }
    case ENSNamespaceIds.Sepolia: {
      const rootDatasource = getDatasource(namespaceId, DatasourceNames.ENSRoot);
      const basenamesDatasource = getDatasource(namespaceId, DatasourceNames.Basenames);
      const lineanamesDatasource = getDatasource(namespaceId, DatasourceNames.Lineanames);

      return [
        {
          // ENS Token - Sepolia
          chainId: rootDatasource.chain.id,
          address: rootDatasource.contracts["BaseRegistrar"].address,
        },
        {
          // NameWrapper Token - Sepolia
          chainId: rootDatasource.chain.id,
          address: rootDatasource.contracts["NameWrapper"].address,
        },
        {
          // Basenames Token - Base Sepolia
          chainId: basenamesDatasource.chain.id,
          address: basenamesDatasource.contracts["BaseRegistrar"].address,
        },
        {
          // Lineanames Token - Linea Sepolia
          chainId: lineanamesDatasource.chain.id,
          address: lineanamesDatasource.contracts["BaseRegistrar"].address,
        },
      ];
    }
    case ENSNamespaceIds.Holesky: {
      const rootDatasource = getDatasource(namespaceId, DatasourceNames.ENSRoot);
      return [
        {
          // ENS Token - Holesky
          chainId: rootDatasource.chain.id,
          address: rootDatasource.contracts["BaseRegistrar"].address,
        },
        {
          // NameWrapper Token - Holesky
          chainId: rootDatasource.chain.id,
          address: rootDatasource.contracts["NameWrapper"].address,
        },
      ];
    }
    case ENSNamespaceIds.EnsTestEnv: {
      const rootDatasource = getDatasource(namespaceId, DatasourceNames.ENSRoot);
      return [
        {
          // ENS Token - EnsTestEnv
          chainId: rootDatasource.chain.id,
          address: rootDatasource.contracts["BaseRegistrar"].address,
        },
        {
          // NameWrapper Token - EnsTestEnv
          chainId: rootDatasource.chain.id,
          address: rootDatasource.contracts["NameWrapper"].address,
        },
      ];
    }
  }
};

/**
 * Returns a boolean indicating whether the provided ChainAddress is a known token issuing contract.
 *
 * @param namespaceId - The ENSNamespace identifier (e.g. 'mainnet', 'sepolia', 'holesky', 'ens-test-env')
 * @param chainAddress - The ChainAddress to check
 * @returns a boolean indicating whether the provided ChainAddress is a known token issuing contract
 */
export const isKnownTokenIssuingContract = (
  namespaceId: ENSNamespaceId,
  chainAddress: ChainAddress,
): boolean => {
  const knownContracts = getKnownTokenIssuingContracts(namespaceId);
  return knownContracts.some((contract) => isEqualChainAddress(contract, chainAddress));
};

/**
 * Returns a boolean indicating whether the provided ChainAddress objects are equal.
 *
 * @param address1 - The first ChainAddress to compare
 * @param address2 - The second ChainAddress to compare
 * @returns a boolean indicating whether the provided ChainAddress objects are equal
 */
export const isEqualChainAddress = (address1: ChainAddress, address2: ChainAddress): boolean => {
  return (
    address1.chainId === address2.chainId &&
    address1.address.toLowerCase() === address2.address.toLowerCase()
  );
};

/**
 * Get the domainId by contract address and tokenId
 * @param chainId - The chainId of the NFT
 * @param namespaceId - The ENSNamespace identifier (e.g. 'mainnet', 'sepolia', 'holesky', 'ens-test-env')
 * @param contractAddress - contract address of the NFT
 * @param tokenIdHex - tokenId of the NFT in hex
 */
export function getDomainIdByTokenId(
  chainId: ChainId,
  namespaceId: ENSNamespaceId,
  contractAddress: Address,
  tokenIdHex: Hex,
): Hex {
  const ensDataSource = getDatasource(namespaceId, DatasourceNames.ENSRoot);
  if (ensDataSource.chain.id !== chainId) {
    throw new Error(`Namespace ${namespaceId} is not deployed on chain ${chainId}`);
  }
  const baseRegistrarContractAddress = ensDataSource.contracts["BaseRegistrar"].address;

  // OLD ENS Registry: tokenId is labelhash so need to convert to namehash
  if (contractAddress === baseRegistrarContractAddress) {
    return makeSubdomainNode(tokenIdHex, ETH_NODE);
  }

  const baseNamesDataSource = getDatasource(namespaceId, DatasourceNames.Basenames);
  if (baseNamesDataSource.chain.id !== chainId) {
    throw new Error(`Namespace ${namespaceId} is not deployed on chain ${chainId}`);
  }
  const basenamesContractAddress = baseNamesDataSource.contracts["BaseRegistrar"].address;

  // basenames: tokenId is labelhash so need to convert to namehash
  if (contractAddress === basenamesContractAddress) {
    return makeSubdomainNode(tokenIdHex, BASE_NODE);
  }

  // 3dns token id is already derived from namehash
  // linea token id is already derived from namehash
  return tokenIdHex;
}

// Well-known currencies
const ETH_CURRENCY = {
  symbol: "ETH",
  name: "Ethereum",
  decimals: 18,
  address: null,
} as const;

const CHAIN_CURRENCIES = {
  // Mainnet
  [mainnet.id]: [
    {
      symbol: "USDC",
      name: "USD Coin",
      decimals: 6,
      address: "0xA0b86a33E6417c5Dd4Baf8C54e5de49E293E9169" as Address,
    },
    {
      symbol: "DAI",
      name: "Dai Stablecoin",
      decimals: 18,
      address: "0x6B175474E89094C44Da98b954EedeAC495271d0F" as Address,
    },
  ],
  // Base
  [base.id]: [
    {
      symbol: "USDC",
      name: "USD Coin",
      decimals: 6,
      address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as Address,
    },
    {
      symbol: "DAI",
      name: "Dai Stablecoin",
      decimals: 18,
      address: "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb" as Address,
    },
  ],
  // Optimism
  [optimism.id]: [
    {
      symbol: "USDC",
      name: "USD Coin",
      decimals: 6,
      address: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85" as Address,
    },
    {
      symbol: "DAI",
      name: "Dai Stablecoin",
      decimals: 18,
      address: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1" as Address,
    },
  ],
  // Linea
  [linea.id]: [
    {
      symbol: "USDC",
      name: "USD Coin",
      decimals: 6,
      address: "0x176211869cA2b568f2A7D4EE941E073a821EE1ff" as Address,
    },
    {
      symbol: "DAI",
      name: "Dai Stablecoin",
      decimals: 18,
      address: "0x4AF15ec2A0BD43Db75dd04E62FAA3B8EF36b00d5" as Address,
    },
  ],
  // Sepolia
  [sepolia.id]: [
    {
      symbol: "USDC",
      name: "USD Coin",
      decimals: 6,
      address: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238" as Address,
    },
    {
      symbol: "DAI",
      name: "Dai Stablecoin",
      decimals: 18,
      address: "0x3e622317f8C93f7328350cF0B56d9eD4C620C5d6" as Address,
    },
  ],
  // Holesky
  [holesky.id]: [
    {
      symbol: "USDC",
      name: "USD Coin",
      decimals: 6,
      address: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238" as Address,
    },
    {
      symbol: "DAI",
      name: "Dai Stablecoin",
      decimals: 18,
      address: "0x3e622317f8C93f7328350cF0B56d9eD4C620C5d6" as Address,
    },
  ],
  // Base Sepolia
  [baseSepolia.id]: [
    {
      symbol: "USDC",
      name: "USD Coin",
      decimals: 6,
      address: "0x036CbD53842c5426634e7929541eC2318f3dCF7e" as Address,
    },
    {
      symbol: "DAI",
      name: "Dai Stablecoin",
      decimals: 18,
      address: "0x7368C6C68a4b2b68F90DB2e8F5E3b8E1E5e4F5c7" as Address,
    },
  ],
  // Linea Sepolia
  [lineaSepolia.id]: [
    {
      symbol: "USDC",
      name: "USD Coin",
      decimals: 6,
      address: "0x176211869cA2b568f2A7D4EE941E073a821EE1ff" as Address,
    },
    {
      symbol: "DAI",
      name: "Dai Stablecoin",
      decimals: 18,
      address: "0x4AF15ec2A0BD43Db75dd04E62FAA3B8EF36b00d5" as Address,
    },
  ],
} as const;

/**
 * Returns an array of supported currencies for a given chain ID.
 *
 * @param chainId - The chain ID to get supported currencies for
 * @returns an array of ChainCurrency objects representing supported currencies on the chain
 */
export const getSupportedCurrencies = (chainId: ChainId): ChainCurrency[] => {
  const chainCurrencies = CHAIN_CURRENCIES[chainId as keyof typeof CHAIN_CURRENCIES] || [];

  // Always add ETH as the native currency
  const currencies: ChainCurrency[] = [
    {
      ...ETH_CURRENCY,
      chainId,
    },
  ];

  // Add chain-specific currencies
  currencies.push(
    ...chainCurrencies.map((currency) => ({
      ...currency,
      chainId,
    })),
  );

  return currencies;
};

/**
 * Returns a boolean indicating whether the provided address is a known supported currency contract.
 *
 * @param chainId - The chain ID
 * @param address - The contract address to check
 * @returns a boolean indicating whether the address is a known supported currency contract
 */
export const isKnownCurrencyContract = (chainId: ChainId, address: Address): boolean => {
  const supportedCurrencies = getSupportedCurrencies(chainId);
  return supportedCurrencies.some(
    (currency) => currency.address && currency.address.toLowerCase() === address.toLowerCase(),
  );
};
