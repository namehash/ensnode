import {
  ChainAddress,
  ChainId,
  DatasourceNames,
  ENSNamespaceId,
  isChainAddressEqual,
  maybeGetDatasourceContractChainAddress,
} from "@ensnode/datasources";
import {
  BASENAMES_NODE,
  ETH_NODE,
  LINEANAMES_NODE,
  LabelHash,
  type Node,
  makeSubdomainNode,
  uint256ToHex32,
} from "@ensnode/ensnode-sdk";
import { Address, isAddressEqual } from "viem";
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

export const TokenTypes = {
  ERC721: "ERC721",
  ERC1155: "ERC1155",
} as const;

export type TokenType = (typeof TokenTypes)[keyof typeof TokenTypes];

/**
 * A uint256 value that identifies a specific token within a NFT contract.
 */
export type TokenId = bigint;

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
 * A contract that issues tokenized ENS names.
 */
export interface TokenIssuingContract {
  /**
   * The ChainAddress of the token issuing contract.
   */
  contract: ChainAddress;

  /**
   * Applies the contract's logic for converting from the token id
   * representation of a name to the domain id (Node) of the name.
   */
  getDomainId: (tokenId: TokenId) => Node;
}

/**
 * Converts the tokenId from an ENS name token-issuing contract to a Node
 * for the case that the contract generates each tokenId using namehash of
 * the full name.
 *
 * @param tokenId - The tokenId to convert
 * @returns The Node of the tokenId
 */
export const nameHashGeneratedTokenIdToNode = (tokenId: TokenId): Node => {
  return uint256ToHex32(tokenId);
};

/**
 * Converts the tokenId from an ENS name token-issuing contract to a Node
 * for the case that the contract generates each tokenId using labelhash of
 * the direct subname of the parent node.
 *
 * @param tokenId - The tokenId to convert
 * @param parentNode - the parent Node that the token issuing contract issues subnames under
 * @returns The Node of the tokenId issued under the parentNode
 */
export const labelHashGeneratedTokenIdToNode = (tokenId: TokenId, parentNode: Node): Node => {
  const labelHash: LabelHash = uint256ToHex32(tokenId);
  return makeSubdomainNode(labelHash, parentNode);
};

/**
 * Gets the contracts known to provide tokenized name ownership within the
 * specified namespace.
 *
 * @param namespaceId - The ENSNamespace identifier (e.g. 'mainnet', 'sepolia', 'holesky', 'ens-test-env')
 * @returns an array of 0 or more known TokenIssuingContract for the specified namespace
 */
export const getKnownTokenIssuingContracts = (
  namespaceId: ENSNamespaceId,
): TokenIssuingContract[] => {
  const ethBaseRegistrar = maybeGetDatasourceContractChainAddress(
    namespaceId,
    DatasourceNames.ENSRoot,
    "BaseRegistrar",
  );
  const nameWrapper = maybeGetDatasourceContractChainAddress(
    namespaceId,
    DatasourceNames.ENSRoot,
    "NameWrapper",
  );
  const threeDnsBaseRegistrar = maybeGetDatasourceContractChainAddress(
    namespaceId,
    DatasourceNames.ThreeDNSBase,
    "ThreeDNSToken",
  );
  const threeDnsOptimismRegistrar = maybeGetDatasourceContractChainAddress(
    namespaceId,
    DatasourceNames.ThreeDNSOptimism,
    "ThreeDNSToken",
  );
  const lineanamesRegistrar = maybeGetDatasourceContractChainAddress(
    namespaceId,
    DatasourceNames.Lineanames,
    "BaseRegistrar",
  );
  const basenamesRegistrar = maybeGetDatasourceContractChainAddress(
    namespaceId,
    DatasourceNames.Basenames,
    "BaseRegistrar",
  );

  const result: TokenIssuingContract[] = [];

  if (ethBaseRegistrar) {
    result.push({
      contract: ethBaseRegistrar,
      getDomainId: (tokenId: TokenId): Node => {
        return labelHashGeneratedTokenIdToNode(tokenId, ETH_NODE);
      },
    });
  }

  if (nameWrapper) {
    result.push({
      contract: nameWrapper,
      getDomainId: (tokenId: TokenId): Node => {
        return nameHashGeneratedTokenIdToNode(tokenId);
      },
    });
  }

  if (threeDnsBaseRegistrar) {
    result.push({
      contract: threeDnsBaseRegistrar,
      getDomainId: (tokenId: TokenId): Node => {
        return nameHashGeneratedTokenIdToNode(tokenId);
      },
    });
  }

  if (threeDnsOptimismRegistrar) {
    result.push({
      contract: threeDnsOptimismRegistrar,
      getDomainId: (tokenId: TokenId): Node => {
        return nameHashGeneratedTokenIdToNode(tokenId);
      },
    });
  }

  if (lineanamesRegistrar) {
    result.push({
      contract: lineanamesRegistrar,
      getDomainId: (tokenId: TokenId): Node => {
        return labelHashGeneratedTokenIdToNode(tokenId, LINEANAMES_NODE);
      },
    });
  }

  if (basenamesRegistrar) {
    result.push({
      contract: basenamesRegistrar,
      getDomainId: (tokenId: TokenId): Node => {
        return labelHashGeneratedTokenIdToNode(tokenId, BASENAMES_NODE);
      },
    });
  }

  return result;
};

/**
 * Identifies if the provided ChainAddress is a known token issuing contract.
 *
 * @param namespaceId - The ENSNamespace identifier (e.g. 'mainnet', 'sepolia', 'holesky', 'ens-test-env')
 * @param chainAddress - The ChainAddress to check
 * @returns a boolean indicating if the provided ChainAddress is a known token issuing contract
 */
export const isKnownTokenIssuingContract = (
  namespaceId: ENSNamespaceId,
  chainAddress: ChainAddress,
): boolean => {
  const knownTokenIssuingContracts = getKnownTokenIssuingContracts(namespaceId);
  return knownTokenIssuingContracts.some((tokenIssuingContract) =>
    isChainAddressEqual(tokenIssuingContract.contract, chainAddress),
  );
};

/**
 * Gets the domainId (Node) for a given NFT from contract with tokenId on the specified namespace.
 *
 * @param namespaceId - The ENSNamespace identifier (e.g. 'mainnet', 'sepolia', 'holesky', 'ens-test-env')
 * @param contract - The ChainAddress of the NFT contract
 * @param tokenId - The tokenId of the NFT
 * @returns the domainId (Node) for ENS name associated with the NFT
 * @throws an error if the contract is not a known token issuing contract in the specified namespace
 */
export function getDomainIdByTokenId(
  namespaceId: ENSNamespaceId,
  contract: ChainAddress,
  tokenId: TokenId,
): Node {
  const knownTokenIssuingContracts = getKnownTokenIssuingContracts(namespaceId);
  const knownTokenIssuingContract = knownTokenIssuingContracts.find((tokenIssuingContract) =>
    isChainAddressEqual(tokenIssuingContract.contract, contract),
  );
  if (!knownTokenIssuingContract) {
    throw new Error(
      `The contract at address ${contract.address} on chain ${contract.chainId} is not a known token issuing contract in the ${namespaceId} namespace`,
    );
  }

  return knownTokenIssuingContract.getDomainId(tokenId);
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
 * Identifies if the provided ChainAddress is a supported currency contract.
 *
 * @param contract - The ChainAddress of the contract to check
 * @returns a boolean indicating if the provided ChainAddress is a supported currency contract
 */
export const isSupportedCurrencyContract = (contract: ChainAddress): boolean => {
  const supportedCurrencies = getSupportedCurrencies(contract.chainId);
  return supportedCurrencies.some(
    (currency) => currency.address && isAddressEqual(currency.address, contract.address),
  );
};
